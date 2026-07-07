import './home.css';
import {
  setDigitalRevealText,
  setDigitalRevealVisible
} from './digitalReveal.js';

import { initSiteHeader } from './siteHeader.js';

import {
  initSiteLoader,
  buildFramePreloadList
} from './siteLoader.js';

const HOME_FRAME_COUNT = 646;
const HOME_FRAME_PATH = '/home-frames/home_';
const HOME_FRAME_EXT = '.jpg';
const HOME_INITIAL_FRAME = 1;
const HOME_MAX_DPR = 2;
const HOME_TEXT_START_FRAME = 1;
const HOME_TEXT_END_FRAME = 100;
const HOME_PRODUCT_ITEMS = [
    {
      start: 100,
      end: 250,
      title: 'G750 – RPAS',
      text: 'The Gryphen Defense G750-SMP sets a new standard for tactical and surveillance missions',
      href: '/index.html'
    },
    {
      start: 340,
      end: 470,
      title: 'G350 – ISR',
      text: 'Compact mission-ready aircraft systems for intelligence, surveillance and reconnaissance operations.',
      href: '/g350.html'
    },
    {
      start: 600,
      end: 646,
      title: 'Training Systems',
      text: 'Advanced aerial platforms designed for defense training, tactical readiness and operational support.',
      href: '/training.html'
    }
  ];

  const FACTORY_FRAME_COUNT = 150;
  const FACTORY_FRAME_PATH = '/home-factory-frames/factory_';
  const FACTORY_FRAME_EXT = '.jpg';
  const FACTORY_INITIAL_FRAME = 1;
  const FACTORY_TEXT_REVEAL_FRAME = 100;
  const FACTORY_MAX_DPR = 2;
const homeSequence = document.querySelector('#homeSequence');
const homeCanvas = document.querySelector('#homeSequenceCanvas');
const homeContext = homeCanvas.getContext('2d', { alpha: false });

const homeCurrentFrameEl = document.querySelector('#homeCurrentFrame');
const homeTotalFramesEl = document.querySelector('#homeTotalFrames');
const homeProgressValueEl = document.querySelector('#homeProgressValue');
const homeHeroCopy = document.querySelector('#homeHeroCopy');
const homeHeroTitle = document.querySelector('#homeHeroTitle');
const homeProductCopy = document.querySelector('#homeProductCopy');
const homeProductTitle = document.querySelector('#homeProductTitle');
const homeProductText = document.querySelector('#homeProductText');
const homeProductLink = document.querySelector('#homeProductLink');

const factorySequence = document.querySelector('#factorySequence');
const factoryCanvas = document.querySelector('#factorySequenceCanvas');
const factoryCopy = document.querySelector('#factorySequenceCopy');
const homeFrames = new Map();

let homeCurrentFrame = HOME_INITIAL_FRAME;
let homeCurrentImage = null;
let homeIsTicking = false;
let homeHasFirstPaint = false;
let activeHomeProductIndex = -1;
let homeHeroIsActive = false;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const padFrame = (frame) => String(frame).padStart(4, '0');
const homeFrameUrl = (frame) => `${HOME_FRAME_PATH}${padFrame(frame)}${HOME_FRAME_EXT}`;

function loadHomeFrame(frame) {
  const safeFrame = clamp(frame, 1, HOME_FRAME_COUNT);

  if (homeFrames.has(safeFrame)) {
    return homeFrames.get(safeFrame);
  }

  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = homeFrameUrl(safeFrame);
  });

  homeFrames.set(safeFrame, promise);
  return promise;
}

function setHomeHeroState(frame) {
    if (!homeHeroCopy || !homeHeroTitle) return;
  
    const shouldShow = frame >= HOME_TEXT_START_FRAME && frame <= HOME_TEXT_END_FRAME;
  
    if (shouldShow && !homeHeroIsActive) {
      homeHeroIsActive = true;
  
      homeHeroCopy.classList.add('is-active');
  
      // Relance propre du fade delayed
      void homeHeroCopy.offsetWidth;
  
      homeHeroCopy.classList.add('is-animated');
      homeHeroCopy.setAttribute('aria-hidden', 'false');
  
      setDigitalRevealVisible(homeHeroTitle, true);
    }
  
    if (!shouldShow && homeHeroIsActive) {
      homeHeroIsActive = false;
  
      homeHeroCopy.classList.remove('is-active', 'is-animated');
      homeHeroCopy.setAttribute('aria-hidden', 'true');
  
      setDigitalRevealVisible(homeHeroTitle, false);
    }
  }

