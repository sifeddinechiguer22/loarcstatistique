/**
 * LOARC LABORATORY - TEMPORAL FILTERS MODULE (Section 7)
 * Modes: SEMAINE, MOIS, PÉRIODE PERSONNALISÉE, and RÉINITIALISER
 */

class FilterManager {
  constructor() {
    this.currentMode = 'all'; // 'all' | 'week' | 'month' | 'custom'
    this.state = {
      mode: 'all',
      year: '2024',
      week: '11',
      month: '3',
      startDate: '',
      endDate: '',
    };
    this.onChangeCallbacks = [];
  }

  init() {
    this.cacheElements();
    this.populateSelectors();
    this.bindEvents();
    this.updateControlsVisibility();
    this.updateSummaryText();
  }

  cacheElements() {
    this.modeButtons = document.querySelectorAll('.filter-mode-btn');
    this.controlsWeek = document.getElementById('filter-controls-week');
    this.controlsMonth = document.getElementById('filter-controls-month');
    this.controlsCustom = document.getElementById('filter-controls-custom');
    
    this.selectYearWeek = document.getElementById('filter-year-week');
    this.selectWeek = document.getElementById('filter-week-num');
    
    this.selectYearMonth = document.getElementById('filter-year-month');
    this.selectMonth = document.getElementById('filter-month-num');
    
    this.inputStartDate = document.getElementById('filter-start-date');
    this.inputEndDate = document.getElementById('filter-end-date');
    
    this.btnReset = document.getElementById('btn-reset-filters');
    this.summaryText = document.getElementById('filter-summary-text');
  }

  populateSelectors() {
    const years = [2024, 2025, 2026];

    // Populate years for week and month
    [this.selectYearWeek, this.selectYearMonth].forEach(select => {
      if (!select) return;
      select.innerHTML = years.map(y => `<option value="${y}" ${y === 2024 ? 'selected' : ''}>${y}</option>`).join('');
    });

    // Populate weeks 1..52
    if (this.selectWeek) {
      let options = '';
      for (let w = 1; w <= 52; w++) {
        options += `<option value="${w}" ${w === 11 ? 'selected' : ''}>Semaine ${w}</option>`;
      }
      this.selectWeek.innerHTML = options;
    }

    // Populate months
    if (this.selectMonth) {
      const months = window.LOARC_UTILS?.MOIS_FR || [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ];
      this.selectMonth.innerHTML = months.map((m, idx) => 
        `<option value="${idx + 1}" ${idx === 2 ? 'selected' : ''}>${m}</option>`
      ).join('');
    }

    // Set default custom dates (e.g. 2024-01-01 to 2024-12-31)
    if (this.inputStartDate) this.inputStartDate.value = '2024-01-01';
    if (this.inputEndDate) this.inputEndDate.value = '2024-06-30';
  }

  bindEvents() {
    // Mode switcher buttons
    this.modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        this.setMode(mode);
      });
    });

    // Change handlers on selects/inputs
    const triggerChange = () => {
      this.syncStateFromInputs();
      this.updateSummaryText();
      this.notifyChange();
    };

    if (this.selectYearWeek) this.selectYearWeek.addEventListener('change', triggerChange);
    if (this.selectWeek) this.selectWeek.addEventListener('change', triggerChange);
    
    if (this.selectYearMonth) this.selectYearMonth.addEventListener('change', triggerChange);
    if (this.selectMonth) this.selectMonth.addEventListener('change', triggerChange);
    
    if (this.inputStartDate) this.inputStartDate.addEventListener('change', triggerChange);
    if (this.inputEndDate) this.inputEndDate.addEventListener('change', triggerChange);

    // Reset button
    if (this.btnReset) {
      this.btnReset.addEventListener('click', () => {
        this.reset();
      });
    }
  }

  setMode(mode) {
    this.currentMode = mode;
    this.state.mode = mode;

    this.modeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    this.updateControlsVisibility();
    this.syncStateFromInputs();
    this.updateSummaryText();
    this.notifyChange();
  }

  updateControlsVisibility() {
    if (this.controlsWeek) this.controlsWeek.style.display = this.currentMode === 'week' ? 'flex' : 'none';
    if (this.controlsMonth) this.controlsMonth.style.display = this.currentMode === 'month' ? 'flex' : 'none';
    if (this.controlsCustom) this.controlsCustom.style.display = this.currentMode === 'custom' ? 'flex' : 'none';
  }

  syncStateFromInputs() {
    this.state.mode = this.currentMode;
    if (this.currentMode === 'week') {
      this.state.year = this.selectYearWeek?.value || '2024';
      this.state.week = this.selectWeek?.value || '11';
    } else if (this.currentMode === 'month') {
      this.state.year = this.selectYearMonth?.value || '2024';
      this.state.month = this.selectMonth?.value || '3';
    } else if (this.currentMode === 'custom') {
      this.state.startDate = this.inputStartDate?.value || '';
      this.state.endDate = this.inputEndDate?.value || '';
    } else {
      // All
      this.state.year = '';
      this.state.week = '';
      this.state.month = '';
      this.state.startDate = '';
      this.state.endDate = '';
    }
  }

  updateSummaryText() {
    if (!this.summaryText) return;

    if (this.currentMode === 'all') {
      this.summaryText.textContent = 'Toutes les données disponibles';
    } else if (this.currentMode === 'week') {
      const w = parseInt(this.state.week, 10);
      const y = parseInt(this.state.year, 10);
      const range = window.LOARC_UTILS?.getDateRangeOfWeek(w, y);
      this.summaryText.textContent = `Semaine ${w} (${y}) ${range ? `· ${range.label}` : ''}`;
    } else if (this.currentMode === 'month') {
      const mIdx = parseInt(this.state.month, 10) - 1;
      const mName = window.LOARC_UTILS?.MOIS_FR[mIdx] || `Mois ${this.state.month}`;
      this.summaryText.textContent = `${mName} ${this.state.year}`;
    } else if (this.currentMode === 'custom') {
      const start = window.LOARC_UTILS?.formatShortDate(this.state.startDate) || this.state.startDate;
      const end = window.LOARC_UTILS?.formatShortDate(this.state.endDate) || this.state.endDate;
      this.summaryText.textContent = `Du ${start} au ${end}`;
    }
  }

  reset() {
    this.setMode('all');
    if (window.LOARC_UTILS) {
      window.LOARC_UTILS.showToast('Filtres réinitialisés sur l\'ensemble des données', 'info');
    }
  }

  onFilterChange(fn) {
    if (typeof fn === 'function') {
      this.onChangeCallbacks.push(fn);
    }
  }

  notifyChange() {
    this.onChangeCallbacks.forEach(fn => fn(this.state));
  }

  getQueryParams() {
    this.syncStateFromInputs();
    const params = { mode: this.state.mode };

    if (this.state.mode === 'week') {
      params.year = this.state.year;
      params.week = this.state.week;
    } else if (this.state.mode === 'month') {
      params.year = this.state.year;
      params.month = this.state.month;
    } else if (this.state.mode === 'custom') {
      params.startDate = this.state.startDate;
      params.endDate = this.state.endDate;
    }
    return params;
  }
}

window.LOARC_FILTERS = new FilterManager();
