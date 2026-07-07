import './styles.css';
import {
  initDigitalRevealObserver,
  setDigitalRevealText,
  setDigitalRevealVisible
} from './digitalReveal.js';
import {
  initSiteLoader,
  buildFramePreloadList
} from './siteLoader.js';
import { initSiteHeader } from './siteHeader.js';

const FRAME_COUNT = 950;
const FRAME_PATH = '/frames/frame_';
const FRAME_EXT = '.jpg';
const INITIAL_FRAME = 1;
const MAX_DEVICE_PIXEL_RATIO = 2;
const MOBILE_MENU_BREAKPOINT = 860;
const HERO_COPY_RANGE = {
  start: 1,
  end: 100,
  fadeOutStart: 72,
  fadeOutEnd: 100
};

const PRODUCT_ROTATE_COUNT = 215;
const PRODUCT_ROTATE_PATH = '/product-rotate/rotate_';
const PRODUCT_ROTATE_EXT = '.jpg';
const PRODUCT_ROTATE_DRAG_SPEED = 4;
const PRODUCT_ROTATE_MOUSE_SPEED = 30;
const PRODUCT_ROTATE_DESKTOP_QUERY = '(hover: hover) and (pointer: fine) and (min-width: 861px)';

const productRotateEl = document.querySelector('#productRotate');
const productRotateCanvas = document.querySelector('#productRotateCanvas');
const productRotateContext = productRotateCanvas?.getContext('2d', { alpha: false });

const ADVANTAGES_ITEMS = [
  {
    start: 101,
    end: 240,
    title: 'Endurance',
    text: '20+ hours of flight time for persistent surveillance and extended mission coverage.'
  },
  {
    start: 300,
    end: 500,
    title: 'Reliability',
    text: 'Designed with advanced safety systems, including a full aircraft ballistic parachute.'
  },
  {
    start: 520,
    end: 640,
    title: 'Performance',
    text: 'Operates up to 25,000 feet with a mission range of more than 1,000 NM.'
  },
  {
    start: 700,
    end: 800,
    title: 'Versatility',
    text: 'Compatible with EO/IR, SAR, SIGINT, COMINT and other mission payloads through modular integration points.'
  },
  {
    start: 820,
    end: 950,
    title: 'Deployment',
    text: 'Designed for field readiness, short runway operations and high-altitude environments.'
  }
];

// Ajoute ici tes futures zones d'UI par plages de frames.
// Exemple : une UI visible entre les frames 10 et 50, puis une autre entre 51 et 100.
const FRAME_RANGES = [
  { id: 'range-10-50', label: 'UI 01 · frames 10–50', start: 10, end: 50 },
  { id: 'range-51-100', label: 'UI 02 · frames 51–100', start: 51, end: 100 },
  { id: 'range-101-150', label: 'UI 03 · frames 101–150', start: 101, end: 150 },
  { id: 'range-151-200', label: 'UI 04 · frames 151–200', start: 151, end: 200 }
];

const sequence = document.querySelector('#sequence');
const canvas = document.querySelector('#sequenceCanvas');
const loader = document.querySelector('#loader');
const context = canvas.getContext('2d', { alpha: false });

const currentFrameEl = document.querySelector('#currentFrame');
const totalFramesEl = document.querySelector('#totalFrames');
const progressValueEl = document.querySelector('#progressValue');
const progressBarEl = document.querySelector('#progressBar');
const activeRangeEl = document.querySelector('#activeRange');
const rangeListEl = document.querySelector('#rangeList');
const heroCopyEl = document.querySelector('#heroCopy');
const advantagesUiEl = document.querySelector('#advantagesUi');
const advantagesCounterEl = document.querySelector('#advantagesCounter');
const advantagesTitleEl = document.querySelector('#advantagesTitle');
const advantagesTextEl = document.querySelector('#advantagesText');
const heroTitleRevealEl = document.querySelector('#heroCopy [data-digital-reveal]');
const advantagesHeadingRevealEl = document.querySelector('#advantagesUi h2[data-digital-reveal]');
const advantagesTitleRevealEl = document.querySelector('#advantagesTitle[data-digital-reveal]');
const menuToggle = document.querySelector('#menuToggle');
const mobileMenu = document.querySelector('#mobileMenu');
const productNav = document.querySelector('.nav-product');
const productButton = productNav?.querySelector('.nav-link--button');