function resizeHomeCanvas() {
  const rect = homeCanvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, HOME_MAX_DPR);

  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));

  if (homeCanvas.width !== width || homeCanvas.height !== height) {
    homeCanvas.width = width;
    homeCanvas.height = height;

    if (homeCurrentImage) {
      drawHomeImage(homeCurrentImage);
    }
  }
}

function drawHomeImage(img) {
  homeCurrentImage = img;

  const canvasRatio = homeCanvas.width / homeCanvas.height;
  const imageRatio = img.naturalWidth / img.naturalHeight;

  let sourceWidth = img.naturalWidth;
  let sourceHeight = img.naturalHeight;
  let sourceX = 0;
  let sourceY = 0;

  // Cover : remplit tout l'écran, crop léger si nécessaire.
  if (imageRatio > canvasRatio) {
    sourceWidth = img.naturalHeight * canvasRatio;
    sourceX = (img.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = img.naturalWidth / canvasRatio;
    sourceY = (img.naturalHeight - sourceHeight) / 2;
  }

  homeContext.fillStyle = '#000';
  homeContext.fillRect(0, 0, homeCanvas.width, homeCanvas.height);

  homeContext.drawImage(
    img,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    homeCanvas.width,
    homeCanvas.height
  );
}

function getHomeScrollProgress() {
  const rect = homeSequence.getBoundingClientRect();
  const scrollableDistance = rect.height - window.innerHeight;

  if (scrollableDistance <= 0) return 0;

  return clamp(-rect.top / scrollableDistance, 0, 1);
}

function homeFrameFromProgress(progress) {
  return clamp(
    Math.round(progress * (HOME_FRAME_COUNT - 1)) + 1,
    1,
    HOME_FRAME_COUNT
  );
}

function updateHomeDebug(frame, progress) {
  homeCurrentFrameEl.textContent = frame;
  homeTotalFramesEl.textContent = HOME_FRAME_COUNT;
  homeProgressValueEl.textContent = `${Math.round(progress * 100)}%`;
}

async function renderHomeFrame(frame) {
  homeCurrentFrame = frame;

  const img = await loadHomeFrame(frame);

  if (frame === homeCurrentFrame) {
    drawHomeImage(img);
  }
}

function preloadHomeAround(frame) {
  const radius = 14;

  for (let offset = -radius; offset <= radius; offset += 1) {
    const target = frame + offset;

    if (target >= 1 && target <= HOME_FRAME_COUNT) {
      loadHomeFrame(target).catch(() => {});
    }
  }
}

function getActiveHomeProductItem(frame) {
    const index = HOME_PRODUCT_ITEMS.findIndex((item) => {
      return frame >= item.start && frame <= item.end;
    });
  
    if (index === -1) {
      return {
        index: -1,
        item: null
      };
    }
  
    return {
      index,
      item: HOME_PRODUCT_ITEMS[index]
    };
  }
  
  function updateHomeProductCopy(frame) {
    if (!homeProductCopy || !homeProductTitle || !homeProductText || !homeProductLink) return;
  
    const { index, item } = getActiveHomeProductItem(frame);
  
    if (!item) {
      activeHomeProductIndex = -1;
      homeProductCopy.classList.remove('is-active');
      homeProductCopy.setAttribute('aria-hidden', 'true');
      setDigitalRevealVisible(homeProductTitle, false);
      return;
    }
  
    if (index !== activeHomeProductIndex) {
      activeHomeProductIndex = index;
  
      setDigitalRevealText(homeProductTitle, item.title);
      homeProductText.textContent = item.text;
      homeProductLink.href = item.href;
      
      homeProductCopy.classList.add('is-active');
      homeProductCopy.setAttribute('aria-hidden', 'false');
      
      setDigitalRevealVisible(homeProductTitle, true);
    }
  }

function updateHomeSequence() {
  homeIsTicking = false;

  resizeHomeCanvas();

  const progress = getHomeScrollProgress();
  const nextFrame = homeFrameFromProgress(progress);

  updateHomeDebug(nextFrame, progress);
  updateHomeProductCopy(nextFrame);
  setHomeHeroState(nextFrame);

  if (nextFrame !== homeCurrentFrame || !homeHasFirstPaint) {
    homeHasFirstPaint = true;
    renderHomeFrame(nextFrame).catch(() => {});
    preloadHomeAround(nextFrame);
  }
}

function requestHomeUpdate() {
  if (!homeIsTicking) {
    homeIsTicking = true;
    window.requestAnimationFrame(updateHomeSequence);
  }
}

async function initHomeSequence() {
  initSiteLoader({
    minDuration: 2600,
    preloadUrls: [
      ...buildFramePreloadList({
        path: HOME_FRAME_PATH,
        ext: HOME_FRAME_EXT,
        count: HOME_FRAME_COUNT,
        limit: 160
      }),
      ...buildFramePreloadList({
        path: FACTORY_FRAME_PATH,
        ext: FACTORY_FRAME_EXT,
        count: FACTORY_FRAME_COUNT,
        limit: 80
      })
    ]
  });  
    initSiteHeader();
  resizeHomeCanvas();
  initFactorySequence();
  initMissionCards();
  updateHomeDebug(HOME_INITIAL_FRAME, 0);

  try {
    const firstFrame = await loadHomeFrame(HOME_INITIAL_FRAME);
    drawHomeImage(firstFrame);
    updateHomeSequence();
    updateHomeProductCopy(HOME_INITIAL_FRAME);
    setHomeHeroState(HOME_INITIAL_FRAME);
    preloadHomeAround(HOME_INITIAL_FRAME);
  } catch (error) {
    console.error('Impossible de charger la séquence home.', error);
  }
}

const factoryContext = factoryCanvas?.getContext('2d', { alpha: false });
const factoryImages = new Map();

let factoryCurrentFrame = FACTORY_INITIAL_FRAME;
let factoryRafId = null;
let factoryHasFirstPaint = false;

function getFactoryFrameSrc(frame) {
  return `${FACTORY_FRAME_PATH}${String(frame).padStart(4, '0')}${FACTORY_FRAME_EXT}`;
}

function clampFactoryFrame(frame) {
  return Math.min(Math.max(frame, 1), FACTORY_FRAME_COUNT);
}

function getFactoryImage(frame) {
  const safeFrame = clampFactoryFrame(frame);

  if (factoryImages.has(safeFrame)) {
    return factoryImages.get(safeFrame);
  }

  const image = new Image();
  image.decoding = 'async';
  image.src = getFactoryFrameSrc(safeFrame);

  const promise = new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = reject;
  });

  factoryImages.set(safeFrame, promise);

  return promise;
}

