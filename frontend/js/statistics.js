/**
 * LOARC LABORATORY - STATISTICS & DATA RENDERING (Sections 6, 9, 10, 11)
 * Computes, formats, and renders data into UI cards, tables and views.
 */

class StatisticsRenderer {
  constructor() {
    this.currentStats = null;
    this.allEchantillons = [];
    this.allFactures = [];
  }

  /**
   * Render Dashboard KPIs (Section 6)
   */
  renderKPIs(kpi) {
    if (!kpi) return;

    const elTotalEch = document.getElementById('kpi-total-echantillons');
    const elTotalFact = document.getElementById('kpi-total-factures');
    const elTotalCA = document.getElementById('kpi-total-ca');
    const elMoyenFact = document.getElementById('kpi-montant-moyen');

    if (elTotalEch) elTotalEch.textContent = window.LOARC_UTILS?.formatNumber(kpi.total_echantillons) || '0';
    if (elTotalFact) elTotalFact.textContent = window.LOARC_UTILS?.formatNumber(kpi.total_factures) || '0';
    if (elTotalCA) elTotalCA.textContent = window.LOARC_UTILS?.formatDH(kpi.chiffre_affaires) || '0,00 DH';
    if (elMoyenFact) elMoyenFact.textContent = window.LOARC_UTILS?.formatDH(kpi.montant_moyen) || '0,00 DH';

    // Sub-metric updates
    const elSubFact = document.getElementById('kpi-sub-factures');
    if (elSubFact && kpi.total_factures > 0) {
      const avgEchPerFact = (kpi.total_echantillons / kpi.total_factures).toFixed(1);
      elSubFact.textContent = `Moy. ${avgEchPerFact} échantillons / facture`;
    }
  }

