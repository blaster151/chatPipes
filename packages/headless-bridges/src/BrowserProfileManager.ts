import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface BrowserProfile {
  id: string;
  agentType: 'chatgpt' | 'claude' | 'perplexity' | 'bing';
  name: string;
  description?: string;
  executablePath?: string;
  storagePath: string;
  userAgent?: string;
  viewport?: { width: number; height: number };
  timezone?: string;
  locale?: string;
  geolocation?: { latitude: number; longitude: number };
  permissions?: string[];
  extraHeaders?: Record<string, string>;
  stealthSettings?: StealthSettings;
  authState?: AuthState;
  lastUsed?: number;
  usageCount?: number;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface StealthSettings {
  enabled: boolean;
  webglVendor?: string;
  webglRenderer?: string;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  platform?: string;
  language?: string;
  languages?: string[];
  cookieEnabled?: boolean;
  doNotTrack?: string;
  plugins?: PluginInfo[];
  canvasFingerprint?: string;
  audioFingerprint?: string;
  timezoneOffset?: number;
  screenResolution?: { width: number; height: number };
  colorDepth?: number;
  pixelDepth?: number;
  touchSupport?: boolean;
  maxTouchPoints?: number;
}

export interface PluginInfo {
  name: string;
  description: string;
  filename: string;
  length: number;
}

export interface AuthState {
  platform: string;
  timestamp: number;
  storageState: any;
  cookies: any[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  isValid: boolean;
  expiresAt?: number;
}

export interface ProfileStats {
  totalProfiles: number;
  activeProfiles: number;
  profilesByType: Record<string, number>;
  totalUsageCount: number;
  averageUsageCount: number;
  oldestProfile: number;
  newestProfile: number;
}

export interface ProfileRotationConfig {
  enabled: boolean;
  maxProfilesPerType: number;
  rotationInterval: number; // milliseconds
  cooldownPeriod: number; // milliseconds
  loadBalancing: 'round-robin' | 'least-used' | 'random';
}

export class BrowserProfileManager extends EventEmitter {
  private profiles: Map<string, BrowserProfile> = new Map();
  private profilesDir: string;
  private rotationConfig: ProfileRotationConfig;
  private profileUsage: Map<string, number[]> = new Map(); // profileId -> usage timestamps

  constructor(profilesDir: string = 'browser-profiles', rotationConfig?: Partial<ProfileRotationConfig>) {
    super();
    this.setMaxListeners(100);
    
    this.profilesDir = profilesDir;
    this.rotationConfig = {
      enabled: true,
      maxProfilesPerType: 5,
      rotationInterval: 30 * 60 * 1000, // 30 minutes
      cooldownPeriod: 5 * 60 * 1000, // 5 minutes
      loadBalancing: 'least-used',
      ...rotationConfig
    };

    this.ensureProfilesDirectory();
    this.loadProfiles();
  }

  /**
   * Create a new browser profile
   */
  createProfile(profileData: Omit<BrowserProfile, 'id' | 'lastUsed' | 'usageCount' | 'isActive'>): BrowserProfile {
    const id = this.generateProfileId(profileData.agentType);
    
    const profile: BrowserProfile = {
      ...profileData,
      id,
      lastUsed: Date.now(),
      usageCount: 0,
      isActive: false,
      stealthSettings: {
        enabled: true,
        ...profileData.stealthSettings
      }
    };

    // Set default values if not provided
    if (!profile.userAgent) {
      profile.userAgent = this.getDefaultUserAgent(profile.agentType);
    }

    if (!profile.viewport) {
      profile.viewport = { width: 1280, height: 720 };
    }

    if (!profile.timezone) {
      profile.timezone = 'America/New_York';
    }

    if (!profile.locale) {
      profile.locale = 'en-US';
    }

    if (!profile.geolocation) {
      profile.geolocation = { latitude: 40.7128, longitude: -74.0060 };
    }

    if (!profile.permissions) {
      profile.permissions = ['geolocation'];
    }

    this.profiles.set(id, profile);
    this.saveProfile(profile);
    
    this.emit('profile_created', {
      profile,
      timestamp: Date.now()
    });

    return profile;
  }

  /**
   * Get a profile by ID
   */
  getProfile(profileId: string): BrowserProfile | undefined {
    return this.profiles.get(profileId);
  }

  /**
   * Get profiles by agent type
   */
  getProfilesByType(agentType: string): BrowserProfile[] {
    return Array.from(this.profiles.values())
      .filter(profile => profile.agentType === agentType)
      .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
  }

  /**
   * Get an available profile for an agent type
   */
  getAvailableProfile(agentType: string): BrowserProfile | null {
    const profiles = this.getProfilesByType(agentType);
    
    if (profiles.length === 0) {
      return null;
    }

    // Filter out profiles that are currently active or in cooldown
    const now = Date.now();
    const availableProfiles = profiles.filter(profile => {
      if (profile.isActive) return false;
      
      const lastUsage = this.profileUsage.get(profile.id) || [];
      const lastUsed = lastUsage[lastUsage.length - 1] || 0;
      
      return (now - lastUsed) > this.rotationConfig.cooldownPeriod;
    });

    if (availableProfiles.length === 0) {
      return null;
    }

    // Apply load balancing strategy
    switch (this.rotationConfig.loadBalancing) {
      case 'round-robin':
        return availableProfiles[0];
      
      case 'least-used':
        return availableProfiles.sort((a, b) => (a.usageCount || 0) - (b.usageCount || 0))[0];
      
      case 'random':
        return availableProfiles[Math.floor(Math.random() * availableProfiles.length)];
      
      default:
        return availableProfiles[0];
    }
  }

  /**
   * Mark profile as active
   */
  markProfileActive(profileId: string): void {
    const profile = this.profiles.get(profileId);
    if (profile) {
      profile.isActive = true;
      profile.lastUsed = Date.now();
      profile.usageCount = (profile.usageCount || 0) + 1;
      
      // Track usage timestamp
      const usage = this.profileUsage.get(profileId) || [];
      usage.push(Date.now());
      this.profileUsage.set(profileId, usage.slice(-100)); // Keep last 100 usages
      
      this.saveProfile(profile);
      
      this.emit('profile_activated', {
        profile,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Mark profile as inactive
   */
  markProfileInactive(profileId: string): void {
    const profile = this.profiles.get(profileId);
    if (profile) {
      profile.isActive = false;
      this.saveProfile(profile);
      
      this.emit('profile_deactivated', {
        profile,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Update profile authentication state
   */
  updateProfileAuthState(profileId: string, authState: AuthState): void {
    const profile = this.profiles.get(profileId);
    if (profile) {
      profile.authState = authState;
      this.saveProfile(profile);
      
      this.emit('profile_auth_updated', {
        profile,
        authState,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Rotate profiles (clean up old ones, create new ones)
   */
  async rotateProfiles(): Promise<void> {
    if (!this.rotationConfig.enabled) return;

    const now = Date.now();
    const agentTypes = ['chatgpt', 'claude', 'perplexity', 'bing'];

    for (const agentType of agentTypes) {
      const profiles = this.getProfilesByType(agentType);
      
      // Remove profiles that haven't been used in a long time
      const activeProfiles = profiles.filter(profile => {
        const lastUsed = profile.lastUsed || 0;
        return (now - lastUsed) < this.rotationConfig.rotationInterval;
      });

      // Create new profiles if needed
      if (activeProfiles.length < this.rotationConfig.maxProfilesPerType) {
        const newProfilesNeeded = this.rotationConfig.maxProfilesPerType - activeProfiles.length;
        
        for (let i = 0; i < newProfilesNeeded; i++) {
          await this.createRotatedProfile(agentType);
        }
      }
    }

    this.emit('profiles_rotated', {
      timestamp: Date.now(),
      stats: this.getStats()
    });
  }

  /**
   * Create a rotated profile with randomized settings
   */
  private async createRotatedProfile(agentType: string): Promise<BrowserProfile> {
    const stealthSettings = this.generateRandomStealthSettings();
    
    return this.createProfile({
      agentType: agentType as any,
      name: `${agentType}-profile-${Date.now()}`,
      description: `Auto-generated profile for ${agentType}`,
      storagePath: path.join(this.profilesDir, `${agentType}-${Date.now()}`),
      userAgent: this.getRandomUserAgent(agentType),
      viewport: this.getRandomViewport(),
      timezone: this.getRandomTimezone(),
      locale: this.getRandomLocale(),
      geolocation: this.getRandomGeolocation(),
      stealthSettings
    });
  }

  /**
   * Generate random stealth settings
   */
  private generateRandomStealthSettings(): StealthSettings {
    const webglVendors = ['Intel Inc.', 'NVIDIA Corporation', 'AMD', 'Apple Inc.'];
    const webglRenderers = [
      'Intel(R) HD Graphics 620',
      'NVIDIA GeForce GTX 1060',
      'AMD Radeon RX 580',
      'Apple M1 Pro'
    ];
    
    return {
      enabled: true,
      webglVendor: webglVendors[Math.floor(Math.random() * webglVendors.length)],
      webglRenderer: webglRenderers[Math.floor(Math.random() * webglRenderers.length)],
      hardwareConcurrency: Math.floor(Math.random() * 8) + 4,
      deviceMemory: Math.floor(Math.random() * 8) + 4,
      platform: 'Win32',
      language: 'en-US',
      languages: ['en-US', 'en'],
      cookieEnabled: true,
      doNotTrack: null,
      canvasFingerprint: this.generateCanvasFingerprint(),
      audioFingerprint: this.generateAudioFingerprint(),
      timezoneOffset: -300,
      screenResolution: { width: 1920, height: 1080 },
      colorDepth: 24,
      pixelDepth: 24,
      touchSupport: false,
      maxTouchPoints: 0
    };
  }

  /**
   * Generate random canvas fingerprint
   */
  private generateCanvasFingerprint(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate random audio fingerprint
   */
  private generateAudioFingerprint(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Get random user agent for agent type
   */
  private getRandomUserAgent(agentType: string): string {
    const userAgents = {
      chatgpt: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      ],
      claude: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      ],
      bing: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.0.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.0.0'
      ],
      perplexity: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      ]
    };

    const agents = userAgents[agentType as keyof typeof userAgents] || userAgents.chatgpt;
    return agents[Math.floor(Math.random() * agents.length)];
  }

  /**
   * Get random viewport
   */
  private getRandomViewport(): { width: number; height: number } {
    const viewports = [
      { width: 1280, height: 720 },
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1536, height: 864 },
      { width: 1920, height: 1080 }
    ];
    return viewports[Math.floor(Math.random() * viewports.length)];
  }

  /**
   * Get random timezone
   */
  private getRandomTimezone(): string {
    const timezones = [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Asia/Tokyo',
      'Australia/Sydney'
    ];
    return timezones[Math.floor(Math.random() * timezones.length)];
  }

  /**
   * Get random locale
   */
  private getRandomLocale(): string {
    const locales = ['en-US', 'en-GB', 'en-CA', 'en-AU'];
    return locales[Math.floor(Math.random() * locales.length)];
  }

  /**
   * Get random geolocation
   */
  private getRandomGeolocation(): { latitude: number; longitude: number } {
    const locations = [
      { latitude: 40.7128, longitude: -74.0060 }, // New York
      { latitude: 34.0522, longitude: -118.2437 }, // Los Angeles
      { latitude: 41.8781, longitude: -87.6298 }, // Chicago
      { latitude: 51.5074, longitude: -0.1278 }, // London
      { latitude: 48.8566, longitude: 2.3522 }, // Paris
      { latitude: 35.6762, longitude: 139.6503 }, // Tokyo
      { latitude: -33.8688, longitude: 151.2093 } // Sydney
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  /**
   * Get default user agent for agent type
   */
  private getDefaultUserAgent(agentType: string): string {
    switch (agentType) {
      case 'bing':
        return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.0.0';
      default:
        return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';
    }
  }

  /**
   * Generate unique profile ID
   */
  private generateProfileId(agentType: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${agentType}-${timestamp}-${random}`;
  }

  /**
   * Save profile to disk
   */
  private saveProfile(profile: BrowserProfile): void {
    const profilePath = path.join(this.profilesDir, `${profile.id}.json`);
    fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
  }

  /**
   * Load profiles from disk
   */
  private loadProfiles(): void {
    if (!fs.existsSync(this.profilesDir)) {
      return;
    }

    const files = fs.readdirSync(this.profilesDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const profilePath = path.join(this.profilesDir, file);
          const profileData = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
          this.profiles.set(profileData.id, profileData);
        } catch (error) {
          console.warn(`Failed to load profile from ${file}:`, error);
        }
      }
    }
  }

  /**
   * Ensure profiles directory exists
   */
  private ensureProfilesDirectory(): void {
    if (!fs.existsSync(this.profilesDir)) {
      fs.mkdirSync(this.profilesDir, { recursive: true });
    }
  }

  /**
   * Get profile statistics
   */
  getStats(): ProfileStats {
    const profiles = Array.from(this.profiles.values());
    const profilesByType: Record<string, number> = {};
    
    profiles.forEach(profile => {
      profilesByType[profile.agentType] = (profilesByType[profile.agentType] || 0) + 1;
    });

    const usageCounts = profiles.map(p => p.usageCount || 0);
    const totalUsageCount = usageCounts.reduce((sum, count) => sum + count, 0);
    const averageUsageCount = profiles.length > 0 ? totalUsageCount / profiles.length : 0;

    const timestamps = profiles.map(p => p.lastUsed || 0);
    const oldestProfile = Math.min(...timestamps);
    const newestProfile = Math.max(...timestamps);

    return {
      totalProfiles: profiles.length,
      activeProfiles: profiles.filter(p => p.isActive).length,
      profilesByType,
      totalUsageCount,
      averageUsageCount,
      oldestProfile,
      newestProfile
    };
  }

  /**
   * Clean up old profiles
   */
  cleanupOldProfiles(maxAge: number = 7 * 24 * 60 * 60 * 1000): void { // 7 days
    const now = Date.now();
    const profilesToDelete: string[] = [];

    for (const [id, profile] of this.profiles) {
      const lastUsed = profile.lastUsed || 0;
      if (now - lastUsed > maxAge) {
        profilesToDelete.push(id);
      }
    }

    for (const id of profilesToDelete) {
      this.deleteProfile(id);
    }

    if (profilesToDelete.length > 0) {
      this.emit('profiles_cleaned', {
        deletedCount: profilesToDelete.length,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Delete a profile
   */
  deleteProfile(profileId: string): boolean {
    const profile = this.profiles.get(profileId);
    if (!profile) return false;

    // Delete profile file
    const profilePath = path.join(this.profilesDir, `${profileId}.json`);
    if (fs.existsSync(profilePath)) {
      fs.unlinkSync(profilePath);
    }

    // Delete storage directory
    if (fs.existsSync(profile.storagePath)) {
      fs.rmSync(profile.storagePath, { recursive: true, force: true });
    }

    this.profiles.delete(profileId);
    this.profileUsage.delete(profileId);

    this.emit('profile_deleted', {
      profile,
      timestamp: Date.now()
    });

    return true;
  }

  /**
   * Export profile
   */
  exportProfile(profileId: string): BrowserProfile | null {
    const profile = this.profiles.get(profileId);
    return profile ? { ...profile } : null;
  }

  /**
   * Import profile
   */
  importProfile(profileData: BrowserProfile): BrowserProfile {
    const profile = { ...profileData, id: this.generateProfileId(profileData.agentType) };
    this.profiles.set(profile.id, profile);
    this.saveProfile(profile);
    
    this.emit('profile_imported', {
      profile,
      timestamp: Date.now()
    });

    return profile;
  }
} 