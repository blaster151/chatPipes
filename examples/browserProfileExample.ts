import { 
  BrowserProfileManager, 
  BrowserProfile, 
  ProfileRotationConfig,
  AgentSession,
  AgentSessionConfig
} from '@chatpipes/headless-bridges';

/**
 * Example 1: Basic Browser Profile Management
 */
async function basicProfileManagementExample() {
  console.log('👤 Example 1: Basic Browser Profile Management\n');

  // Create profile manager
  const profileManager = new BrowserProfileManager('browser-profiles', {
    enabled: true,
    maxProfilesPerType: 3,
    rotationInterval: 30 * 60 * 1000, // 30 minutes
    cooldownPeriod: 5 * 60 * 1000, // 5 minutes
    loadBalancing: 'least-used'
  });

  // Listen for profile events
  profileManager.on('profile_created', (data) => {
    console.log(`📝 Profile created: ${data.profile.name} (${data.profile.id})`);
  });

  profileManager.on('profile_activated', (data) => {
    console.log(`🟢 Profile activated: ${data.profile.name}`);
  });

  profileManager.on('profile_deactivated', (data) => {
    console.log(`🔴 Profile deactivated: ${data.profile.name}`);
  });

  profileManager.on('profile_auth_updated', (data) => {
    console.log(`🔐 Profile auth updated: ${data.profile.name}`);
  });

  // Create profiles for different agent types
  const profiles: BrowserProfile[] = [];

  // ChatGPT profile
  const chatGPTProfile = profileManager.createProfile({
    agentType: 'chatgpt',
    name: 'ChatGPT-Profile-1',
    description: 'Primary ChatGPT profile with stealth settings',
    storagePath: 'browser-profiles/chatgpt-profile-1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    timezone: 'America/New_York',
    locale: 'en-US',
    geolocation: { latitude: 40.7128, longitude: -74.0060 },
    permissions: ['geolocation'],
    stealthSettings: {
      enabled: true,
      webglVendor: 'Intel Inc.',
      webglRenderer: 'Intel(R) HD Graphics 620',
      hardwareConcurrency: 8,
      deviceMemory: 8,
      platform: 'Win32',
      language: 'en-US',
      languages: ['en-US', 'en'],
      cookieEnabled: true,
      doNotTrack: null,
      canvasFingerprint: 'abc123def456ghi789jkl012mno345pqr678stu901',
      audioFingerprint: 'xyz789abc123def456',
      timezoneOffset: -300,
      screenResolution: { width: 1920, height: 1080 },
      colorDepth: 24,
      pixelDepth: 24,
      touchSupport: false,
      maxTouchPoints: 0
    }
  });
  profiles.push(chatGPTProfile);

  // Claude profile
  const claudeProfile = profileManager.createProfile({
    agentType: 'claude',
    name: 'Claude-Profile-1',
    description: 'Primary Claude profile',
    storagePath: 'browser-profiles/claude-profile-1',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    timezone: 'America/Los_Angeles',
    locale: 'en-US',
    geolocation: { latitude: 34.0522, longitude: -118.2437 },
    permissions: ['geolocation'],
    stealthSettings: {
      enabled: true,
      webglVendor: 'Apple Inc.',
      webglRenderer: 'Apple M1 Pro',
      hardwareConcurrency: 10,
      deviceMemory: 16,
      platform: 'MacIntel',
      language: 'en-US',
      languages: ['en-US', 'en'],
      cookieEnabled: true,
      doNotTrack: null,
      canvasFingerprint: 'mno345pqr678stu901vwx234yza567bcd890',
      audioFingerprint: 'efg123hij456klm789',
      timezoneOffset: -480,
      screenResolution: { width: 1440, height: 900 },
      colorDepth: 24,
      pixelDepth: 24,
      touchSupport: false,
      maxTouchPoints: 0
    }
  });
  profiles.push(claudeProfile);

  // Bing Chat profile (Edge-specific)
  const bingProfile = profileManager.createProfile({
    agentType: 'bing',
    name: 'Bing-Profile-1',
    description: 'Primary Bing Chat profile with Edge settings',
    storagePath: 'browser-profiles/bing-profile-1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.0.0',
    viewport: { width: 1366, height: 768 },
    timezone: 'America/Chicago',
    locale: 'en-US',
    geolocation: { latitude: 41.8781, longitude: -87.6298 },
    permissions: ['geolocation'],
    extraHeaders: {
      'Sec-CH-UA': '"Microsoft Edge";v="115", "Chromium";v="115", "Not=A?Brand";v="99"',
      'Sec-CH-UA-Mobile': '?0',
      'Sec-CH-UA-Platform': '"Windows"'
    },
    stealthSettings: {
      enabled: true,
      webglVendor: 'NVIDIA Corporation',
      webglRenderer: 'NVIDIA GeForce GTX 1060',
      hardwareConcurrency: 6,
      deviceMemory: 8,
      platform: 'Win32',
      language: 'en-US',
      languages: ['en-US', 'en'],
      cookieEnabled: true,
      doNotTrack: null,
      canvasFingerprint: 'nop456qrs789tuv012wxy345zab678cde901',
      audioFingerprint: 'fgh234ijk567lmn890',
      timezoneOffset: -360,
      screenResolution: { width: 1366, height: 768 },
      colorDepth: 24,
      pixelDepth: 24,
      touchSupport: false,
      maxTouchPoints: 0
    }
  });
  profiles.push(bingProfile);

  // Display created profiles
  console.log('\n📊 Created Profiles:');
  profiles.forEach(profile => {
    console.log(`\n${profile.name}:`);
    console.log(`   ID: ${profile.id}`);
    console.log(`   Type: ${profile.agentType}`);
    console.log(`   User Agent: ${profile.userAgent?.substring(0, 50)}...`);
    console.log(`   Viewport: ${profile.viewport?.width}x${profile.viewport?.height}`);
    console.log(`   Timezone: ${profile.timezone}`);
    console.log(`   Stealth: ${profile.stealthSettings?.enabled ? 'Enabled' : 'Disabled'}`);
  });

  // Get profile statistics
  const stats = profileManager.getStats();
  console.log('\n📈 Profile Statistics:');
  console.log(`Total profiles: ${stats.totalProfiles}`);
  console.log(`Active profiles: ${stats.activeProfiles}`);
  console.log(`Profiles by type:`, stats.profilesByType);
  console.log(`Total usage count: ${stats.totalUsageCount}`);
  console.log(`Average usage count: ${stats.averageUsageCount.toFixed(2)}`);

  return { profileManager, profiles };
}

