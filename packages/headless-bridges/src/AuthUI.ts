import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { AuthManager, AuthSession, LoginFlow } from './AuthManager';
import { BrowserProfileManager, BrowserProfile } from './BrowserProfileManager';

export interface AuthUIConfig {
  port: number;
  staticDir: string;
  enableCORS: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
}

export interface LoginRequest {
  platform: string;
  profileId?: string;
  credentials?: {
    username?: string;
    password?: string;
    email?: string;
  };
  stepData?: Record<string, any>;
}

export interface LoginResponse {
  success: boolean;
  sessionId?: string;
  nextStep?: string;
  error?: string;
  message?: string;
}

export interface UISession {
  id: string;
  platform: string;
  currentStep: string;
  stepData: Record<string, any>;
  startTime: number;
  lastActivity: number;
  attempts: number;
}

export class AuthUI {
  private app: express.Application;
  private config: AuthUIConfig;
  private authManager: AuthManager;
  private profileManager: BrowserProfileManager;
  private uiSessions: Map<string, UISession> = new Map();
  private server?: any;

  constructor(config: Partial<AuthUIConfig> = {}, authManager?: AuthManager, profileManager?: BrowserProfileManager) {
    this.config = {
      port: 3001,
      staticDir: 'auth-ui-static',
      enableCORS: true,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      maxLoginAttempts: 3,
      ...config
    };

    this.authManager = authManager || new AuthManager();
    this.profileManager = profileManager || new BrowserProfileManager();

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Start the auth UI server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.config.port, () => {
        console.log(`🌐 Auth UI server started on http://localhost:${this.config.port}`);
        console.log(`📱 Open your browser to manage authentication`);
        resolve();
      });