const frames = new Map();
let currentFrame = INITIAL_FRAME;
let currentImage = null;
let isTicking = false;
let hasFirstPaint = false;

const productRotateFrames = new Map();

let productRotateFrame = 1;
let productRotateFrameFloat = 1;
let productRotateImage = null;
let requestedProductRotateFrame = 1;
let productRotateDragging = false;
let productRotateLastX = 0;
let productRotatePreloaded = false;
let productRotateMouseX = 0;
let productRotateLastMouseX = 0;
let productRotateMouseRaf = null;
let productRotateMouseEnabled = false;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const padFrame = (frame) => String(frame).padStart(4, '0');
const frameUrl = (frame) => `${FRAME_PATH}${padFrame(frame)}${FRAME_EXT}`;
const productRotateUrl = (frame) => {
  return `${PRODUCT_ROTATE_PATH}${padFrame(frame)}${PRODUCT_ROTATE_EXT}`;
};

function wrapFrame(frame, count) {
  return ((((Math.round(frame) - 1) % count) + count) % count) + 1;
}

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

function bindHeaderUi() {
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

function loadFrame(frame) {
  const safeFrame = clamp(frame, 1, FRAME_COUNT);

  if (frames.has(safeFrame)) {
    return frames.get(safeFrame);
  }

  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = frameUrl(safeFrame);
  });

  frames.set(safeFrame, promise);
  return promise;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    if (currentImage) drawImage(currentImage);
  }
}