/**
 * Example 2: Profile Rotation and Load Balancing
 */
async function profileRotationExample() {
  console.log('\n🔄 Example 2: Profile Rotation and Load Balancing\n');

  const { profileManager } = await basicProfileManagementExample();

  // Simulate profile usage
  const chatGPTProfiles = profileManager.getProfilesByType('chatgpt');
  
  console.log('\n🎯 Simulating profile usage...');
  
  for (let i = 0; i < 10; i++) {
    const availableProfile = profileManager.getAvailableProfile('chatgpt');
    if (availableProfile) {
      console.log(`Using profile: ${availableProfile.name} (usage count: ${availableProfile.usageCount})`);
      
      // Mark as active
      profileManager.markProfileActive(availableProfile.id);
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Mark as inactive
      profileManager.markProfileInactive(availableProfile.id);
    }
  }

  // Show updated statistics
  const updatedStats = profileManager.getStats();
  console.log('\n📈 Updated Statistics:');
  console.log(`Total usage count: ${updatedStats.totalUsageCount}`);
  console.log(`Average usage count: ${updatedStats.averageUsageCount.toFixed(2)}`);

  // Test load balancing strategies
  console.log('\n⚖️ Testing Load Balancing Strategies:');
  
  const strategies: Array<'round-robin' | 'least-used' | 'random'> = ['round-robin', 'least-used', 'random'];
  
  for (const strategy of strategies) {
    console.log(`\nStrategy: ${strategy}`);
    
    // Update rotation config
    profileManager['rotationConfig'].loadBalancing = strategy;
    
    // Get profiles using this strategy
    for (let i = 0; i < 5; i++) {
      const profile = profileManager.getAvailableProfile('chatgpt');
      if (profile) {
        console.log(`  Selected: ${profile.name} (usage: ${profile.usageCount})`);
      }
    }
  }
}

/**
 * Example 3: Agent Session with Profile Management
 */