function drawFactoryImage(image) {
  if (!factoryCanvas || !factoryContext || !image) return;

  const canvasWidth = factoryCanvas.width;
  const canvasHeight = factoryCanvas.height;

  const imageRatio = image.naturalWidth / image.naturalHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let drawWidth = canvasWidth;
  let drawHeight = canvasHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (imageRatio > canvasRatio) {
    drawHeight = canvasHeight;
    drawWidth = drawHeight * imageRatio;
    offsetX = (canvasWidth - drawWidth) / 2;
  } else {
    drawWidth = canvasWidth;
    drawHeight = drawWidth / imageRatio;
    offsetY = (canvasHeight - drawHeight) / 2;
  }

  factoryContext.clearRect(0, 0, canvasWidth, canvasHeight);
  factoryContext.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

async function renderFactoryFrame(frame) {
  const safeFrame = clampFactoryFrame(frame);
  const image = await getFactoryImage(safeFrame);

  if (safeFrame !== factoryCurrentFrame && factoryHasFirstPaint) return;

  drawFactoryImage(image);
  factoryHasFirstPaint = true;
}

function resizeFactoryCanvas() {
  if (!factoryCanvas || !factoryContext) return;

  const rect = factoryCanvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, FACTORY_MAX_DPR);

  factoryCanvas.width = Math.round(rect.width * dpr);
  factoryCanvas.height = Math.round(rect.height * dpr);

  renderFactoryFrame(factoryCurrentFrame);
}

