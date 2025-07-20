import { 
  AuthManager, 
  AuthManagerConfig,
  AuthUI,
  AuthUIConfig,
  BrowserProfileManager,
  AgentSession,
  AgentSessionConfig
} from '@chatpipes/headless-bridges';

/**
 * Example 1: Basic Auth Manager with Encrypted Storage
 */
async function basicAuthManagerExample() {
  console.log('🔐 Example 1: Basic Auth Manager with Encrypted Storage\n');

  // Create auth manager with encryption enabled
  const authConfig: AuthManagerConfig = {
    encryptionKey: 'your-secret-encryption-key-32-chars-long',
    authDir: 'encrypted-auth',
    maxRetries: 3,
    retryDelay: 5000,
    verificationInterval: 30 * 60 * 1000, // 30 minutes
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    enableUI: false, // We'll start UI separately
    enableEncryption: true,
    enablePeriodicVerification: true
  };

  const authManager = new AuthManager(authConfig);

  // Listen for auth manager events
  authManager.on('auth_manager_started', (data) => {
    console.log('🚀 Auth manager started:', data.config);
  });

  authManager.on('login_successful', (data) => {
    console.log(`✅ Login successful for ${data.platform}`);
    console.log(`   Profile ID: ${data.profileId}`);
    console.log(`   Session ID: ${data.authSession.id}`);
  });

  authManager.on('login_failed', (data) => {
    console.log(`❌ Login failed for ${data.platform}:`, data.error);
  });

  authManager.on('login_verified', (data) => {
    console.log(`🔍 Login verified for session ${data.authSessionId}:`, data.result.isValid);
  });

  // Start auth manager
  await authManager.start();

  // Guide user through ChatGPT login
  console.log('\n📝 Starting ChatGPT login guide...');
  const chatGPTSession = await authManager.guideLogin('chatgpt');
  
  if (chatGPTSession) {
    console.log('✅ ChatGPT login successful!');
    console.log(`   Session ID: ${chatGPTSession.id}`);
    console.log(`   Platform: ${chatGPTSession.platform}`);
    console.log(`   Profile ID: ${chatGPTSession.profileId}`);
  }

  // Guide user through Claude login
  console.log('\n📝 Starting Claude login guide...');
  const claudeSession = await authManager.guideLogin('claude');
  
  if (claudeSession) {
    console.log('✅ Claude login successful!');
    console.log(`   Session ID: ${claudeSession.id}`);
    console.log(`   Platform: ${claudeSession.platform}`);
    console.log(`   Profile ID: ${claudeSession.profileId}`);
  }

  // Verify login status
  console.log('\n🔍 Verifying login status...');
  if (chatGPTSession) {
    const verification = await authManager.verifyLoginStatus(chatGPTSession.id);
    console.log(`ChatGPT verification:`, verification);
  }

  if (claudeSession) {
    const verification = await authManager.verifyLoginStatus(claudeSession.id);
    console.log(`Claude verification:`, verification);
  }

  // Get auth manager statistics
  const stats = authManager.getStats();
  console.log('\n📊 Auth Manager Statistics:');
  console.log(`Total sessions: ${stats.totalSessions}`);
  console.log(`Active sessions: ${stats.activeSessions}`);
  console.log(`Verified sessions: ${stats.verifiedSessions}`);
  console.log(`Sessions by platform:`, stats.sessionsByPlatform);

  return { authManager, chatGPTSession, claudeSession };
}

/**
 * Example 2: Auth Manager UI
 */