function drawImage(img) {
  currentImage = img;

  const canvasRatio = canvas.width / canvas.height;
  const imageRatio = img.naturalWidth / img.naturalHeight;

  let sourceWidth = img.naturalWidth;
  let sourceHeight = img.naturalHeight;
  let sourceX = 0;
  let sourceY = 0;

  // Mode cover : le canvas est rempli à 100%, quitte à cropper légèrement.
  if (imageRatio > canvasRatio) {
    sourceWidth = img.naturalHeight * canvasRatio;
    sourceX = (img.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = img.naturalWidth / canvasRatio;
    sourceY = (img.naturalHeight - sourceHeight) / 2;
  }

  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.drawImage(
    img,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );
}

function getScrollProgress() {
  const rect = sequence.getBoundingClientRect();
  const scrollableDistance = rect.height - window.innerHeight;

  if (scrollableDistance <= 0) return 0;
  return clamp(-rect.top / scrollableDistance, 0, 1);
}

function frameFromProgress(progress) {
  return clamp(Math.round(progress * (FRAME_COUNT - 1)) + 1, 1, FRAME_COUNT);
}

function getActiveRange(frame) {
  return FRAME_RANGES.find((range) => frame >= range.start && frame <= range.end) || null;
}

function renderRangeList() {
  if (!rangeListEl) return;

  rangeListEl.replaceChildren();

  FRAME_RANGES.forEach((range) => {
    const item = document.createElement('li');
    const label = document.createElement('span');
    const framesLabel = document.createElement('small');

    item.dataset.rangeId = range.id;
    label.textContent = range.label;
    framesLabel.textContent = `${range.start}–${range.end}`;

    item.append(label, framesLabel);
    rangeListEl.append(item);
  });
}

function updateHeroCopy(frame) {
  if (!heroCopyEl) return;

  const isInRange = frame >= HERO_COPY_RANGE.start && frame <= HERO_COPY_RANGE.end;

  if (!isInRange) {
    heroCopyEl.style.setProperty('--hero-copy-opacity', '0');
    heroCopyEl.style.setProperty('--hero-copy-y', '-18px');
    heroCopyEl.setAttribute('aria-hidden', 'true');
    setDigitalRevealVisible(heroTitleRevealEl, false);
    return;
  }

  const fadeProgress = clamp(
    (frame - HERO_COPY_RANGE.fadeOutStart) / (HERO_COPY_RANGE.fadeOutEnd - HERO_COPY_RANGE.fadeOutStart),
    0,
    1
  );

  const opacity = 1 - fadeProgress;
  const translateY = -18 * fadeProgress;

  heroCopyEl.style.setProperty('--hero-copy-opacity', String(opacity));
  heroCopyEl.style.setProperty('--hero-copy-y', `${translateY}px`);
  heroCopyEl.setAttribute('aria-hidden', opacity <= 0.02 ? 'true' : 'false');
  setDigitalRevealVisible(heroTitleRevealEl, opacity > 0.08);
}

function updateAdvantagesUi(frame) {
  if (!advantagesUiEl) return;

  const activeIndex = ADVANTAGES_ITEMS.findIndex((item) => {
    return frame >= item.start && frame <= item.end;
  });

  if (activeIndex === -1) {
    advantagesUiEl.style.setProperty('--advantages-opacity', '0');
    advantagesUiEl.style.setProperty('--advantages-y', '12px');
    advantagesUiEl.setAttribute('aria-hidden', 'true');
    setDigitalRevealVisible(advantagesHeadingRevealEl, false);
    setDigitalRevealVisible(advantagesTitleRevealEl, false);
    return;
  }

  const activeItem = ADVANTAGES_ITEMS[activeIndex];
  const localProgress = clamp(
    (frame - activeItem.start) / (activeItem.end - activeItem.start),
    0,
    1
  );

  const fadeIn = clamp(localProgress / 0.14, 0, 1);
  const fadeOut = clamp((1 - localProgress) / 0.14, 0, 1);
  const opacity = Math.min(fadeIn, fadeOut);

  advantagesCounterEl.textContent = `${String(activeIndex + 1).padStart(2, '0')}/${String(ADVANTAGES_ITEMS.length).padStart(2, '0')}`;
  setDigitalRevealText(advantagesTitleRevealEl, activeItem.title);
  advantagesTextEl.textContent = activeItem.text;

  advantagesUiEl.style.setProperty('--advantages-opacity', String(opacity));
  advantagesUiEl.style.setProperty('--advantages-y', `${12 * (1 - opacity)}px`);
  advantagesUiEl.setAttribute('aria-hidden', opacity <= 0.02 ? 'true' : 'false');
  setDigitalRevealVisible(advantagesHeadingRevealEl, opacity > 0.08);
  setDigitalRevealVisible(advantagesTitleRevealEl, opacity > 0.08);
}

function updateDebugUi(frame, progress) {
  const activeRange = getActiveRange(frame);

  currentFrameEl.textContent = frame;
  totalFramesEl.textContent = FRAME_COUNT;
  progressValueEl.textContent = `${Math.round(progress * 100)}%`;
  progressBarEl.style.transform = `scaleX(${progress})`;
  activeRangeEl.textContent = activeRange ? activeRange.label : 'hors range';

  document.documentElement.dataset.currentFrame = String(frame);
  document.documentElement.dataset.activeRange = activeRange ? activeRange.id : 'none';

  rangeListEl?.querySelectorAll('li').forEach((item) => {
    item.dataset.active = item.dataset.rangeId === activeRange?.id ? 'true' : 'false';
  });
}

async function renderFrame(frame) {
  currentFrame = frame;
  const img = await loadFrame(frame);

  if (frame === currentFrame) {
    drawImage(img);
  }
}

function preloadAround(frame) {
  const radius = 14;
  for (let offset = -radius; offset <= radius; offset += 1) {
    const target = frame + offset;
    if (target >= 1 && target <= FRAME_COUNT) {
      loadFrame(target).catch(() => {});
    }
  }
}

function update() {
  isTicking = false;
  resizeCanvas();

  const progress = getScrollProgress();
  const nextFrame = frameFromProgress(progress);

  updateDebugUi(nextFrame, progress);
  updateHeroCopy(nextFrame);
  updateAdvantagesUi(nextFrame);

  if (nextFrame !== currentFrame || !hasFirstPaint) {
    hasFirstPaint = true;
    renderFrame(nextFrame).catch(() => {});
    preloadAround(nextFrame);
  }
}

function requestUpdate() {
  if (!isTicking) {
    isTicking = true;
    window.requestAnimationFrame(update);
  }
}

function loadProductRotateFrame(frame) {
  const safeFrame = wrapFrame(frame, PRODUCT_ROTATE_COUNT);

  if (productRotateFrames.has(safeFrame)) {
    return productRotateFrames.get(safeFrame);
  }

  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = productRotateUrl(safeFrame);
  });

  productRotateFrames.set(safeFrame, promise);
  return promise;
}

