/**
 * LOARC LABORATORY - NAVIGATION MODULE (Section 5)
 * Handles client-side view switching without full page reload.
 */

class NavigationManager {
  constructor() {
    this.currentView = 'dashboard';
    this.views = {
      dashboard: {
        id: 'view-dashboard',
        title: 'Tableau de Bord',
        breadcrumb: 'Vue Générale',
      },
      echantillons: {
        id: 'view-echantillons',
        title: 'Statistiques des Échantillons',
        breadcrumb: 'Échantillons',
      },
      factures: {
        id: 'view-factures',
        title: 'Statistiques des Factures',
        breadcrumb: 'Factures',
      },
      produits: {
        id: 'view-produits',
        title: 'Analyse des Produits',
        breadcrumb: 'Produits',
      },
    };
  }

  init() {
    this.bindSidebarLinks();
    this.bindMobileMenu();

    // Check hash in URL or default to dashboard
    const hash = window.location.hash.replace('#', '');
    if (hash && this.views[hash]) {
      this.switchView(hash);
    } else {
      this.switchView('dashboard');
    }
  }

  bindSidebarLinks() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = item.dataset.view;
        if (targetView && this.views[targetView]) {
          this.switchView(targetView);
          this.closeMobileSidebar();
        }
      });
    });
  }

  bindMobileMenu() {
    const mobileBtn = document.getElementById('btn-mobile-menu');
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');

    if (mobileBtn && sidebar) {
      mobileBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
        if (backdrop) backdrop.classList.toggle('active');
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', () => {
        this.closeMobileSidebar();
      });
    }
  }

  closeMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
  }

  switchView(viewName) {
    if (!this.views[viewName]) return;
    this.currentView = viewName;

    // Update URL hash without reload
    history.replaceState(null, '', `#${viewName}`);

    // Update sidebar active links
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Update views visibility
    Object.keys(this.views).forEach(key => {
      const viewEl = document.getElementById(this.views[key].id);
      if (viewEl) {
        viewEl.style.display = key === viewName ? 'block' : 'none';
      }
    });

    // Update breadcrumb
    const breadcrumbEl = document.getElementById('breadcrumb-page-title');
    if (breadcrumbEl) {
      breadcrumbEl.textContent = this.views[viewName].breadcrumb;
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

window.LOARC_NAV = new NavigationManager();