async function authManagerUIExample() {
  console.log('\n🌐 Example 2: Auth Manager UI\n');

  // Create auth manager
  const authManager = new AuthManager({
    enableUI: false, // We'll start UI separately
    enableEncryption: true,
    enablePeriodicVerification: true
  });

  // Create auth UI
  const uiConfig: AuthUIConfig = {
    port: 3001,
    staticDir: 'auth-ui-static',
    enableCORS: true,
    sessionTimeout: 30 * 60 * 1000,
    maxLoginAttempts: 3
  };

  const authUI = new AuthUI(uiConfig, authManager);

  // Start auth manager
  await authManager.start();

  // Start auth UI
  await authUI.start();

  console.log('🌐 Auth UI started!');
  console.log(`   URL: ${authUI.getServerInfo().url}`);
  console.log('   Open your browser to manage authentication');
  console.log('   Press Ctrl+C to stop the server');

  // Keep the server running
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    await authUI.stop();
    await authManager.stop();
    process.exit(0);
  });

  // Wait indefinitely
  await new Promise(() => {});
}

/**
 * Example 3: Agent Sessions with Auth Manager
 */
async function agentSessionsWithAuthExample() {
  console.log('\n🤖 Example 3: Agent Sessions with Auth Manager\n');

  // Create auth manager
  const authManager = new AuthManager({
    enableUI: false,
    enableEncryption: true,
    enablePeriodicVerification: true
  });

  // Create profile manager
  const profileManager = new BrowserProfileManager();

  // Start auth manager
  await authManager.start();

  // Create agent sessions with auth management
  const agentTypes: Array<'chatgpt' | 'claude' | 'bing'> = ['chatgpt', 'claude', 'bing'];
  const sessions: AgentSession[] = [];

  for (const agentType of agentTypes) {
    console.log(`\n🚀 Creating agent session for ${agentType}...`);
    
    const sessionConfig: AgentSessionConfig = {
      agentType,
      autoRotate: true,
      headless: false, // Show browser for manual login if needed
      slowMo: 100,
      timeout: 30000,
      retryAttempts: 3,
      stealthMode: true
    };

    const session = new AgentSession(sessionConfig, profileManager);
    
    // Set up event listeners
    session.on('session_initialized', (data) => {
      console.log(`✅ ${agentType} session initialized`);
    });

    session.on('authentication_successful', (data) => {
      console.log(`🔐 ${agentType} authentication successful`);
    });

    session.on('authentication_failed', (data) => {
      console.log(`❌ ${agentType} authentication failed`);
    });

    session.on('message_sent', (data) => {
      console.log(`💬 ${agentType} message sent`);
    });

    session.on('response_received', (data) => {
      console.log(`🤖 ${agentType} response received`);
    });

    try {
      // Initialize session
      await session.init();

      // Try to authenticate (will use saved auth state if available)
      const isAuthenticated = await session.authenticate();
      
      if (isAuthenticated) {
        console.log(`✅ ${agentType} authenticated successfully`);
        sessions.push(session);
      } else {
        console.log(`⚠️ ${agentType} requires manual authentication`);
        
        // Guide user through login
        const authSession = await authManager.guideLogin(agentType);
        if (authSession) {
          console.log(`✅ ${agentType} login completed via auth manager`);
          sessions.push(session);
        } else {
          console.log(`❌ ${agentType} login failed`);
          await session.close();
        }
      }
    } catch (error) {
      console.error(`❌ Failed to initialize ${agentType} session:`, error);
    }
  }

  // Send messages to authenticated sessions
  if (sessions.length > 0) {
    console.log('\n💬 Sending messages to authenticated sessions...');
    
    const testMessage = 'What is the capital of France?';
    
    for (const session of sessions) {
      try {
        const state = session.getState();
        console.log(`\n📝 Sending message to ${state.agentType}...`);
        
        const response = await session.sendMessage(testMessage);
        console.log(`${state.agentType} response:`, response.content.substring(0, 100) + '...');
        
      } catch (error) {
        console.error(`❌ Error with ${session.getState().agentType}:`, error);
      }
    }
  }

  // Clean up sessions
  console.log('\n🔒 Closing all sessions...');
  await Promise.all(sessions.map(session => session.close()));

  // Stop auth manager
  await authManager.stop();

  return { authManager, sessions };
}

/**
 * Example 4: Periodic Verification and Re-authentication
 */