function resizeProductRotateCanvas() {
  if (!productRotateCanvas || !productRotateContext) return;

  const rect = productRotateCanvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));

  if (productRotateCanvas.width !== width || productRotateCanvas.height !== height) {
    productRotateCanvas.width = width;
    productRotateCanvas.height = height;

    if (productRotateImage) {
      drawProductRotateFrame(productRotateImage);
    }
  }
}

function drawProductRotateFrame(img) {
  if (!productRotateCanvas || !productRotateContext) return;

  productRotateImage = img;

  const canvasRatio = productRotateCanvas.width / productRotateCanvas.height;
  const imageRatio = img.naturalWidth / img.naturalHeight;

  let drawWidth = productRotateCanvas.width;
  let drawHeight = productRotateCanvas.height;
  let offsetX = 0;
  let offsetY = 0;

  if (imageRatio > canvasRatio) {
    drawHeight = productRotateCanvas.width / imageRatio;
    offsetY = (productRotateCanvas.height - drawHeight) / 2;
  } else {
    drawWidth = productRotateCanvas.height * imageRatio;
    offsetX = (productRotateCanvas.width - drawWidth) / 2;
  }

  productRotateContext.fillStyle = '#000';
  productRotateContext.fillRect(0, 0, productRotateCanvas.width, productRotateCanvas.height);
  productRotateContext.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

async function renderProductRotateFrame(frame) {
  const safeFrame = wrapFrame(frame, PRODUCT_ROTATE_COUNT);

  productRotateFrame = safeFrame;
  requestedProductRotateFrame = safeFrame;

  const img = await loadProductRotateFrame(safeFrame);

  if (requestedProductRotateFrame === safeFrame) {
    drawProductRotateFrame(img);
  }
}

function preloadProductRotateAround(frame) {
  const radius = 16;

  for (let offset = -radius; offset <= radius; offset += 1) {
    loadProductRotateFrame(frame + offset).catch(() => {});
  }
}

function preloadAllProductRotateFrames() {
  if (productRotatePreloaded) return;

  productRotatePreloaded = true;

  let index = 1;

  function loadBatch() {
    const batchEnd = Math.min(index + 12, PRODUCT_ROTATE_COUNT + 1);

    for (; index < batchEnd; index += 1) {
      loadProductRotateFrame(index).catch(() => {});
    }

    if (index <= PRODUCT_ROTATE_COUNT) {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(loadBatch, { timeout: 500 });
      } else {
        window.setTimeout(loadBatch, 32);
      }
    }
  }

  loadBatch();
}

function rotateProductByDelta(deltaX) {
  productRotateFrameFloat -= deltaX / PRODUCT_ROTATE_DRAG_SPEED;

  const nextFrame = wrapFrame(productRotateFrameFloat, PRODUCT_ROTATE_COUNT);

  if (nextFrame !== productRotateFrame) {
    renderProductRotateFrame(nextFrame).catch(() => {});
    preloadProductRotateAround(nextFrame);
  }
}