async function agentSessionWithProfilesExample() {
  console.log('\n🤖 Example 3: Agent Session with Profile Management\n');

  const { profileManager } = await basicProfileManagementExample();

  // Create agent session configuration
  const sessionConfig: AgentSessionConfig = {
    agentType: 'chatgpt',
    autoRotate: true,
    headless: false, // Set to false for manual login
    slowMo: 100,
    timeout: 30000,
    retryAttempts: 3,
    stealthMode: true,
    rotationConfig: {
      enabled: true,
      maxProfilesPerType: 3,
      rotationInterval: 30 * 60 * 1000,
      cooldownPeriod: 5 * 60 * 1000,
      loadBalancing: 'least-used'
    }
  };

  // Create agent session
  const agentSession = new AgentSession(sessionConfig, profileManager);

  // Listen for agent session events
  agentSession.on('session_initialized', (data) => {
    console.log(`🚀 Agent session initialized: ${data.sessionId}`);
    console.log(`   Agent type: ${data.agentType}`);
    console.log(`   Profile ID: ${data.profileId}`);
  });

  agentSession.on('authentication_successful', (data) => {
    console.log(`🔐 Authentication successful`);
  });

  agentSession.on('authentication_failed', (data) => {
    console.log(`❌ Authentication failed`);
  });

  agentSession.on('message_sent', (data) => {
    console.log(`💬 Message sent: ${data.message.content.substring(0, 50)}...`);
  });

  agentSession.on('response_received', (data) => {
    console.log(`🤖 Response received: ${data.response.content.substring(0, 50)}...`);
  });

  agentSession.on('session_closed', (data) => {
    console.log(`🔒 Agent session closed: ${data.sessionId}`);
  });

  try {
    // Initialize agent session
    await agentSession.init();

    // Get session state
    const state = agentSession.getState();
    console.log('\n📊 Session State:');
    console.log(`Session ID: ${state.sessionId}`);
    console.log(`Agent Type: ${state.agentType}`);
    console.log(`Profile ID: ${state.profileId}`);
    console.log(`Is Active: ${state.isActive}`);
    console.log(`Is Authenticated: ${state.isAuthenticated}`);

    // Get current profile
    const currentProfile = agentSession.getCurrentProfile();
    console.log('\n👤 Current Profile:');
    console.log(`Name: ${currentProfile?.name}`);
    console.log(`User Agent: ${currentProfile?.userAgent?.substring(0, 50)}...`);
    console.log(`Viewport: ${currentProfile?.viewport?.width}x${currentProfile?.viewport?.height}`);
    console.log(`Stealth Enabled: ${currentProfile?.stealthSettings?.enabled}`);

    // Try to authenticate (will use saved auth state if available)
    console.log('\n🔐 Attempting authentication...');
    const isAuthenticated = await agentSession.authenticate();
    
    if (isAuthenticated) {
      console.log('✅ Successfully authenticated');
      
      // Send a test message
      console.log('\n💬 Sending test message...');
      const response = await agentSession.sendMessage('Hello! Can you tell me a short joke?');
      
      console.log('\n📝 Response:');
      console.log(response.content);
      
      // Get session statistics
      const stats = agentSession.getStats();
      console.log('\n📈 Session Statistics:');
      console.log(`Message count: ${stats.messageCount}`);
      console.log(`Session duration: ${stats.sessionDuration}ms`);
      console.log(`Last activity: ${new Date(stats.lastActivity).toLocaleTimeString()}`);
      
    } else {
      console.log('❌ Authentication failed - manual login required');
    }

  } catch (error) {
    console.error('❌ Agent session error:', error);
  } finally {
    // Close agent session
    await agentSession.close();
  }
}

/**
 * Example 4: Multi-Agent Session Management
 */
async function multiAgentSessionExample() {
  console.log('\n🤖 Example 4: Multi-Agent Session Management\n');

  const { profileManager } = await basicProfileManagementExample();

  const agentTypes: Array<'chatgpt' | 'claude' | 'bing'> = ['chatgpt', 'claude', 'bing'];
  const sessions: AgentSession[] = [];

  try {
    // Create sessions for each agent type
    for (const agentType of agentTypes) {
      console.log(`\n🚀 Creating session for ${agentType}...`);
      
      const sessionConfig: AgentSessionConfig = {
        agentType,
        autoRotate: true,
        headless: true, // Run in headless mode
        slowMo: 100,
        timeout: 30000,
        retryAttempts: 2,
        stealthMode: true
      };

      const session = new AgentSession(sessionConfig, profileManager);
      
      // Set up event listeners
      session.on('session_initialized', (data) => {
        console.log(`✅ ${agentType} session initialized with profile ${data.profileId}`);
      });

      session.on('authentication_successful', (data) => {
        console.log(`🔐 ${agentType} authentication successful`);
      });

      session.on('message_sent', (data) => {
        console.log(`💬 ${agentType} message sent`);
      });

      session.on('response_received', (data) => {
        console.log(`🤖 ${agentType} response received`);
      });

      // Initialize session
      await session.init();
      sessions.push(session);
    }

    // Send messages to all sessions
    const testMessage = 'What is the capital of France?';
    const responses: { agentType: string; response: any }[] = [];

    for (const session of sessions) {
      try {
        const state = session.getState();
        if (state.isAuthenticated) {
          console.log(`\n💬 Sending message to ${state.agentType}...`);
          const response = await session.sendMessage(testMessage);
          responses.push({
            agentType: state.agentType,
            response: response.content.substring(0, 100) + '...'
          });
        } else {
          console.log(`⚠️ ${state.agentType} not authenticated, skipping`);
        }
      } catch (error) {
        console.error(`❌ Error with ${session.getState().agentType}:`, error);
      }
    }

    // Display responses
    console.log('\n📝 Responses from all agents:');
    responses.forEach(({ agentType, response }) => {
      console.log(`\n${agentType}:`);
      console.log(response);
    });

    // Show final statistics
    console.log('\n📊 Final Statistics:');
    const finalStats = profileManager.getStats();
    console.log(`Total profiles: ${finalStats.totalProfiles}`);
    console.log(`Active profiles: ${finalStats.activeProfiles}`);
    console.log(`Total usage count: ${finalStats.totalUsageCount}`);

  } catch (error) {
    console.error('❌ Multi-agent session error:', error);
  } finally {
    // Close all sessions
    console.log('\n🔒 Closing all sessions...');
    await Promise.all(sessions.map(session => session.close()));
  }
}

