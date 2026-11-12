/**
 * LOARC LABORATORY - MAIN APPLICATION CONTROLLER
 * Initializes views, orchestrates data fetches, and handles user interactions.
 */

class LoarcApp {
  constructor() {
    this.isLoading = false;
  }

  async init() {
    // 1. Guard route: verify user is authenticated
    if (!window.LOARC_AUTH || !window.LOARC_AUTH.protectPage()) {
      return;
    }

    // 2. Render user info in header
    window.LOARC_AUTH.renderHeaderUser();

    // 3. Initialize Navigation & Filters
    if (window.LOARC_NAV) window.LOARC_NAV.init();
    if (window.LOARC_FILTERS) {
      window.LOARC_FILTERS.init();
      window.LOARC_FILTERS.onFilterChange(() => {
        this.loadData();
      });
    }

    // 4. Bind Global Actions (Refresh, Logout, Search, API Settings)
    this.bindActions();

    // 5. Check API Health and Load initial dataset
    await this.checkHealth();
    await this.loadData();
  }

  bindActions() {
    // Refresh button
    const btnRefresh = document.getElementById('btn-refresh-data');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => {
        this.loadData(true);
      });
    }

    // Logout button
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Voulez-vous vraiment vous déconnecter de LOARC ?')) {
          window.LOARC_AUTH.logout();
        }
      });
    }

    // Search input - Echantillons
    const searchEch = document.getElementById('search-echantillons');
    if (searchEch && window.LOARC_UTILS) {
      searchEch.addEventListener('input', window.LOARC_UTILS.debounce((e) => {
        window.LOARC_STATS?.filterAndRenderEchantillonsTable(e.target.value);
      }, 200));
    }

    // Search input - Factures
    const searchFact = document.getElementById('search-factures');
    if (searchFact && window.LOARC_UTILS) {
      searchFact.addEventListener('input', window.LOARC_UTILS.debounce((e) => {
        window.LOARC_STATS?.filterAndRenderFacturesTable(e.target.value);
      }, 200));
    }

    // Search input - Produits
    const searchProd = document.getElementById('search-produits');
    if (searchProd && window.LOARC_UTILS) {
      searchProd.addEventListener('input', window.LOARC_UTILS.debounce((e) => {
        window.LOARC_STATS?.filterAndRenderProduitsTable(e.target.value);
      }, 200));
    }

    // Invoice Detail Modal Close Handlers
    const modalBackdrop = document.getElementById('modal-invoice-detail');
    const modalCloseBtn = document.getElementById('modal-invoice-close');
    const modalCloseX = document.getElementById('modal-invoice-x');

    [modalCloseBtn, modalCloseX, modalBackdrop].forEach(el => {
      if (!el) return;
      el.addEventListener('click', (e) => {
        if (e.target === el || el !== modalBackdrop) {
          modalBackdrop?.classList.remove('active');
        }
      });
    });

    // API Config Modal Handlers
    this.bindApiConfigModal();
  }

  bindApiConfigModal() {
    const btnOpen = document.getElementById('btn-api-config');
    const modal = document.getElementById('modal-api-config');
    const btnSave = document.getElementById('btn-save-api-url');
    const btnReset = document.getElementById('btn-reset-api-url');
    const btnTest = document.getElementById('btn-test-api');
    const inputUrl = document.getElementById('input-api-url');
    const testResult = document.getElementById('api-test-result');

    if (!modal) return;

    if (btnOpen) {
      btnOpen.addEventListener('click', () => {
        if (inputUrl && window.LOARC_API) {
          inputUrl.value = window.LOARC_API.getBaseUrl();
        }
        if (testResult) testResult.textContent = '';
        modal.classList.add('active');
      });
    }

    const closeModal = () => modal.classList.remove('active');
    document.getElementById('modal-api-close')?.addEventListener('click', closeModal);
    document.getElementById('modal-api-x')?.addEventListener('click', closeModal);

    if (btnSave) {
      btnSave.addEventListener('click', () => {
        const url = (inputUrl?.value || '').trim();
        window.LOARC_API?.setBaseUrl(url);
        window.LOARC_UTILS?.showToast('Configuration API mise à jour !', 'success');
        closeModal();
        this.loadData(true);
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        window.LOARC_API?.setBaseUrl('');
        if (inputUrl) inputUrl.value = '/api';
        window.LOARC_UTILS?.showToast('URL réinitialisée sur le serveur intégré (/api)', 'info');
      });
    }

    if (btnTest) {
      btnTest.addEventListener('click', async () => {
        if (testResult) {
          testResult.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Test de connexion...';
          testResult.style.color = 'var(--text-muted)';
        }
        try {
          const health = await window.LOARC_API.getHealth();
          if (testResult) {
            testResult.innerHTML = `<i class="fa-solid fa-circle-check"></i> Connexion réussie : ${health.service || 'LOARC API'} (${health.database || 'MySQL'})`;
            testResult.style.color = 'var(--success)';
          }
        } catch (e) {
          if (testResult) {
            testResult.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Échec : ${e.message}`;
            testResult.style.color = 'var(--danger)';
          }
        }
      });
    }
  }

  async checkHealth() {
    try {
      const health = await window.LOARC_API.getHealth();
      const statusText = document.getElementById('sidebar-status-text');
      if (statusText) statusText.textContent = 'En ligne';
    } catch (e) {
      const statusText = document.getElementById('sidebar-status-text');
      if (statusText) {
        statusText.textContent = 'Erreur API';
        statusText.style.color = 'var(--danger)';
      }
    }
  }

  /**
   * Fetch all data according to current filters
   */
  async loadData(showToastOnSuccess = false) {
    if (this.isLoading) return;
    this.isLoading = true;

    const refreshBtnIcon = document.querySelector('#btn-refresh-data i');
    if (refreshBtnIcon) refreshBtnIcon.classList.add('fa-spin');

    // Show skeletons on tables
    window.LOARC_UTILS?.setTableSkeleton('table-echantillons-body', 5, 5);
    window.LOARC_UTILS?.setTableSkeleton('table-factures-body', 6, 5);
    window.LOARC_UTILS?.setTableSkeleton('table-produits-body', 5, 5);

    try {
      const filterParams = window.LOARC_FILTERS ? window.LOARC_FILTERS.getQueryParams() : {};

      // Concurrent fetch of statistics, samples, and invoices
      const [statsRes, echRes, factRes] = await Promise.all([
        window.LOARC_API.getStatistiques(filterParams),
        window.LOARC_API.getEchantillons(filterParams),
        window.LOARC_API.getFactures(filterParams),
      ]);

      const stats = statsRes.data;
      const echantillons = echRes.data || [];
      const factures = factRes.data || [];

      // Render KPIs
      window.LOARC_STATS?.renderKPIs(stats.kpi);

      // Render Charts
      window.LOARC_CHARTS?.updateAll(stats);

      // Render Specific Views
      window.LOARC_STATS?.renderEchantillonsSection(echantillons, stats);
      window.LOARC_STATS?.renderFacturesSection(factures, stats);
      window.LOARC_STATS?.renderProduitsSection(echantillons, stats);

      if (showToastOnSuccess) {
        window.LOARC_UTILS?.showToast('Données actualisées avec succès.', 'success');
      }
    } catch (error) {
      console.error('[LOARC] Error loading data:', error);
      window.LOARC_UTILS?.showToast(error.message || 'Erreur lors du chargement des données.', 'error');
    } finally {
      this.isLoading = false;
      if (refreshBtnIcon) refreshBtnIcon.classList.remove('fa-spin');
    }
  }

  /**
   * Open invoice detail modal (GET /factures/{codeFacture}/echantillons)
   */
  async openInvoiceModal(codeFacture) {
    const modal = document.getElementById('modal-invoice-detail');
    const title = document.getElementById('modal-invoice-code');
    const body = document.getElementById('modal-invoice-body');
    if (!modal || !body) return;

    title.textContent = `Facture ${codeFacture}`;
    body.innerHTML = '<div style="padding: 24px; text-align: center;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 24px; color: var(--primary);"></i><p style="margin-top: 8px; font-size: 13px;">Chargement des échantillons...</p></div>';
    modal.classList.add('active');

    try {
      const res = await window.LOARC_API.getFactureEchantillons(codeFacture);
      const fact = res.facture;
      const samples = res.data || [];

      body.innerHTML = `
        <div style="background-color: var(--bg-canvas); padding: 16px; border-radius: var(--radius-sm); margin-bottom: 20px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 13px;">
          <div>
            <div style="color: var(--text-muted); font-size: 11px; font-weight: 600;">DATE D'ÉMISSION</div>
            <div style="font-weight: 600; margin-top: 2px;">${window.LOARC_UTILS?.formatDateFR(fact?.date_fact)}</div>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 11px; font-weight: 600;">NUMÉRO COMPTABLE</div>
            <div style="font-weight: 600; margin-top: 2px;">${fact?.num_fact || '—'}</div>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 11px; font-weight: 600;">MONTANT TOTAL</div>
            <div style="font-weight: 700; color: var(--primary-dark); margin-top: 2px;" class="tabular">
              ${window.LOARC_UTILS?.formatDH(fact?.montant_fact)}
            </div>
          </div>
        </div>

        <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
          <span>Échantillons associés</span>
          <span class="pill-count">${samples.length} échantillon${samples.length > 1 ? 's' : ''}</span>
        </h4>

        ${samples.length === 0 ? `
          <div class="empty-state" style="padding: 20px;">
            <p>Aucun échantillon rattaché à cette facture.</p>
          </div>
        ` : `
          <table class="loarc-table">
            <thead>
              <tr>
                <th>Code Échantillon</th>
                <th>Numéro Produit</th>
                <th>Rattachement</th>
              </tr>
            </thead>
            <tbody>
              ${samples.map(s => `
                <tr>
                  <td><span class="code-badge">${s.code_ech}</span></td>
                  <td><strong>${s.num_produit}</strong></td>
                  <td><i class="fa-solid fa-check" style="color: var(--success); margin-right: 6px;"></i> Facturé</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      `;
    } catch (e) {
      body.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-triangle-exclamation" style="color: var(--danger);"></i>
          <h4>Erreur de chargement</h4>
          <p>${e.message}</p>
        </div>
      `;
    }
  }
}

window.LOARC_APP = new LoarcApp();

document.addEventListener('DOMContentLoaded', () => {
  window.LOARC_APP.init();
});