function initProductRotate() {
  if (!productRotateEl || !productRotateCanvas || !productRotateContext) return;

  resizeProductRotateCanvas();
  renderProductRotateFrame(1).catch(() => {});
  preloadProductRotateAround(1);

  const desktopMouseQuery = window.matchMedia(PRODUCT_ROTATE_DESKTOP_QUERY);

function updateMouseFollowState() {
  productRotateMouseEnabled = desktopMouseQuery.matches;
}

updateMouseFollowState();

desktopMouseQuery.addEventListener?.('change', updateMouseFollowState);

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        preloadAllProductRotateFrames();
        observer.disconnect();
      }
    },
    {
      rootMargin: '360px'
    }
  );

  observer.observe(productRotateEl);
  function tickMouseFollow() {
    productRotateMouseRaf = null;
  
    if (!productRotateMouseEnabled || productRotateDragging) return;
  
    const deltaX = productRotateMouseX - productRotateLastMouseX;
  
    productRotateLastMouseX += deltaX * 0.14;
  
    if (Math.abs(deltaX) > 0.35) {
      rotateProductByDelta(deltaX / PRODUCT_ROTATE_MOUSE_SPEED);
    }
  
    productRotateMouseRaf = window.requestAnimationFrame(tickMouseFollow);
  }
  
  window.addEventListener('mousemove', (event) => {
    if (!productRotateMouseEnabled || productRotateDragging) return;
  
    productRotateMouseX = event.clientX;
  
    if (!productRotateLastMouseX) {
      productRotateLastMouseX = event.clientX;
    }
  
    if (!productRotateMouseRaf) {
      productRotateMouseRaf = window.requestAnimationFrame(tickMouseFollow);
    }
  }, { passive: true });

  productRotateEl.addEventListener('pointerdown', (event) => {
    if (event.button !== undefined && event.button !== 0) return;

    productRotateDragging = true;
    productRotateLastX = event.clientX;
    productRotateEl.dataset.dragging = 'true';
    productRotateEl.setPointerCapture(event.pointerId);
    preloadAllProductRotateFrames();
  });

  productRotateEl.addEventListener('pointermove', (event) => {
    if (!productRotateDragging) return;

    const deltaX = event.clientX - productRotateLastX;
    productRotateLastX = event.clientX;

    rotateProductByDelta(deltaX);
  });

  function stopDragging(event) {
    productRotateDragging = false;
    productRotateEl.dataset.dragging = 'false';

    if (productRotateEl.hasPointerCapture(event.pointerId)) {
      productRotateEl.releasePointerCapture(event.pointerId);
    }
  }

  productRotateEl.addEventListener('pointerup', stopDragging);
  productRotateEl.addEventListener('pointercancel', stopDragging);

  productRotateEl.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      rotateProductByDelta(24);
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      rotateProductByDelta(-24);
    }
  });
}

async function init() {
  initSiteLoader({
    minDuration: 2600,
    preloadUrls: buildFramePreloadList({
      path: FRAME_PATH,
      ext: FRAME_EXT,
      count: FRAME_COUNT,
      limit: 180
    })
  });
  initSiteHeader();
  initDigitalRevealObserver();
  initProductRotate();
  resizeCanvas();
  renderRangeList();
  updateDebugUi(INITIAL_FRAME, 0);

  try {
    const firstFrame = await loadFrame(INITIAL_FRAME);
    drawImage(firstFrame);
    loader.classList.add('is-hidden');
    update();
    preloadAround(INITIAL_FRAME);
  } catch (error) {
    loader.textContent = 'Impossible de charger la séquence.';
    console.error(error);
  }
}

window.addEventListener('scroll', requestUpdate, { passive: true });
window.addEventListener('resize', requestUpdate);
window.addEventListener('resize', resizeProductRotateCanvas);
window.addEventListener('orientationchange', requestUpdate);

init();
