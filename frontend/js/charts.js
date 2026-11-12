/**
 * LOARC LABORATORY - CHARTS MODULE (Section 8)
 * Manages 6 interactive Chart.js visualizations
 */

class ChartManager {
  constructor() {
    this.charts = {
      evolutionEchantillons: null,
      evolutionCA: null,
      echantillonsParProduit: null,
      repartitionFactures: null,
      facturesParPeriode: null,
      comparaisonEchFact: null,
    };

    this.colors = {
      primary: '#2563EB',
      primaryDark: '#1E3A8A',
      primaryLight: '#EFF6FF',
      success: '#16A34A',
      warning: '#D97706',
      cyan: '#0284C7',
      slate: '#64748B',
      border: '#E2E8F0',
    };
  }

  formatLabelDate(dStr) {
    if (!dStr) return '';
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}`;
      }
      return dStr;
    } catch (e) {
      return dStr;
    }
  }

  /**
   * Update all charts with fresh API data
   */
  updateAll(statsData) {
    if (!statsData) return;

    this.renderEvolutionEchantillons(statsData.evolution_echantillons);
    this.renderEvolutionCA(statsData.evolution_ca);
    this.renderEchantillonsParProduit(statsData.echantillons_par_produit);
    this.renderRepartitionFactures(statsData.repartition_factures);
    this.renderFacturesParPeriode(statsData.factures_par_periode);
    this.renderComparaisonEchFact(statsData.comparaison_ech_fact);
  }

  /**
   * Graphique 1 : Évolution des échantillons (Line Chart)
   */
  renderEvolutionEchantillons(data) {
    const ctx = document.getElementById('chart-evolution-echantillons');
    if (!ctx || !window.Chart) return;

    if (this.charts.evolutionEchantillons) {
      this.charts.evolutionEchantillons.destroy();
    }

    const labels = (data?.labels || []).map(d => this.formatLabelDate(d));
    const values = data?.values || [];

    this.charts.evolutionEchantillons = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.length ? labels : ['Aucune donnée'],
        datasets: [{
          label: 'Nombre d\'échantillons',
          data: values.length ? values : [0],
          borderColor: this.colors.primary,
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          borderWidth: 2.5,
          tension: 0.3,
          fill: true,
          pointBackgroundColor: this.colors.primary,
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1E293B',
            padding: 10,
            titleFont: { size: 12, weight: 'bold' },
            bodyFont: { size: 12 },
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y} échantillon${ctx.parsed.y > 1 ? 's' : ''}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(226, 232, 240, 0.6)' },
            ticks: { font: { size: 11 }, color: this.colors.slate }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(226, 232, 240, 0.6)' },
            ticks: { precision: 0, font: { size: 11 }, color: this.colors.slate }
          }
        }
      }
    });
  }

  /**
   * Graphique 2 : Évolution du chiffre d'affaires (Area / Line Chart)
   */
  renderEvolutionCA(data) {
    const ctx = document.getElementById('chart-evolution-ca');
    if (!ctx || !window.Chart) return;

    if (this.charts.evolutionCA) {
      this.charts.evolutionCA.destroy();
    }

    const labels = (data?.labels || []).map(d => this.formatLabelDate(d));
    const values = data?.values || [];

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(22, 163, 74, 0.25)');
    gradient.addColorStop(1, 'rgba(22, 163, 74, 0.01)');

    this.charts.evolutionCA = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.length ? labels : ['Aucune donnée'],
        datasets: [{
          label: 'Chiffre d\'affaires (DH)',
          data: values.length ? values : [0],
          borderColor: this.colors.success,
          backgroundColor: gradient,
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
          pointBackgroundColor: this.colors.success,
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1E293B',
            padding: 10,
            callbacks: {
              label: (ctx) => ` Montant: ${window.LOARC_UTILS?.formatDH(ctx.parsed.y) || ctx.parsed.y + ' DH'}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(226, 232, 240, 0.6)' },
            ticks: { font: { size: 11 }, color: this.colors.slate }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(226, 232, 240, 0.6)' },
            ticks: {
              font: { size: 11 },
              color: this.colors.slate,
              callback: (v) => `${v} DH`
            }
          }
        }
      }
    });
  }

  /**
   * Graphique 3 : Échantillons par produit (Bar Chart)
   */
  renderEchantillonsParProduit(data) {
    const ctx = document.getElementById('chart-echantillons-par-produit');
    if (!ctx || !window.Chart) return;

    if (this.charts.echantillonsParProduit) {
      this.charts.echantillonsParProduit.destroy();
    }

    const labels = data?.labels || [];
    const values = data?.values || [];

    this.charts.echantillonsParProduit = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['Aucun'],
        datasets: [{
          label: 'Total Échantillons',
          data: values.length ? values : [0],
          backgroundColor: '#2563EB',
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 32,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1E293B',
            padding: 10,
            callbacks: {
              title: (items) => `Produit ${items[0]?.label}`,
              label: (ctx) => ` ${ctx.parsed.y} échantillon${ctx.parsed.y > 1 ? 's' : ''}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11, weight: 'bold' }, color: this.colors.slate }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(226, 232, 240, 0.6)' },
            ticks: { precision: 0, font: { size: 11 }, color: this.colors.slate }
          }
        }
      }
    });
  }

  /**
   * Graphique 4 : Répartition des factures (Doughnut Chart)
   * Catégories: 1 échantillon, 2 à 5, 6 à 10, plus de 10
   */
  renderRepartitionFactures(data) {
    const ctx = document.getElementById('chart-repartition-factures');
    if (!ctx || !window.Chart) return;

    if (this.charts.repartitionFactures) {
      this.charts.repartitionFactures.destroy();
    }

    const categories = data?.categories || [
      '1 échantillon',
      '2 à 5 échantillons',
      '6 à 10 échantillons',
      'Plus de 10 échantillons',
    ];
    const values = data?.values || [0, 0, 0, 0];

    const chartColors = [
      '#2563EB', // Blue
      '#16A34A', // Green
      '#D97706', // Amber
      '#7C3AED', // Purple
    ];

    this.charts.repartitionFactures = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: values,
          backgroundColor: chartColors,
          borderWidth: 2,
          borderColor: '#FFFFFF',
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 11.5 },
              color: '#334155',
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 14,
            }
          },
          tooltip: {
            backgroundColor: '#1E293B',
            padding: 10,
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const count = ctx.parsed;
                const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                return ` ${count} facture${count > 1 ? 's' : ''} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Graphique 5 : Factures par période (Bar Chart)
   */
  renderFacturesParPeriode(data) {
    const ctx = document.getElementById('chart-factures-par-periode');
    if (!ctx || !window.Chart) return;

    if (this.charts.facturesParPeriode) {
      this.charts.facturesParPeriode.destroy();
    }

    const labels = (data?.labels || []).map(d => this.formatLabelDate(d));
    const values = data?.values || [];

    this.charts.facturesParPeriode = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['Aucun'],
        datasets: [{
          label: 'Nombre de factures',
          data: values.length ? values : [0],
          backgroundColor: '#0284C7',
          borderRadius: 4,
          maxBarThickness: 28,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1E293B',
            padding: 10,
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y} facture${ctx.parsed.y > 1 ? 's' : ''}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, color: this.colors.slate }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(226, 232, 240, 0.6)' },
            ticks: { precision: 0, font: { size: 11 }, color: this.colors.slate }
          }
        }
      }
    });
  }

  /**
   * Graphique 6 : Comparaison Échantillons / Factures (Mixed Chart)
   */
  renderComparaisonEchFact(data) {
    const ctx = document.getElementById('chart-comparaison-ech-fact');
    if (!ctx || !window.Chart) return;

    if (this.charts.comparaisonEchFact) {
      this.charts.comparaisonEchFact.destroy();
    }

    const labels = (data?.labels || []).map(d => this.formatLabelDate(d));
    const echantillons = data?.echantillons || [];
    const factures = data?.factures || [];

    this.charts.comparaisonEchFact = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['Aucun'],
        datasets: [
          {
            type: 'bar',
            label: 'Échantillons analysés',
            data: echantillons.length ? echantillons : [0],
            backgroundColor: 'rgba(37, 99, 235, 0.75)',
            borderRadius: 4,
            maxBarThickness: 24,
            yAxisID: 'yEch',
            order: 2,
          },
          {
            type: 'line',
            label: 'Factures émises',
            data: factures.length ? factures : [0],
            borderColor: '#D97706',
            backgroundColor: '#D97706',
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3,
            yAxisID: 'yFact',
            order: 1,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              font: { size: 12 },
              usePointStyle: true,
              boxWidth: 8,
            }
          },
          tooltip: {
            backgroundColor: '#1E293B',
            padding: 10,
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, color: this.colors.slate }
          },
          yEch: {
            type: 'linear',
            position: 'left',
            beginAtZero: true,
            title: {
              display: true,
              text: 'Échantillons',
              color: this.colors.primary,
              font: { size: 11, weight: 'bold' }
            },
            ticks: { precision: 0, font: { size: 11 } },
            grid: { color: 'rgba(226, 232, 240, 0.6)' }
          },
          yFact: {
            type: 'linear',
            position: 'right',
            beginAtZero: true,
            title: {
              display: true,
              text: 'Factures',
              color: '#D97706',
              font: { size: 11, weight: 'bold' }
            },
            ticks: { precision: 0, font: { size: 11 } },
            grid: { display: false }
          }
        }
      }
    });
  }
}

window.LOARC_CHARTS = new ChartManager();
