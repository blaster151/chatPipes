// Auth Manager UI Application
class AuthManagerUI {
    constructor() {
        this.currentTab = 'platforms';
        this.currentLoginSession = null;
        this.platforms = [];
        this.sessions = [];
        this.profiles = [];
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadStats();
        await this.loadPlatforms();
        await this.loadSessions();
        this.setupAutoRefresh();
    }

    setupEventListeners() {
        // Tab switching
        document.getElementById('platformsTab').addEventListener('click', () => this.switchTab('platforms'));
        document.getElementById('sessionsTab').addEventListener('click', () => this.switchTab('sessions'));
        document.getElementById('profilesTab').addEventListener('click', () => this.switchTab('profiles'));

        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshAll());

        // Verify all sessions
        document.getElementById('verifyAllBtn').addEventListener('click', () => this.verifyAllSessions());

        // Profile platform selector
        document.getElementById('profilePlatformSelect').addEventListener('change', (e) => {
            this.loadProfiles(e.target.value);
        });

        // Modal close
        document.getElementById('closeLoginModal').addEventListener('click', () => this.closeLoginModal());

        // Close modal on outside click
        document.getElementById('loginModal').addEventListener('click', (e) => {
            if (e.target.id === 'loginModal') {
                this.closeLoginModal();
            }
        });
    }

    async switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('border-blue-500', 'text-blue-600');
            btn.classList.add('border-transparent', 'text-gray-500');
        });

        document.getElementById(`${tabName}Tab`).classList.add('border-blue-500', 'text-blue-600');
        document.getElementById(`${tabName}Tab`).classList.remove('border-transparent', 'text-gray-500');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`${tabName}Content`).classList.remove('hidden');

        this.currentTab = tabName;

        // Load data for the tab
        switch (tabName) {
            case 'platforms':
                await this.loadPlatforms();
                break;
            case 'sessions':
                await this.loadSessions();
                break;
            case 'profiles':
                await this.loadProfiles();
                break;
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/stats');
            const stats = await response.json();

            document.getElementById('totalSessions').textContent = stats.auth.totalSessions;
            document.getElementById('activeSessions').textContent = stats.auth.activeSessions;
            document.getElementById('verifiedSessions').textContent = stats.auth.verifiedSessions;
            document.getElementById('totalProfiles').textContent = stats.profiles.totalProfiles;

            // Update connection status
            const statusElement = document.getElementById('connectionStatus');
            statusElement.innerHTML = '<span class="status-indicator status-active"></span>Connected';
        } catch (error) {
            console.error('Failed to load stats:', error);
            this.showToast('Failed to load statistics', 'error');
        }
    }

    async loadPlatforms() {
        try {
            const response = await fetch('/api/platforms');
            this.platforms = await response.json();
            this.renderPlatforms();
        } catch (error) {
            console.error('Failed to load platforms:', error);
            this.showToast('Failed to load platforms', 'error');
        }
    }

    renderPlatforms() {
        const grid = document.getElementById('platformsGrid');
        grid.innerHTML = '';

        this.platforms.forEach(platform => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow-md p-6 card-hover border border-gray-200';
            
            card.innerHTML = `
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-3">
                        <span class="text-2xl">${platform.icon}</span>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900">${platform.name}</h3>
                            <p class="text-sm text-gray-600">${platform.description}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${platform.requiresAuth ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
                            ${platform.requiresAuth ? 'Auth Required' : 'No Auth'}
                        </span>
                    </div>
                </div>
                <div class="space-y-3">
                    <div class="flex items-center text-sm text-gray-600">
                        <i class="fas fa-globe mr-2"></i>
                        <a href="${platform.url}" target="_blank" class="text-blue-600 hover:text-blue-800">${platform.url}</a>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="authUI.startLogin('${platform.id}')" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm">
                            <i class="fas fa-sign-in-alt mr-2"></i>Login
                        </button>
                        <button onclick="authUI.viewProfiles('${platform.id}')" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm">
                            <i class="fas fa-users mr-2"></i>Profiles
                        </button>
                    </div>
                </div>
            `;
            
            grid.appendChild(card);
        });
    }

    async startLogin(platformId) {
        try {
            this.showLoading(true);
            
            const response = await fetch('/api/login/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ platform: platformId })
            });

            const result = await response.json();
            
            if (result.success) {
                this.currentLoginSession = result.sessionId;
                this.showLoginModal(result.step, platformId);
            } else {
                this.showToast(result.error || 'Failed to start login', 'error');
            }
        } catch (error) {
            console.error('Failed to start login:', error);
            this.showToast('Failed to start login process', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showLoginModal(step, platformId) {
        const modal = document.getElementById('loginModal');
        const title = document.getElementById('loginModalTitle');
        const content = document.getElementById('loginModalContent');

        title.textContent = `Login to ${this.getPlatformName(platformId)}`;
        
        content.innerHTML = this.generateLoginForm(step);
        
        modal.classList.remove('hidden');

        // Setup form submission
        const form = content.querySelector('form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleLoginStep(e, step.id));
        }
    }

    generateLoginForm(step) {
        let inputHtml = '';
        
        switch (step.type) {
            case 'input':
                inputHtml = `
                    <input type="${step.id === 'password' ? 'password' : 'text'}" 
                           id="loginInput" 
                           name="${step.id}"
                           placeholder="${step.placeholder || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                           ${step.required ? 'required' : ''}>
                `;
                break;
            case 'captcha':
                inputHtml = `
                    <div class="text-center py-4">
                        <i class="fas fa-shield-alt text-4xl text-orange-500 mb-4"></i>
                        <p class="text-gray-700">A captcha has appeared in the browser window.</p>
                        <p class="text-sm text-gray-600 mt-2">Please solve it manually and then click Continue.</p>
                    </div>
                `;
                break;
        }

        return `
            <form id="loginForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">${step.title}</label>
                    <p class="text-sm text-gray-600 mb-3">${step.description}</p>
                    ${inputHtml}
                </div>
                <div class="flex space-x-3">
                    <button type="button" onclick="authUI.closeLoginModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                        ${step.type === 'captcha' ? 'Continue' : 'Next'}
                    </button>
                </div>
            </form>
        `;
    }

    async handleLoginStep(event, stepId) {
        event.preventDefault();
        
        try {
            this.showLoading(true);
            
            const formData = new FormData(event.target);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });

            const response = await fetch('/api/login/step', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.currentLoginSession,
                    stepId: stepId,
                    data: data
                })
            });

            const result = await response.json();
            
            if (result.success) {
                if (result.sessionId) {
                    // Login completed
                    this.closeLoginModal();
                    this.showToast('Login successful!', 'success');
                    await this.refreshAll();
                } else if (result.nextStep) {
                    // Continue to next step
                    this.showLoginModal(result.step, this.getCurrentPlatform());
                }
            } else {
                this.showToast(result.error || 'Login step failed', 'error');
            }
        } catch (error) {
            console.error('Failed to process login step:', error);
            this.showToast('Failed to process login step', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    closeLoginModal() {
        document.getElementById('loginModal').classList.add('hidden');
        this.currentLoginSession = null;
    }

    async loadSessions() {
        try {
            const response = await fetch('/api/sessions');
            this.sessions = await response.json();
            this.renderSessions();
        } catch (error) {
            console.error('Failed to load sessions:', error);
            this.showToast('Failed to load sessions', 'error');
        }
    }

    renderSessions() {
        const tbody = document.getElementById('sessionsTableBody');
        tbody.innerHTML = '';

        if (this.sessions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                        No active sessions found
                    </td>
                </tr>
            `;
            return;
        }

        this.sessions.forEach(session => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            const statusClass = this.getStatusClass(session.verificationStatus);
            const statusText = this.getStatusText(session.verificationStatus);
            const duration = this.formatDuration(session.duration);
            const lastVerified = this.formatTime(session.lastVerified);
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <span class="text-lg mr-2">${this.getPlatformIcon(session.platform)}</span>
                        <div>
                            <div class="text-sm font-medium text-gray-900">${this.getPlatformName(session.platform)}</div>
                            <div class="text-sm text-gray-500">${session.id}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                        <span class="status-indicator ${statusClass.replace('bg-', 'status-').replace('-100', '')}"></span>
                        ${statusText}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${lastVerified}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${duration}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="authUI.verifySession('${session.id}')" class="text-blue-600 hover:text-blue-900">
                            <i class="fas fa-check"></i>
                        </button>
                        <button onclick="authUI.deleteSession('${session.id}')" class="text-red-600 hover:text-red-900">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    async verifySession(sessionId) {
        try {
            this.showLoading(true);
            
            const response = await fetch(`/api/verify/${sessionId}`);
            const result = await response.json();
            
            if (result.success) {
                this.showToast('Session verified successfully', 'success');
            } else {
                this.showToast(`Verification failed: ${result.reason}`, 'error');
            }
            
            await this.loadSessions();
        } catch (error) {
            console.error('Failed to verify session:', error);
            this.showToast('Failed to verify session', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async deleteSession(sessionId) {
        if (!confirm('Are you sure you want to delete this session?')) {
            return;
        }

        try {
            this.showLoading(true);
            
            const response = await fetch(`/api/sessions/${sessionId}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            
            if (result.success) {
                this.showToast('Session deleted successfully', 'success');
                await this.loadSessions();
            } else {
                this.showToast('Failed to delete session', 'error');
            }
        } catch (error) {
            console.error('Failed to delete session:', error);
            this.showToast('Failed to delete session', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async verifyAllSessions() {
        try {
            this.showLoading(true);
            
            const promises = this.sessions.map(session => 
                fetch(`/api/verify/${session.id}`).then(r => r.json())
            );
            
            const results = await Promise.all(promises);
            const successCount = results.filter(r => r.success).length;
            
            this.showToast(`Verified ${successCount}/${this.sessions.length} sessions`, 'success');
            await this.loadSessions();
        } catch (error) {
            console.error('Failed to verify all sessions:', error);
            this.showToast('Failed to verify all sessions', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadProfiles(platformFilter = '') {
        try {
            const url = platformFilter ? `/api/profiles/${platformFilter}` : '/api/profiles/all';
            const response = await fetch(url);
            this.profiles = await response.json();
            this.renderProfiles();
        } catch (error) {
            console.error('Failed to load profiles:', error);
            this.showToast('Failed to load profiles', 'error');
        }
    }

    renderProfiles() {
        const grid = document.getElementById('profilesGrid');
        grid.innerHTML = '';

        if (this.profiles.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-8 text-gray-500">
                    No profiles found
                </div>
            `;
            return;
        }

        this.profiles.forEach(profile => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow-md p-6 card-hover border border-gray-200';
            
            const lastUsed = this.formatTime(profile.lastUsed);
            const statusClass = profile.hasAuthState && profile.authStateValid ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
            const statusText = profile.hasAuthState && profile.authStateValid ? 'Authenticated' : 'No Auth';
            
            card.innerHTML = `
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">${profile.name}</h3>
                        <p class="text-sm text-gray-600">${profile.description || 'No description'}</p>
                    </div>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                        ${statusText}
                    </span>
                </div>
                <div class="space-y-2 text-sm text-gray-600">
                    <div class="flex justify-between">
                        <span>Usage Count:</span>
                        <span class="font-medium">${profile.usageCount || 0}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Last Used:</span>
                        <span class="font-medium">${lastUsed}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Status:</span>
                        <span class="font-medium ${profile.isActive ? 'text-green-600' : 'text-gray-600'}">
                            ${profile.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
            `;
            
            grid.appendChild(card);
        });
    }

    viewProfiles(platformId) {
        this.switchTab('profiles');
        document.getElementById('profilePlatformSelect').value = platformId;
        this.loadProfiles(platformId);
    }

    async refreshAll() {
        await Promise.all([
            this.loadStats(),
            this.loadPlatforms(),
            this.loadSessions(),
            this.loadProfiles()
        ]);
    }

    setupAutoRefresh() {
        // Refresh every 30 seconds
        setInterval(() => {
            this.loadStats();
            if (this.currentTab === 'sessions') {
                this.loadSessions();
            }
        }, 30000);
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (show) {
            spinner.classList.remove('hidden');
        } else {
            spinner.classList.add('hidden');
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        
        const bgColor = type === 'success' ? 'bg-green-500' : 
                       type === 'error' ? 'bg-red-500' : 
                       type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';
        
        toast.className = `${bgColor} text-white px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
        toast.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    // Helper methods
    getPlatformName(platformId) {
        const platform = this.platforms.find(p => p.id === platformId);
        return platform ? platform.name : platformId;
    }

    getPlatformIcon(platformId) {
        const platform = this.platforms.find(p => p.id === platformId);
        return platform ? platform.icon : '🤖';
    }

    getCurrentPlatform() {
        // This would need to be tracked during login flow
        return 'chatgpt'; // Default fallback
    }

    getStatusClass(status) {
        switch (status) {
            case 'verified': return 'bg-green-100 text-green-800';
            case 'failed': return 'bg-red-100 text-red-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    getStatusText(status) {
        switch (status) {
            case 'verified': return 'Verified';
            case 'failed': return 'Failed';
            case 'pending': return 'Pending';
            default: return 'Unknown';
        }
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    formatTime(timestamp) {
        if (!timestamp) return 'Never';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
}

// Initialize the UI when the page loads
let authUI;
document.addEventListener('DOMContentLoaded', () => {
    authUI = new AuthManagerUI();
}); 