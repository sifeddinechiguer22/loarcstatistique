/**
 * LOARC LABORATORY - API CLIENT (Section 13)
 * Centralizes all REST requests using Fetch API.
 * Connects to:
 * - Local Express backend: /api
 * - Or PHP backend: http://localhost/LOARC/backend/api
 */

class ApiClient {
  constructor() {
    // Check if custom backend URL was configured in localStorage, else default to integrated /api
    const customUrl = localStorage.getItem('loarc_custom_api_url');
    this.baseUrl = customUrl || '/api';
  }

  setBaseUrl(url) {
    if (url) {
      this.baseUrl = url.replace(/\/+$/, '');
      localStorage.setItem('loarc_custom_api_url', this.baseUrl);
    } else {
      this.baseUrl = '/api';
      localStorage.removeItem('loarc_custom_api_url');
    }
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  /**
   * Core fetch wrapper
   */
  async request(endpoint, options = {}) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {}),
    };

    const token = window.LOARC_AUTH?.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized (expired session)
      if (response.status === 401 && !endpoint.includes('/login')) {
        if (window.LOARC_AUTH) {
          window.LOARC_AUTH.logout();
        }
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || `Erreur serveur (${response.status})`);
      }

      return data;
    } catch (error) {
      // If fetching custom PHP URL fails, provide descriptive help
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Impossible de contacter le serveur à ${url}. Vérifiez que le Backend est bien démarré.`);
      }
      throw error;
    }
  }

  // ==========================================================================
  // API ENDPOINTS (Section 13)
  // ==========================================================================

  /**
   * GET /health
   */
  async getHealth() {
    return this.request('/health');
  }

  /**
   * POST /login
   */
  async login(credentials) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  /**
   * POST /logout
   */
  async logout() {
    return this.request('/logout', {
      method: 'POST',
    });
  }

  /**
   * GET /statistiques
   * Query params: { mode, year, week, month, startDate, endDate }
   */
  async getStatistiques(params = {}) {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const endpoint = queryString ? `/statistiques?${queryString}` : '/statistiques';
    return this.request(endpoint);
  }

  /**
   * GET /echantillons
   */
  async getEchantillons(params = {}) {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const endpoint = queryString ? `/echantillons?${queryString}` : '/echantillons';
    return this.request(endpoint);
  }

  /**
   * GET /factures
   */
  async getFactures(params = {}) {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const endpoint = queryString ? `/factures?${queryString}` : '/factures';
    return this.request(endpoint);
  }

  /**
   * GET /factures/{codeFacture}/echantillons
   */
  async getFactureEchantillons(codeFacture) {
    if (!codeFacture) throw new Error('Code facture requis');
    return this.request(`/factures/${encodeURIComponent(codeFacture)}/echantillons`);
  }
}

window.LOARC_API = new ApiClient();