  /**
   * Render Section 9: Statistiques Échantillons
   */
  renderEchantillonsSection(samples, stats) {
    this.allEchantillons = samples || [];

    // KPI cards in Echantillons section
    const elCount = document.getElementById('ech-total-count');
    if (elCount) elCount.textContent = window.LOARC_UTILS?.formatNumber(samples.length) || '0';

    // Products distribution
    const prodCounts = {};
    samples.forEach(s => {
      prodCounts[s.num_produit] = (prodCounts[s.num_produit] || 0) + 1;
    });

    const elProdCount = document.getElementById('ech-distinct-products');
    if (elProdCount) elProdCount.textContent = Object.keys(prodCounts).length;

    // Top products ranking in Echantillons tab
    const topProdContainer = document.getElementById('ech-top-products-list');
    if (topProdContainer) {
      const sorted = Object.entries(prodCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      if (sorted.length === 0) {
        topProdContainer.innerHTML = '<div class="empty-state"><p>Aucun produit disponible</p></div>';
      } else {
        topProdContainer.innerHTML = sorted.map(([prod, count], index) => {
          const pct = samples.length > 0 ? ((count / samples.length) * 100).toFixed(1) : 0;
          return `
            <div style="margin-bottom: 14px;">
              <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 4px;">
                <span class="code-badge">${prod}</span>
                <span class="tabular">${count} éch. (${pct}%)</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${pct}%;"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Render samples table
    this.filterAndRenderEchantillonsTable('');
  }

  filterAndRenderEchantillonsTable(searchTerm = '') {
    const tbody = document.getElementById('table-echantillons-body');
    const countBadge = document.getElementById('table-echantillons-count');
    if (!tbody) return;

    const term = (searchTerm || '').trim().toLowerCase();
    const filtered = this.allEchantillons.filter(e => {
      if (!term) return true;
      return (
        (e.code_ech || '').toLowerCase().includes(term) ||
        (e.num_produit || '').toLowerCase().includes(term) ||
        (e.code_facture || '').toLowerCase().includes(term) ||
        (e.num_fact || '').toLowerCase().includes(term)
      );
    });

    if (countBadge) countBadge.textContent = `${filtered.length} échantillon${filtered.length > 1 ? 's' : ''}`;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <i class="fa-solid fa-vial-circle-check"></i>
              <h4>Aucun échantillon trouvé</h4>
              <p>Modifiez votre filtre temporel ou votre recherche.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    // Limit initial display to 50 rows for performance
    const displayList = filtered.slice(0, 60);

    tbody.innerHTML = displayList.map(e => `
      <tr>
        <td><span class="code-badge">${e.code_ech}</span></td>
        <td><strong>${e.num_produit}</strong></td>
        <td>
          <a href="javascript:void(0)" class="link-facture" data-code="${e.code_facture}" style="color: var(--primary); font-weight: 600; text-decoration: none;">
            ${e.code_facture} ${e.num_fact ? `(${e.num_fact})` : ''}
          </a>
        </td>
        <td>${window.LOARC_UTILS?.formatDateFR(e.date_facture) || '—'}</td>
        <td class="numeric tabular" style="font-weight: 600;">
          ${e.montant_fact ? window.LOARC_UTILS?.formatDH(e.montant_fact) : '—'}
        </td>
      </tr>
    `).join('');

    // Attach click handlers to invoice links to open detail drawer
    tbody.querySelectorAll('.link-facture').forEach(a => {
      a.addEventListener('click', () => {
        const code = a.getAttribute('data-code');
        if (code && window.LOARC_APP) {
          window.LOARC_APP.openInvoiceModal(code);
        }
      });
    });
  }

  /**
   * Render Section 10: Statistiques Factures
   */
  renderFacturesSection(factures, stats) {
    this.allFactures = factures || [];

    // KPI Summary
    const totalFact = factures.length;
    const totalCA = factures.reduce((sum, f) => sum + (f.montant_fact || 0), 0);
    const moyen = totalFact > 0 ? totalCA / totalFact : 0;

    const elTotal = document.getElementById('fact-total-count');
    const elCA = document.getElementById('fact-total-ca');
    const elMoyen = document.getElementById('fact-montant-moyen');

    if (elTotal) elTotal.textContent = window.LOARC_UTILS?.formatNumber(totalFact);
    if (elCA) elCA.textContent = window.LOARC_UTILS?.formatDH(totalCA);
    if (elMoyen) elMoyen.textContent = window.LOARC_UTILS?.formatDH(moyen);

    // Highest invoice card highlight (Section 10)
    const maxFact = stats?.facture_max || (factures.length > 0 ? factures.reduce((prev, curr) => (curr.montant_fact > prev.montant_fact ? curr : prev), factures[0]) : null);
    const highlightCard = document.getElementById('highlight-invoice-container');
    if (highlightCard) {
      if (maxFact) {
        highlightCard.innerHTML = `
          <div class="highlight-invoice-card">
            <div class="highlight-left">
              <h3><i class="fa-solid fa-trophy" style="margin-right: 6px;"></i> Facture avec le montant le plus élevé</h3>
              <div class="highlight-amount tabular">${window.LOARC_UTILS?.formatDH(maxFact.montant_fact)}</div>
              <div class="highlight-meta">
                <span><i class="fa-regular fa-file-lines"></i> ${maxFact.code_fact} ${maxFact.num_fact ? `(${maxFact.num_fact})` : ''}</span>
                <span><i class="fa-regular fa-calendar"></i> ${window.LOARC_UTILS?.formatDateFR(maxFact.date_fact)}</span>
                <span><i class="fa-solid fa-vials"></i> ${maxFact.nb_echantillons || 0} échantillons associés</span>
              </div>
            </div>
            <button class="btn-secondary view-invoice-btn" data-code="${maxFact.code_fact}" style="background-color: #FFFFFF; color: var(--primary-dark); font-weight: 600;">
              <i class="fa-solid fa-eye"></i> Voir Détails
            </button>
          </div>
        `;
        highlightCard.querySelector('.view-invoice-btn')?.addEventListener('click', () => {
          window.LOARC_APP?.openInvoiceModal(maxFact.code_fact);
        });
      } else {
        highlightCard.innerHTML = '';
      }
    }

    // Render factures table
    this.filterAndRenderFacturesTable('');
  }

  filterAndRenderFacturesTable(searchTerm = '') {
    const tbody = document.getElementById('table-factures-body');
    const countBadge = document.getElementById('table-factures-count');
    if (!tbody) return;

    const term = (searchTerm || '').trim().toLowerCase();
    const filtered = this.allFactures.filter(f => {
      if (!term) return true;
      return (
        (f.code_fact || '').toLowerCase().includes(term) ||
        (f.num_fact || '').toLowerCase().includes(term) ||
        (f.date_fact || '').toLowerCase().includes(term)
      );
    });

    if (countBadge) countBadge.textContent = `${filtered.length} facture${filtered.length > 1 ? 's' : ''}`;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <i class="fa-solid fa-file-invoice-dollar"></i>
              <h4>Aucune facture trouvée</h4>
              <p>Aucune facture ne correspond à ces critères.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const displayList = filtered.slice(0, 60);

    tbody.innerHTML = displayList.map(f => {
      const isHigh = f.nb_echantillons > 5;
      return `
        <tr>
          <td><span class="code-badge">${f.code_fact}</span></td>
          <td><strong>${f.num_fact || '—'}</strong></td>
          <td>${window.LOARC_UTILS?.formatDateFR(f.date_fact) || '—'}</td>
          <td class="numeric tabular" style="font-weight: 700; color: var(--text-main);">
            ${window.LOARC_UTILS?.formatDH(f.montant_fact)}
          </td>
          <td>
            <span class="pill-count ${isHigh ? 'high' : ''}">
              ${f.nb_echantillons || 0} échantillon${(f.nb_echantillons || 0) > 1 ? 's' : ''}
            </span>
          </td>
          <td style="text-align: right;">
            <button class="btn-secondary view-fact-action" data-code="${f.code_fact}" style="padding: 4px 10px; font-size: 12px;">
              <i class="fa-solid fa-list-check"></i> Échantillons
            </button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.view-fact-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-code');
        if (code && window.LOARC_APP) {
          window.LOARC_APP.openInvoiceModal(code);
        }
      });
    });
  }

  /**
   * Render Section 11: Analyse des Produits
   */
  renderProduitsSection(samples, stats) {
    const container = document.getElementById('produits-cards-container');
    const tableBody = document.getElementById('table-produits-body');
    const totalProdEl = document.getElementById('produits-total-catalog');
    if (!container || !tableBody) return;

    // Aggregate by product
    const prodMap = new Map();
    (samples || []).forEach(s => {
      const existing = prodMap.get(s.num_produit) || { count: 0, invoices: new Set() };
      existing.count += 1;
      if (s.code_facture) existing.invoices.add(s.code_facture);
      prodMap.set(s.num_produit, existing);
    });

    const totalSamples = samples.length;
    const sorted = Array.from(prodMap.entries())
      .map(([num_produit, data]) => ({
        num_produit,
        count: data.count,
        invoicesCount: data.invoices.size,
        percentage: totalSamples > 0 ? parseFloat(((data.count / totalSamples) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    if (totalProdEl) totalProdEl.textContent = sorted.length;

    // Top 3 Podium Cards
    const top3 = sorted.slice(0, 3);
    container.innerHTML = top3.map((p, idx) => `
      <div class="product-rank-card">
        <div class="rank-card-header">
          <span class="rank-badge">Rang #${idx + 1}</span>
          <span style="font-size: 12px; font-weight: 600; color: var(--text-muted);">${p.percentage}% du volume</span>
        </div>
        <div class="rank-card-title">${p.num_produit}</div>
        <div style="font-size: 22px; font-weight: 700; color: var(--primary-dark); margin: 6px 0;" class="tabular">
          ${p.count} <span style="font-size: 13px; font-weight: 500; color: var(--text-muted);">échantillons</span>
        </div>
        <div style="font-size: 12px; color: var(--text-muted);">
          Présent dans ${p.invoicesCount} facture${p.invoicesCount > 1 ? 's' : ''}
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${p.percentage}%;"></div>
        </div>
      </div>
    `).join('');

    // Product Table
    this.allProductsList = sorted;
    this.filterAndRenderProduitsTable('');
  }

  filterAndRenderProduitsTable(searchTerm = '') {
    const tableBody = document.getElementById('table-produits-body');
    const countBadge = document.getElementById('table-produits-count');
    if (!tableBody) return;

    const term = (searchTerm || '').trim().toLowerCase();
    const filtered = (this.allProductsList || []).filter(p => {
      if (!term) return true;
      return p.num_produit.toLowerCase().includes(term);
    });

    if (countBadge) countBadge.textContent = `${filtered.length} produit${filtered.length > 1 ? 's' : ''}`;

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <i class="fa-solid fa-boxes-stacked"></i>
              <h4>Aucun produit trouvé</h4>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = filtered.map((p, idx) => `
      <tr>
        <td style="font-weight: 700; color: var(--text-muted);">#${idx + 1}</td>
        <td><span class="code-badge">${p.num_produit}</span></td>
        <td class="tabular" style="font-weight: 700;">${p.count}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="progress-bar-bg" style="flex: 1; max-width: 140px; margin-top: 0;">
              <div class="progress-bar-fill" style="width: ${p.percentage}%;"></div>
            </div>
            <span class="tabular" style="font-size: 12px; font-weight: 600;">${p.percentage}%</span>
          </div>
        </td>
        <td class="tabular">${p.invoicesCount} factures</td>
      </tr>
    `).join('');
  }
}

window.LOARC_STATS = new StatisticsRenderer();