/**
 * Example 5: Profile Cleanup and Management
 */
async function profileCleanupExample() {
  console.log('\n🧹 Example 5: Profile Cleanup and Management\n');

  const { profileManager } = await basicProfileManagementExample();

  // Create some additional profiles to test cleanup
  console.log('\n📝 Creating additional profiles for cleanup test...');
  
  for (let i = 0; i < 3; i++) {
    profileManager.createProfile({
      agentType: 'chatgpt',
      name: `ChatGPT-Test-${i + 1}`,
      description: `Test profile ${i + 1} for cleanup`,
      storagePath: `browser-profiles/chatgpt-test-${i + 1}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      timezone: 'America/New_York',
      locale: 'en-US',
      geolocation: { latitude: 40.7128, longitude: -74.0060 },
      permissions: ['geolocation']
    });
  }

  // Show initial stats
  const initialStats = profileManager.getStats();
  console.log(`\n📊 Initial profiles: ${initialStats.totalProfiles}`);

  // Test profile export/import
  console.log('\n📤 Testing profile export/import...');
  const chatGPTProfiles = profileManager.getProfilesByType('chatgpt');
  if (chatGPTProfiles.length > 0) {
    const profileToExport = chatGPTProfiles[0];
    const exportedProfile = profileManager.exportProfile(profileToExport.id);
    
    if (exportedProfile) {
      console.log(`Exported profile: ${exportedProfile.name}`);
      
      // Modify and reimport
      exportedProfile.name = 'Imported-Profile';
      exportedProfile.description = 'This profile was exported and reimported';
      
      const importedProfile = profileManager.importProfile(exportedProfile);
      console.log(`Imported profile: ${importedProfile.name} (${importedProfile.id})`);
    }
  }

  // Test profile deletion
  console.log('\n🗑️ Testing profile deletion...');
  const profilesToDelete = profileManager.getProfilesByType('chatgpt').slice(0, 2);
  
  for (const profile of profilesToDelete) {
    console.log(`Deleting profile: ${profile.name}`);
    profileManager.deleteProfile(profile.id);
  }

  // Show final stats
  const finalStats = profileManager.getStats();
  console.log(`\n📊 Final profiles: ${finalStats.totalProfiles}`);

  // Test cleanup of old profiles
  console.log('\n🧹 Testing cleanup of old profiles...');
  profileManager.cleanupOldProfiles(24 * 60 * 60 * 1000); // 24 hours

  const cleanupStats = profileManager.getStats();
  console.log(`📊 After cleanup: ${cleanupStats.totalProfiles} profiles`);
}

/**
 * Run all browser profile examples
 */
async function runAllBrowserProfileExamples() {
  try {
    console.log('👤 Browser Profile Management Examples\n');

    // Example 1: Basic profile management
    await basicProfileManagementExample();

    // Example 2: Profile rotation and load balancing
    await profileRotationExample();

    // Example 3: Agent session with profile management
    await agentSessionWithProfilesExample();

    // Example 4: Multi-agent session management
    await multiAgentSessionExample();

    // Example 5: Profile cleanup and management
    await profileCleanupExample();

    console.log('\n✅ All browser profile examples completed successfully!');
  } catch (error) {
    console.error('❌ Browser profile example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllBrowserProfileExamples();
}

export {
  basicProfileManagementExample,
  profileRotationExample,
  agentSessionWithProfilesExample,
  multiAgentSessionExample,
  profileCleanupExample,
  runAllBrowserProfileExamples
}; 