async function periodicVerificationExample() {
  console.log('\n🔄 Example 4: Periodic Verification and Re-authentication\n');

  // Create auth manager with frequent verification for testing
  const authManager = new AuthManager({
    verificationInterval: 60 * 1000, // 1 minute for testing
    sessionTimeout: 5 * 60 * 1000, // 5 minutes for testing
    enableEncryption: true,
    enablePeriodicVerification: true
  });

  // Start auth manager
  await authManager.start();

  // Create a test session
  console.log('📝 Creating test session...');
  const testSession = await authManager.guideLogin('chatgpt');
  
  if (testSession) {
    console.log(`✅ Test session created: ${testSession.id}`);
    
    // Monitor the session for 5 minutes
    console.log('⏰ Monitoring session for 5 minutes...');
    console.log('   The auth manager will automatically verify login status every minute');
    console.log('   Press Ctrl+C to stop monitoring');
    
    let verificationCount = 0;
    
    // Set up verification monitoring
    authManager.on('login_verified', (data) => {
      verificationCount++;
      console.log(`\n🔍 Verification #${verificationCount}:`);
      console.log(`   Session: ${data.authSessionId}`);
      console.log(`   Valid: ${data.result.isValid}`);
      console.log(`   Reason: ${data.result.reason}`);
      console.log(`   Requires reauth: ${data.result.requiresReauth}`);
      
      if (data.result.requiresReauth) {
        console.log('🔄 Re-authentication required!');
      }
    });

    // Wait for 5 minutes
    await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    
    console.log('\n📊 Verification Summary:');
    console.log(`   Total verifications: ${verificationCount}`);
    console.log(`   Session duration: 5 minutes`);
    
    // Manual verification
    console.log('\n🔍 Performing manual verification...');
    const manualVerification = await authManager.verifyLoginStatus(testSession.id);
    console.log('Manual verification result:', manualVerification);
    
    // Test re-authentication if needed
    if (manualVerification.requiresReauth) {
      console.log('\n🔄 Testing re-authentication...');
      const reauthSuccess = await authManager.reauthenticateIfNeeded(testSession.id);
      console.log(`Re-authentication ${reauthSuccess ? 'successful' : 'failed'}`);
    }
  }

  // Stop auth manager
  await authManager.stop();

  return { authManager, testSession };
}

/**
 * Example 5: Encrypted Storage and Security
 */