function updateFactoryCopy(frame) {
  if (!factoryCopy) return;

  factoryCopy.classList.toggle('is-visible', frame >= FACTORY_TEXT_REVEAL_FRAME);
}

function updateFactorySequence() {
  if (!factorySequence || !factoryCanvas) return;

  const rect = factorySequence.getBoundingClientRect();
  const scrollableDistance = factorySequence.offsetHeight - window.innerHeight;
  const scrolled = Math.min(Math.max(-rect.top, 0), scrollableDistance);
  const progress = scrollableDistance > 0 ? scrolled / scrollableDistance : 0;

  const nextFrame = clampFactoryFrame(
    Math.round(progress * (FACTORY_FRAME_COUNT - 1)) + 1
  );

  factoryCurrentFrame = nextFrame;
  updateFactoryCopy(nextFrame);
  renderFactoryFrame(nextFrame);

  getFactoryImage(nextFrame + 1);
  getFactoryImage(nextFrame + 2);
  getFactoryImage(nextFrame + 3);
}

function requestFactoryUpdate() {
  if (factoryRafId) return;

  factoryRafId = requestAnimationFrame(() => {
    factoryRafId = null;
    updateFactorySequence();
  });
}

const missionCardsSection = document.querySelector('#missionCardsSection');
const missionCards = [...document.querySelectorAll('.mission-card')];

let activeMissionCardIndex = 0;
let missionCardsRafId = null;

function setActiveMissionCard(index) {
  if (!missionCards.length) return;
  if (index === activeMissionCardIndex) return;

  activeMissionCardIndex = index;

  missionCards.forEach((card, cardIndex) => {
    card.classList.toggle('is-active', cardIndex === activeMissionCardIndex);
  });
}

function updateMissionCards() {
  if (!missionCardsSection || !missionCards.length) return;

  const rect = missionCardsSection.getBoundingClientRect();
  const scrollableDistance = missionCardsSection.offsetHeight - window.innerHeight;
  const scrolled = Math.min(Math.max(-rect.top, 0), scrollableDistance);
  const progress = scrollableDistance > 0 ? scrolled / scrollableDistance : 0;

  const nextIndex = Math.min(
    missionCards.length - 1,
    Math.floor(progress * missionCards.length)
  );

  setActiveMissionCard(nextIndex);
}

function requestMissionCardsUpdate() {
  if (missionCardsRafId) return;

  missionCardsRafId = requestAnimationFrame(() => {
    missionCardsRafId = null;
    updateMissionCards();
  });
}

function initMissionCards() {
  if (!missionCardsSection || !missionCards.length) return;

  missionCards[0].classList.add('is-active');

  window.addEventListener('scroll', requestMissionCardsUpdate, { passive: true });
  window.addEventListener('resize', requestMissionCardsUpdate);

  requestMissionCardsUpdate();
}

function initFactorySequence() {
  if (!factorySequence || !factoryCanvas || !factoryContext) return;

  resizeFactoryCanvas();
  updateFactoryCopy(FACTORY_INITIAL_FRAME);
  renderFactoryFrame(FACTORY_INITIAL_FRAME);

  window.addEventListener('scroll', requestFactoryUpdate, { passive: true });
  window.addEventListener('resize', () => {
    resizeFactoryCanvas();
    requestFactoryUpdate();
  });

  requestFactoryUpdate();
}

window.addEventListener('scroll', requestHomeUpdate, { passive: true });
window.addEventListener('resize', requestHomeUpdate);
window.addEventListener('orientationchange', requestHomeUpdate);

initHomeSequence();