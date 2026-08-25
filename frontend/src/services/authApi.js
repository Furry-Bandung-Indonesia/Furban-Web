import config from '../config/api';

/**
 * Auth API Service
 * Handles all authentication-related API calls to the backend-auth service
 */
class AuthApiService {
  constructor() {
    this.authURL = config.authURL;
  }

  /**
   * Make a request to the auth service
   */
  async request(endpoint, options = {}) {
    const url = `${this.authURL}${endpoint}`;
    const token = this.getToken();

    const headers = {
      ...options.headers,
    };

    // Add JSON content type unless it's FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // For cookies
      });

      // Handle 401 - try to refresh token
      if (response.status === 401 && !options._isRetry) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          return this.request(endpoint, { ...options, _isRetry: true });
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new Error(error.message || `Request failed with status ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Auth API Error:', error);
      throw error;
    }
  }

  /**
   * Get token from memory/storage
   */
  getToken() {
    // For now, using localStorage (will be updated to memory-only later)
    return localStorage.getItem('authToken');
  }

  /**
   * Set token
   */
  setToken(token) {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  /**
   * Get refresh token
   */
  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Set refresh token
   */
  setRefreshToken(token) {
    if (token) {
      localStorage.setItem('refreshToken', token);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }

  /**
   * Try to refresh the access token
   */
  async tryRefreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.authURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setToken(data.token);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    // Clear tokens if refresh failed
    this.clearTokens();
    return false;
  }

  /**
   * Clear all tokens
   */
  clearTokens() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
  }

  // ========================================
  // Auth Endpoints
  // ========================================

  /**
   * Register Step 1 - Email and Password
   */
  async register(email, password, turnstileToken) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, turnstile_token: turnstileToken }),
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    if (data.refreshToken) {
      this.setRefreshToken(data.refreshToken);
    }
    
    return data;
  }

  /**
   * Register Step 2 - Complete Profile (Optional)
   * Can be called from dashboard profile section to complete pending profile
   */
  async completeProfile(legalName, nickname) {
    const data = await this.request('/auth/register/profile', {
      method: 'POST',
      body: JSON.stringify({ legal_name: legalName, nickname }),
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  /**
   * Get explanation for legal name requirement
   */
  async getWhyLegalName() {
    return this.request('/auth/why-legal-name', { method: 'GET' });
  }

  /**
   * Login
   */
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    if (data.refreshToken) {
      this.setRefreshToken(data.refreshToken);
    }
    if (data.user) {
      localStorage.setItem('userData', JSON.stringify(data.user));
    }
    
    return data;
  }

  /**
   * Google Sign-In / Register
   * Sends Google ID token credential to backend for verification
   */
  async googleAuth(credential) {
    const data = await this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    if (data.refreshToken) {
      this.setRefreshToken(data.refreshToken);
    }
    if (data.user) {
      localStorage.setItem('userData', JSON.stringify(data.user));
    }
    
    return data;
  }

  /**
   * Logout
   */
  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Refresh access token
   */
  async refresh() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const data = await this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  /**
   * Get current user profile
   */
  async getMe() {
    return this.request('/auth/me', { method: 'GET' });
  }

  /**
   * Update profile
   */
  async updateProfile(data) {
    return this.request('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Change password
   */
  async changePassword(oldPassword, newPassword) {
    return this.request('/auth/me/password', {
      method: 'PATCH',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });
  }

  /**
   * Upload avatar
   */
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request('/auth/me/avatar', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Remove avatar
   */
  async removeAvatar() {
    return this.request('/auth/me/avatar', { method: 'DELETE' });
  }

  // ========================================
  // Admin Endpoints
  // ========================================

  /**
   * Get all users (admin only)
   */
  async getUsers() {
    return this.request('/auth/admin/users', { method: 'GET' });
  }

  /**
   * Get user by UUID (admin only)
   */
  async getUser(uuid) {
    return this.request(`/auth/admin/users/${uuid}`, { method: 'GET' });
  }

  /**
   * Get user public profile by UUID (any authenticated user)
   * Returns: uuid, email, nickname, legal_name, first_name, last_name,
   *          date_of_birth, social_link, profile_image_url, role
   */
  async getUserProfile(uuid) {
    return this.request(`/auth/users/${uuid}/profile`, { method: 'GET' });
  }

  /**
   * Create user (admin only)
   */
  async createUser(userData) {
    return this.request('/auth/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  /**
   * Update user (admin only)
   */
  async updateUser(uuid, userData) {
    return this.request(`/auth/admin/users/${uuid}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(uuid, role) {
    return this.request(`/auth/admin/users/${uuid}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(uuid) {
    return this.request(`/auth/admin/users/${uuid}`, { method: 'DELETE' });
  }

  /**
   * Get auth stats (admin only)
   */
  async getStats() {
    return this.request('/auth/admin/stats', { method: 'GET' });
  }

  /**
   * Alias for getStats - used by Dashboard
   */
  async getAdminStats() {
    return this.getStats();
  }

  /**
   * Alias for createUser - used by Dashboard
   */
  async adminCreateUser(userData) {
    return this.createUser(userData);
  }

  /**
   * Alias for updateUser - used by Dashboard
   */
  async adminUpdateUser(uuid, userData) {
    return this.updateUser(uuid, userData);
  }

  /**
   * Alias for updateUserRole - used by Dashboard
   */
  async adminSetRole(uuid, role) {
    return this.updateUserRole(uuid, role);
  }

  /**
   * Alias for deleteUser - used by Dashboard
   */
  async adminDeleteUser(uuid) {
    return this.deleteUser(uuid);
  }

  // ═══════════════════════════════════════════════════
  // USER SEARCH (for host assignment)
  // ═══════════════════════════════════════════════════

  /**
   * Search users by name, nickname, or email.
   * @param {string} query - Search term (min 2 chars)
   * @returns {{ users: Array<{ uuid, email, nickname, legal_name, first_name, last_name, profile_image_url, role }> }}
   */
  async searchUsers(query) {
    return this.request(`/auth/users/search?q=${encodeURIComponent(query)}`);
  }

  // ═══════════════════════════════════════════════════
  // TELEGRAM INTEGRATION
  // ═══════════════════════════════════════════════════

  /**
   * Link current user's Telegram account
   * @param {string|number} telegramId - Telegram user ID
   * @param {string} [telegramUsername] - Telegram @username
   */
  async linkTelegram(telegramId, telegramUsername = null) {
    return this.request('/auth/me/telegram/link', {
      method: 'POST',
      body: JSON.stringify({
        telegram_id: telegramId,
        telegram_username: telegramUsername,
      }),
    });
  }

  /**
   * Unlink current user's Telegram account
   */
  async unlinkTelegram() {
    return this.request('/auth/me/telegram/unlink', {
      method: 'DELETE',
    });
  }

  /**
   * Get all Telegram-linked users (admin only)
   */
  async getTelegramUsers() {
    return this.request('/auth/admin/telegram-users', {
      method: 'GET',
    });
  }

  /**
   * Admin unlink another user's Telegram account
   * @param {string} userUuid - Target user UUID
   */
  async adminUnlinkTelegram(userUuid) {
    return this.request(`/auth/admin/users/${userUuid}/telegram`, {
      method: 'DELETE',
    });
  }
}

export default new AuthApiService();