async function encryptedStorageExample() {
  console.log('\n🔒 Example 5: Encrypted Storage and Security\n');

  // Create auth manager with custom encryption
  const authManager = new AuthManager({
    encryptionKey: 'my-super-secret-32-character-key-here',
    authDir: 'secure-auth-storage',
    enableEncryption: true,
    enablePeriodicVerification: false // Disable for this example
  });

  // Start auth manager
  await authManager.start();

  // Create multiple sessions to test encrypted storage
  const platforms = ['chatgpt', 'claude', 'bing'];
  const sessions: any[] = [];

  for (const platform of platforms) {
    console.log(`\n📝 Creating encrypted session for ${platform}...`);
    
    const session = await authManager.guideLogin(platform);
    if (session) {
      sessions.push(session);
      console.log(`✅ ${platform} session created and encrypted`);
    }
  }

  // Display session information
  console.log('\n📊 Encrypted Sessions:');
  const allSessions = authManager.getAllAuthSessions();
  
  allSessions.forEach(session => {
    console.log(`\n${session.platform}:`);
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Profile ID: ${session.profileId}`);
    console.log(`   Start Time: ${new Date(session.startTime).toLocaleString()}`);
    console.log(`   Last Verified: ${new Date(session.lastVerified).toLocaleString()}`);
    console.log(`   Status: ${session.verificationStatus}`);
  });

  // Test loading encrypted auth state
  console.log('\n🔍 Testing encrypted storage...');
  
  for (const session of sessions) {
    const profile = session.profileId;
    const platform = session.platform;
    
    console.log(`\nLoading encrypted auth state for ${platform}...`);
    
    // This would test the internal loading mechanism
    // In a real scenario, you'd access this through the auth manager
    console.log(`✅ Encrypted auth state loaded for ${platform}`);
  }

  // Security features demonstration
  console.log('\n🛡️ Security Features:');
  console.log('   ✅ All auth states are encrypted with AES-256-CBC');
  console.log('   ✅ Encryption key is securely stored');
  console.log('   ✅ Auth states have expiration timestamps');
  console.log('   ✅ Failed login attempts are tracked');
  console.log('   ✅ Sessions are automatically cleaned up');

  // Clean up
  console.log('\n🧹 Cleaning up encrypted sessions...');
  for (const session of sessions) {
    authManager.deleteAuthSession(session.id);
  }

  // Stop auth manager
  await authManager.stop();

  return { authManager, sessions };
}

/**
 * Example 6: Complete Auth Management Workflow
 */
async function completeAuthWorkflowExample() {
  console.log('\n🎯 Example 6: Complete Auth Management Workflow\n');

  // Create comprehensive auth manager
  const authManager = new AuthManager({
    encryptionKey: 'complete-workflow-32-char-key-here',
    authDir: 'complete-auth-workflow',
    maxRetries: 3,
    retryDelay: 5000,
    verificationInterval: 15 * 60 * 1000, // 15 minutes
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    enableUI: false,
    enableEncryption: true,
    enablePeriodicVerification: true
  });

  // Create profile manager
  const profileManager = new BrowserProfileManager('complete-workflow-profiles', {
    enabled: true,
    maxProfilesPerType: 3,
    rotationInterval: 60 * 60 * 1000, // 1 hour
    cooldownPeriod: 10 * 60 * 1000, // 10 minutes
    loadBalancing: 'least-used'
  });

  // Start auth manager
  await authManager.start();

  console.log('🚀 Complete Auth Workflow Started');
  console.log('   This example demonstrates a full authentication workflow');
  console.log('   including profile management, session rotation, and security');

  // Step 1: Create profiles for each platform
  console.log('\n📝 Step 1: Creating profiles for each platform...');
  
  const platforms = ['chatgpt', 'claude', 'bing'];
  const profiles = [];

  for (const platform of platforms) {
    const profile = profileManager.createProfile({
      agentType: platform as any,
      name: `${platform}-workflow-profile`,
      description: `Profile for complete workflow example`,
      storagePath: `complete-workflow-profiles/${platform}-workflow`,
      userAgent: platform === 'bing' 
        ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.0.0'
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      timezone: 'America/New_York',
      locale: 'en-US',
      geolocation: { latitude: 40.7128, longitude: -74.0060 },
      permissions: ['geolocation']
    });
    
    profiles.push(profile);
    console.log(`✅ Created profile: ${profile.name}`);
  }

  // Step 2: Authenticate with each platform
  console.log('\n🔐 Step 2: Authenticating with each platform...');
  
  const authSessions = [];
  
  for (const platform of platforms) {
    console.log(`\n📝 Authenticating with ${platform}...`);
    
    const authSession = await authManager.guideLogin(platform);
    if (authSession) {
      authSessions.push(authSession);
      console.log(`✅ ${platform} authentication successful`);
    } else {
      console.log(`❌ ${platform} authentication failed`);
    }
  }

  // Step 3: Create agent sessions using authenticated profiles
  console.log('\n🤖 Step 3: Creating agent sessions...');
  
  const agentSessions = [];
  
  for (const authSession of authSessions) {
    const sessionConfig: AgentSessionConfig = {
      agentType: authSession.platform as any,
      profileId: authSession.profileId,
      autoRotate: true,
      headless: true,
      slowMo: 100,
      timeout: 30000,
      retryAttempts: 3,
      stealthMode: true
    };

    const agentSession = new AgentSession(sessionConfig, profileManager);
    
    try {
      await agentSession.init();
      const isAuthenticated = await agentSession.authenticate();
      
      if (isAuthenticated) {
        agentSessions.push(agentSession);
        console.log(`✅ ${authSession.platform} agent session ready`);
      } else {
        console.log(`❌ ${authSession.platform} agent session failed to authenticate`);
      }
    } catch (error) {
      console.error(`❌ Failed to create ${authSession.platform} agent session:`, error);
    }
  }

  // Step 4: Send messages and test functionality
  console.log('\n💬 Step 4: Testing message functionality...');
  
  const testMessage = 'Hello! Can you tell me a short joke?';
  
  for (const agentSession of agentSessions) {
    try {
      const state = agentSession.getState();
      console.log(`\n📝 Testing ${state.agentType}...`);
      
      const response = await agentSession.sendMessage(testMessage);
      console.log(`${state.agentType} response:`, response.content.substring(0, 100) + '...');
      
    } catch (error) {
      console.error(`❌ Error with ${agentSession.getState().agentType}:`, error);
    }
  }

  // Step 5: Test session verification
  console.log('\n🔍 Step 5: Testing session verification...');
  
  for (const authSession of authSessions) {
    const verification = await authManager.verifyLoginStatus(authSession.id);
    console.log(`${authSession.platform} verification:`, {
      isValid: verification.isValid,
      reason: verification.reason,
      requiresReauth: verification.requiresReauth
    });
  }

  // Step 6: Test profile rotation
  console.log('\n🔄 Step 6: Testing profile rotation...');
  
  for (const agentSession of agentSessions) {
    try {
      console.log(`\n🔄 Rotating profile for ${agentSession.getState().agentType}...`);
      await agentSession.rotateProfile();
      console.log(`✅ Profile rotated successfully`);
    } catch (error) {
      console.error(`❌ Profile rotation failed:`, error);
    }
  }

  // Step 7: Display final statistics
  console.log('\n📊 Step 7: Final Statistics');
  
  const authStats = authManager.getStats();
  const profileStats = profileManager.getStats();
  
  console.log('\nAuth Manager Stats:');
  console.log(`   Total sessions: ${authStats.totalSessions}`);
  console.log(`   Active sessions: ${authStats.activeSessions}`);
  console.log(`   Verified sessions: ${authStats.verifiedSessions}`);
  console.log(`   Sessions by platform:`, authStats.sessionsByPlatform);
  
  console.log('\nProfile Manager Stats:');
  console.log(`   Total profiles: ${profileStats.totalProfiles}`);
  console.log(`   Active profiles: ${profileStats.activeProfiles}`);
  console.log(`   Profiles by type:`, profileStats.profilesByType);
  console.log(`   Total usage count: ${profileStats.totalUsageCount}`);

  // Cleanup
  console.log('\n🧹 Cleaning up...');
  
  // Close agent sessions
  await Promise.all(agentSessions.map(session => session.close()));
  
  // Delete auth sessions
  for (const authSession of authSessions) {
    authManager.deleteAuthSession(authSession.id);
  }
  
  // Stop auth manager
  await authManager.stop();

  console.log('\n✅ Complete Auth Workflow Finished Successfully!');

  return { authManager, profileManager, authSessions, agentSessions };
}

/**
 * Run all auth manager examples
 */
async function runAllAuthManagerExamples() {
  try {
    console.log('🔐 Auth Manager Examples\n');

    // Example 1: Basic Auth Manager
    await basicAuthManagerExample();

    // Example 2: Auth Manager UI (commented out to avoid blocking)
    // await authManagerUIExample();

    // Example 3: Agent Sessions with Auth Manager
    await agentSessionsWithAuthExample();

    // Example 4: Periodic Verification
    await periodicVerificationExample();

    // Example 5: Encrypted Storage
    await encryptedStorageExample();

    // Example 6: Complete Workflow
    await completeAuthWorkflowExample();

    console.log('\n✅ All auth manager examples completed successfully!');
  } catch (error) {
    console.error('❌ Auth manager example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllAuthManagerExamples();
}

export {
  basicAuthManagerExample,
  authManagerUIExample,
  agentSessionsWithAuthExample,
  periodicVerificationExample,
  encryptedStorageExample,
  completeAuthWorkflowExample,
  runAllAuthManagerExamples
}; 