      this.server.on('error', (error: any) => {
        console.error('❌ Failed to start Auth UI server:', error);
        reject(error);
      });
    });
  }

  /**
   * Stop the auth UI server
   */
  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('🌐 Auth UI server stopped');
          resolve();
        });
      });
    }
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // JSON parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // CORS
    if (this.config.enableCORS) {
      this.app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        if (req.method === 'OPTIONS') {
          res.sendStatus(200);
        } else {
          next();
        }
      });
    }

    // Static files
    this.app.use(express.static(this.config.staticDir));

    // Session cleanup middleware
    this.app.use((req, res, next) => {
      this.cleanupExpiredSessions();
      next();
    });
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Serve main page
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(this.config.staticDir, 'index.html'));
    });

    // API Routes
    this.app.get('/api/platforms', this.getPlatforms.bind(this));
    this.app.get('/api/profiles/:platform', this.getProfiles.bind(this));
    this.app.post('/api/login/start', this.startLogin.bind(this));
    this.app.post('/api/login/step', this.processLoginStep.bind(this));
    this.app.get('/api/sessions', this.getSessions.bind(this));
    this.app.delete('/api/sessions/:sessionId', this.deleteSession.bind(this));
    this.app.post('/api/verify/:sessionId', this.verifySession.bind(this));
    this.app.get('/api/stats', this.getStats.bind(this));

    // Error handling
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Auth UI Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  /**
   * Get available platforms
   */
  private async getPlatforms(req: express.Request, res: express.Response): Promise<void> {
    try {
      const platforms = [
        {
          id: 'chatgpt',
          name: 'ChatGPT',
          description: 'OpenAI ChatGPT',
          url: 'https://chat.openai.com',
          requiresAuth: true,
          icon: '🤖'
        },
        {
          id: 'claude',
          name: 'Claude',
          description: 'Anthropic Claude',
          url: 'https://claude.ai',
          requiresAuth: true,
          icon: '🧠'
        },
        {
          id: 'bing',
          name: 'Bing Chat',
          description: 'Microsoft Bing Chat',
          url: 'https://www.bing.com/chat',
          requiresAuth: true,
          icon: '🔍'
        },
        {
          id: 'perplexity',
          name: 'Perplexity',
          description: 'Perplexity AI',
          url: 'https://www.perplexity.ai',
          requiresAuth: false,
          icon: '🔎'
        }
      ];

      res.json({ platforms });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get platforms' });
    }
  }

  /**
   * Get profiles for a platform
   */
  private async getProfiles(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { platform } = req.params;
      const profiles = this.profileManager.getProfilesByType(platform);

      const profileData = profiles.map(profile => ({
        id: profile.id,
        name: profile.name,
        description: profile.description,
        lastUsed: profile.lastUsed,
        usageCount: profile.usageCount,
        isActive: profile.isActive,
        hasAuthState: !!profile.authState,
        authStateValid: profile.authState?.isValid || false
      }));

      res.json({ profiles: profileData });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get profiles' });
    }
  }

  /**
   * Start login process
   */
  private async startLogin(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { platform, profileId, credentials }: LoginRequest = req.body;

      if (!platform) {
        res.status(400).json({ error: 'Platform is required' });
        return;
      }

      // Create UI session
      const uiSessionId = `ui-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const uiSession: UISession = {
        id: uiSessionId,
        platform,
        currentStep: 'start',
        stepData: credentials || {},
        startTime: Date.now(),
        lastActivity: Date.now(),
        attempts: 0
      };

      this.uiSessions.set(uiSessionId, uiSession);

      // Get login flow
      const loginFlow = this.getLoginFlow(platform);
      if (!loginFlow) {
        res.status(400).json({ error: `No login flow defined for ${platform}` });
        return;
      }

      const firstStep = loginFlow.steps[0];
      
      res.json({
        success: true,
        sessionId: uiSessionId,
        nextStep: firstStep.id,
        step: {
          id: firstStep.id,
          title: firstStep.title,
          description: firstStep.description,
          type: firstStep.type,
          placeholder: firstStep.placeholder,
          required: firstStep.required
        },
        message: `Starting login process for ${platform}`
      });

    } catch (error) {
      res.status(500).json({ error: 'Failed to start login process' });
    }
  }

  /**
   * Process login step
   */
  private async processLoginStep(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { sessionId, stepId, data } = req.body;

      const uiSession = this.uiSessions.get(sessionId);
      if (!uiSession) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      // Update session activity
      uiSession.lastActivity = Date.now();
      uiSession.stepData[stepId] = data;

      // Get login flow
      const loginFlow = this.getLoginFlow(uiSession.platform);
      if (!loginFlow) {
        res.status(400).json({ error: 'Login flow not found' });
        return;
      }

      // Find current step
      const currentStepIndex = loginFlow.steps.findIndex(step => step.id === stepId);
      if (currentStepIndex === -1) {
        res.status(400).json({ error: 'Step not found' });
        return;
      }

      // Check if this is the last step
      if (currentStepIndex === loginFlow.steps.length - 1) {
        // Complete login process
        const result = await this.completeLogin(uiSession, loginFlow);
        res.json(result);
      } else {
        // Move to next step
        const nextStep = loginFlow.steps[currentStepIndex + 1];
        res.json({
          success: true,
          sessionId,
          nextStep: nextStep.id,
          step: {
            id: nextStep.id,
            title: nextStep.title,
            description: nextStep.description,
            type: nextStep.type,
            placeholder: nextStep.placeholder,
            required: nextStep.required
          },
          message: `Proceed to ${nextStep.title}`
        });
      }

    } catch (error) {
      res.status(500).json({ error: 'Failed to process login step' });
    }
  }

  /**
   * Complete login process
   */
  private async completeLogin(uiSession: UISession, loginFlow: LoginFlow): Promise<LoginResponse> {
    try {
      console.log(`🔄 Completing login for ${uiSession.platform}...`);

      // Start actual login process
      const authSession = await this.authManager.guideLogin(uiSession.platform);

      if (authSession) {
        // Clean up UI session
        this.uiSessions.delete(uiSession.id);

        return {
          success: true,
          sessionId: authSession.id,
          message: `Successfully logged in to ${uiSession.platform}`
        };
      } else {
        uiSession.attempts++;
        
        if (uiSession.attempts >= this.config.maxLoginAttempts) {
          this.uiSessions.delete(uiSession.id);
          return {
            success: false,
            error: 'Maximum login attempts exceeded'
          };
        }

        return {
          success: false,
          error: 'Login failed, please try again'
        };
      }

    } catch (error) {
      return {
        success: false,
        error: `Login error: ${error.message}`
      };
    }
  }

  /**
   * Get all auth sessions
   */
  private async getSessions(req: express.Request, res: express.Response): Promise<void> {
    try {
      const sessions = this.authManager.getAllAuthSessions();
      
      const sessionData = sessions.map(session => ({
        id: session.id,
        platform: session.platform,
        profileId: session.profileId,
        startTime: session.startTime,
        lastVerified: session.lastVerified,
        isActive: session.isActive,
        verificationStatus: session.verificationStatus,
        duration: Date.now() - session.startTime
      }));

      res.json({ sessions: sessionData });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get sessions' });
    }
  }

  /**
   * Delete auth session
   */
  private async deleteSession(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const success = this.authManager.deleteAuthSession(sessionId);

      if (success) {
        res.json({ success: true, message: 'Session deleted successfully' });
      } else {
        res.status(404).json({ error: 'Session not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete session' });
    }
  }

  /**
   * Verify session
   */
  private async verifySession(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const result = await this.authManager.verifyLoginStatus(sessionId);

      res.json({
        success: result.isValid,
        isValid: result.isValid,
        reason: result.reason,
        requiresReauth: result.requiresReauth,
        timestamp: result.timestamp
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to verify session' });
    }
  }

  /**
   * Get statistics
   */
  private async getStats(req: express.Request, res: express.Response): Promise<void> {
    try {
      const authStats = this.authManager.getStats();
      const profileStats = this.profileManager.getStats();
      const uiSessionCount = this.uiSessions.size;

      res.json({
        auth: authStats,
        profiles: profileStats,
        uiSessions: uiSessionCount,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get statistics' });
    }
  }

  /**
   * Get login flow for platform
   */
  private getLoginFlow(platform: string): LoginFlow | null {
    const flows = new Map<string, LoginFlow>();

    // ChatGPT flow
    flows.set('chatgpt', {
      platform: 'chatgpt',
      steps: [
        {
          id: 'username',
          title: 'Username or Email',
          description: 'Enter your ChatGPT username or email address',
          type: 'input',
          placeholder: 'username@example.com',
          required: true
        },
        {
          id: 'password',
          title: 'Password',
          description: 'Enter your ChatGPT password',
          type: 'input',
          placeholder: 'Password',
          required: true
        },
        {
          id: 'captcha',
          title: 'Solve Captcha',
          description: 'If a captcha appears, solve it in the browser window',
          type: 'captcha'
        }
      ],
      successIndicators: ['[data-testid="send-button"]'],
      failureIndicators: ['[data-testid="error-message"]'],
      timeout: 60000
    });

    // Claude flow
    flows.set('claude', {
      platform: 'claude',
      steps: [
        {
          id: 'email',
          title: 'Email Address',
          description: 'Enter your Claude email address',
          type: 'input',
          placeholder: 'email@example.com',
          required: true
        },
        {
          id: 'password',
          title: 'Password',
          description: 'Enter your Claude password',
          type: 'input',
          placeholder: 'Password',
          required: true
        }
      ],
      successIndicators: ['[data-testid="send-button"]'],
      failureIndicators: ['[data-testid="error-message"]'],
      timeout: 60000
    });

    // Bing flow
    flows.set('bing', {
      platform: 'bing',
      steps: [
        {
          id: 'email',
          title: 'Microsoft Email',
          description: 'Enter your Microsoft account email',
          type: 'input',
          placeholder: 'email@outlook.com',
          required: true
        },
        {
          id: 'password',
          title: 'Password',
          description: 'Enter your Microsoft account password',
          type: 'input',
          placeholder: 'Password',
          required: true
        }
      ],
      successIndicators: ['[data-testid="send-button"]'],
      failureIndicators: ['[data-testid="error-message"]'],
      timeout: 60000
    });

    return flows.get(platform) || null;
  }

  /**
   * Cleanup expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.uiSessions) {
      if (now - session.lastActivity > this.config.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      this.uiSessions.delete(sessionId);
    }

    if (expiredSessions.length > 0) {
      console.log(`🧹 Cleaned up ${expiredSessions.length} expired UI sessions`);
    }
  }

  /**
   * Get server info
   */
  getServerInfo() {
    return {
      port: this.config.port,
      url: `http://localhost:${this.config.port}`,
      isRunning: !!this.server,
      config: this.config
    };
  }
} 