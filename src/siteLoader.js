import './siteLoader.css';

export function buildFramePreloadList({ path, ext, count, limit = 140 }) {
  const safeLimit = Math.min(count, limit);

  return Array.from({ length: safeLimit }, (_, index) => {
    const frame = String(index + 1).padStart(4, '0');
    return `${path}${frame}${ext}`;
  });
}

function preloadImage(src, timeout = 9000) {
  return new Promise((resolve) => {
    const image = new Image();
    const timer = window.setTimeout(resolve, timeout);

    image.onload = () => {
      window.clearTimeout(timer);
      resolve();
    };

    image.onerror = () => {
      window.clearTimeout(timer);
      resolve();
    };

    image.src = src;
  });
}

async function preloadAssets(urls, concurrency = 8) {
  const queue = [...urls];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      const src = queue.shift();
      await preloadImage(src);
    }
  });

  await Promise.all(workers);
}

export function initSiteLoader(options = {}) {
  if (document.querySelector('#siteLoader')) return;

  const {
    minDuration = 2200,
    preloadUrls = []
  } = options;

  document.documentElement.classList.add('is-site-loading');

  const loader = document.createElement('div');
  loader.className = 'site-loader';
  loader.id = 'siteLoader';
  loader.setAttribute('aria-live', 'polite');

  loader.innerHTML = `
    <span class="site-loader__corner site-loader__corner--top-left"></span>
    <span class="site-loader__corner site-loader__corner--top-right"></span>
    <span class="site-loader__corner site-loader__corner--bottom-left"></span>
    <span class="site-loader__corner site-loader__corner--bottom-right"></span>

    <div class="site-loader__label">Loading</div>

    <div class="site-loader__media">
      <video
        src="/loader.mp4"
        autoplay
        muted
        loop
        playsinline
        preload="auto"
        aria-hidden="true"
      ></video>
    </div>

    <div class="site-loader__progress">
      <span id="siteLoaderProgress">0</span>%
    </div>
  `;

  document.body.prepend(loader);

  const progressEl = loader.querySelector('#siteLoaderProgress');

  let progress = 0;
  let isFinished = false;

  function setProgress(value) {
    progress = Math.min(Math.max(value, 0), 100);
    progressEl.textContent = String(Math.round(progress));
  }

  const progressInterval = window.setInterval(() => {
    if (isFinished) return;

    const nextProgress = progress + Math.random() * 4 + 1.5;
    setProgress(Math.min(nextProgress, 92));
  }, 140);

  function finishLoader() {
    isFinished = true;
    window.clearInterval(progressInterval);

    const finishInterval = window.setInterval(() => {
      setProgress(progress + 3);

      if (progress >= 100) {
        window.clearInterval(finishInterval);

        window.setTimeout(() => {
          loader.classList.add('is-hidden');
          document.documentElement.classList.remove('is-site-loading');

          window.setTimeout(() => {
            loader.remove();
          }, 760);
        }, 260);
      }
    }, 34);
  }

  const minLoadingTime = new Promise((resolve) => {
    window.setTimeout(resolve, minDuration);
  });

  const pageLoaded = new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
      return;
    }

    window.addEventListener('load', resolve, { once: true });
  });

  const assetsLoaded = preloadAssets(preloadUrls, 8);

  Promise.all([minLoadingTime, pageLoaded, assetsLoaded]).then(finishLoader);
}