import './siteHeader.css';

const MOBILE_MENU_BREAKPOINT = 860;

export function initSiteHeader() {
  if (document.querySelector('.site-header')) return;

  const mount = document.querySelector('#siteHeader') || document.body;

  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="site-header__inner">
      <nav class="header-nav header-nav--desktop" aria-label="Navigation principale">
        <div class="nav-product" data-open="false">
          <button
            class="nav-link nav-link--button"
            type="button"
            aria-expanded="false"
            aria-haspopup="true"
          >
            Products
            <svg class="nav-link__chevron" width="8" height="5" viewBox="0 0 8 5" aria-hidden="true">
              <path d="M1 1L4 4L7 1" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <div class="product-menu">
            <a href="/index.html">G750 – RPAS</a>
            <a href="/home.html">Platforms</a>
            <a href="/training.html">Training</a>
          </div>
        </div>

        <a class="nav-link" href="/company.html">Company</a>
      </nav>

      <button
        class="hamburger"
        id="menuToggle"
        type="button"
        aria-label="Ouvrir le menu"
        aria-expanded="false"
        aria-controls="mobileMenu"
      >
        <span></span>
        <span></span>
      </button>

      <a class="logo-link" href="/home.html" aria-label="Gryphen home">
        <img class="site-logo" src="/logo.png" alt="Gryphen" />
      </a>

      <a class="contact-link" href="/contact.html">
        <span>[</span>
        <em>Contact us</em>
        <span>]</span>
      </a>
    </div>

    <nav class="mobile-menu" id="mobileMenu" hidden aria-label="Menu mobile">
      <a href="/index.html">Products</a>
      <a href="/company.html">Company</a>
      <a href="/contact.html">Contact us</a>
    </nav>
  `;

  if (mount.id === 'siteHeader') {
    mount.replaceChildren(header);
  } else {
    document.body.prepend(header);
  }

  bindHeaderUi(header);
}

function bindHeaderUi(header) {
  const menuToggle = header.querySelector('#menuToggle');
  const mobileMenu = header.querySelector('#mobileMenu');
  const productNav = header.querySelector('.nav-product');
  const productButton = productNav?.querySelector('.nav-link--button');

  function setMenuOpen(isOpen) {
    if (!menuToggle || !mobileMenu) return;

    document.documentElement.dataset.menuOpen = String(isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
    mobileMenu.hidden = !isOpen;
  }

  function setProductMenuOpen(isOpen) {
    if (!productNav || !productButton) return;

    productNav.dataset.open = String(isOpen);
    productButton.setAttribute('aria-expanded', String(isOpen));
  }

  menuToggle?.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    setMenuOpen(!isOpen);
  });

  mobileMenu?.addEventListener('click', (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      setMenuOpen(false);
    }
  });

  productButton?.addEventListener('click', () => {
    const isOpen = productButton.getAttribute('aria-expanded') === 'true';
    setProductMenuOpen(!isOpen);
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Node)) return;

    if (mobileMenu && menuToggle && !mobileMenu.contains(target) && !menuToggle.contains(target)) {
      setMenuOpen(false);
    }

    if (productNav && !productNav.contains(target)) {
      setProductMenuOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setMenuOpen(false);
      setProductMenuOpen(false);
      menuToggle?.blur();
      productButton?.blur();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > MOBILE_MENU_BREAKPOINT) {
      setMenuOpen(false);
    }
  });
}