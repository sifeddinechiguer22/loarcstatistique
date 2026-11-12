/**
 * LOARC LABORATORY - UTILITY FUNCTIONS
 * Formatting, dates in French, DH currency, toasts, helper math
 */

const MOIS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const JOURS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

/**
 * Format Moroccan Dirham currency (ex: "12 450,00 DH")
 */
function formatDH(val) {
  const num = Number(val) || 0;
  const formatted = num.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} DH`;
}

/**
 * Format number with space separator (ex: "1 250")
 */
function formatNumber(val) {
  const num = Number(val) || 0;
  return num.toLocaleString('fr-FR');
}

/**
 * Format date string to French (ex: "2024-03-15" -> "15 Mars 2024")
 */
function formatDateFR(dateStr) {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return `${day} ${MOIS_FR[monthIdx]} ${year}`;
    }
    const d = new Date(dateStr);
    return `${d.getDate()} ${MOIS_FR[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
}

/**
 * Short date formatting (ex: "15/03/2024")
 */
function formatShortDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

/**
 * Get ISO Week number and year from date
 */
function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return [d.getUTCFullYear(), weekNo];
}

/**
 * Get Date range for a given ISO week and year
 */
function getDateRangeOfWeek(weekNo, year) {
  const simple = new Date(year, 0, 1 + (weekNo - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  const ISOweekEnd = new Date(ISOweekStart);
  ISOweekEnd.setDate(ISOweekStart.getDate() + 6);

  const startFormatted = `${ISOweekStart.getFullYear()}-${String(ISOweekStart.getMonth() + 1).padStart(2, '0')}-${String(ISOweekStart.getDate()).padStart(2, '0')}`;
  const endFormatted = `${ISOweekEnd.getFullYear()}-${String(ISOweekEnd.getMonth() + 1).padStart(2, '0')}-${String(ISOweekEnd.getDate()).padStart(2, '0')}`;

  return {
    start: startFormatted,
    end: endFormatted,
    label: `Du ${ISOweekStart.getDate()}/${ISOweekStart.getMonth() + 1} au ${ISOweekEnd.getDate()}/${ISOweekEnd.getMonth() + 1}/${ISOweekEnd.getFullYear()}`,
  };
}

/**
 * Show temporary toast message
 */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconClass = type === 'success' 
    ? 'fa-circle-check' 
    : type === 'error' 
    ? 'fa-circle-exclamation' 
    : 'fa-circle-info';

  toast.innerHTML = `
    <i class="fa-solid ${iconClass} toast-icon"></i>
    <div class="toast-message">${message}</div>
    <div class="toast-close"><i class="fa-solid fa-xmark"></i></div>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.remove();
  });

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Debounce helper
 */
function debounce(fn, delay = 250) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Table skeleton loader
 */
function setTableSkeleton(tableBodyId, columnCount = 5, rowCount = 6) {
  const tbody = document.getElementById(tableBodyId);
  if (!tbody) return;

  let html = '';
  for (let r = 0; r < rowCount; r++) {
    html += '<tr>';
    for (let c = 0; c < columnCount; c++) {
      html += `<td><div class="skeleton" style="height: 18px; width: ${60 + (c * 10)}%;"></div></td>`;
    }
    html += '</tr>';
  }
  tbody.innerHTML = html;
}

// Export to window for vanilla JS access
window.LOARC_UTILS = {
  formatDH,
  formatNumber,
  formatDateFR,
  formatShortDate,
  getISOWeekNumber,
  getDateRangeOfWeek,
  showToast,
  debounce,
  setTableSkeleton,
  MOIS_FR,
  JOURS_FR,
};
