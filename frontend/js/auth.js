/**
 * LOARC LABORATORY - AUTHENTICATION MODULE (Section 4)
 * Handles token storage, session protection, login and logout.
 */

const TOKEN_KEY = 'loarc_token';
const USER_KEY = 'loarc_user';

const Auth = {
  /**
   * Check if user is currently authenticated with a valid token
   */
  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Get current auth token
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Get logged-in user profile
   */
  getUser() {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Perform login via API
   */
  async login(username, password) {
    if (!window.LOARC_API) {
      throw new Error('API client non initialisé.');
    }

    const res = await window.LOARC_API.login({ username, password });
    if (res.success && res.token) {
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user || {
        nom: 'Dr. Karim Bennani',
        role: 'Directeur de Laboratoire',
        email: 'directeur@loarc.ma'
      }));
      return res;
    }
    throw new Error(res.message || 'Échec de la connexion');
  },

  /**
   * Perform logout and redirect to login page
   */
  async logout() {
    try {
      if (window.LOARC_API) {
        await window.LOARC_API.logout().catch(() => {});
      }
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = '/frontend/login.html';
    }
  },

  /**
   * Enforce page protection
   * Call this on private pages to redirect unauthenticated visitors
   */
  protectPage() {
    if (!this.isAuthenticated()) {
      window.location.replace('/frontend/login.html?expired=1');
      return false;
    }
    return true;
  },

  /**
   * Redirect away from login page if already logged in
   */
  redirectIfAuthenticated() {
    if (this.isAuthenticated()) {
      window.location.replace('/frontend/index.html');
      return true;
    }
    return false;
  },

  /**
   * Update header with current user details
   */
  renderHeaderUser() {
    const user = this.getUser();
    if (!user) return;

    const nameEl = document.getElementById('header-user-name');
    const roleEl = document.getElementById('header-user-role');
    const avatarEl = document.getElementById('header-user-avatar');

    if (nameEl) nameEl.textContent = user.nom || 'Dr. Karim Bennani';
    if (roleEl) roleEl.textContent = user.role || 'Laboratoire LOARC';
    if (avatarEl) {
      const initials = (user.nom || 'LO')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('');
      avatarEl.textContent = initials.toUpperCase();
    }
  }
};

window.LOARC_AUTH = Auth;
