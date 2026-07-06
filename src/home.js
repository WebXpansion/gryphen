import './home.css';
import {
  setDigitalRevealText,
  setDigitalRevealVisible
} from './digitalReveal.js';

import { initSiteHeader } from './siteHeader.js';

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
    initSiteHeader();
  resizeHomeCanvas();
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

window.addEventListener('scroll', requestHomeUpdate, { passive: true });
window.addEventListener('resize', requestHomeUpdate);
window.addEventListener('orientationchange', requestHomeUpdate);

initHomeSequence();