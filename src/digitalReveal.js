const blockChars = [
    '■', '▇', '▆', '▅', '▄', '▃', '▂', '▁',
    '▉', '▊', '▋', '▌', '▍', '▎', '▏'
  ];
  
  const digitalRevealState = new WeakMap();
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  function randomBlockChar() {
    return blockChars[Math.floor(Math.random() * blockChars.length)];
  }
  
  function isSkippableChar(char) {
    return char === ' ' || /[.,!?;:'"()[\]{}\-_/–—&]/.test(char);
  }
  
  function buildDigitalRevealText(text, revealCount) {
    let revealed = 0;
  
    return text
      .split('')
      .map((char) => {
        if (isSkippableChar(char)) return char;
  
        revealed += 1;
  
        if (revealed <= revealCount) {
          return char;
        }
  
        return randomBlockChar();
      })
      .join('');
  }
  
  function getDigitalRevealState(element) {
    if (!digitalRevealState.has(element)) {
      digitalRevealState.set(element, {
        originalText: element.textContent,
        rafId: null,
        isAnimating: false,
        isVisible: false
      });
    }
  
    return digitalRevealState.get(element);
  }
  
  function lockDigitalRevealSize(element) {
    const rect = element.getBoundingClientRect();
  
    element.style.width = `${Math.ceil(rect.width)}px`;
    element.style.height = `${Math.ceil(rect.height)}px`;
  }
  
  function unlockDigitalRevealSize(element) {
    element.style.width = '';
    element.style.height = '';
  }
  
  export function setDigitalRevealText(element, text) {
    if (!element) return;
  
    const state = getDigitalRevealState(element);
  
    if (state.originalText !== text) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
      state.isAnimating = false;
      state.isVisible = false;
      state.originalText = text;
      element.textContent = text;
      unlockDigitalRevealSize(element);
    }
  }
  
  export function resetDigitalReveal(element) {
    if (!element) return;
  
    const state = getDigitalRevealState(element);
  
    cancelAnimationFrame(state.rafId);
    state.rafId = null;
    state.isAnimating = false;
    element.textContent = state.originalText;
    unlockDigitalRevealSize(element);
  }
  
  export function startDigitalReveal(element) {
    if (!element) return;
  
    const state = getDigitalRevealState(element);
  
    if (motionQuery.matches) {
      element.textContent = state.originalText;
      return;
    }
  
    if (state.isAnimating) return;
  
    state.isAnimating = true;
    lockDigitalRevealSize(element);
  
    const revealableCharsCount = state.originalText
      .split('')
      .filter((char) => !isSkippableChar(char)).length;
  
    const holdSteps = 2;
    const endHoldSteps = 1;
    const totalSteps = holdSteps + revealableCharsCount + endHoldSteps;
    const frameDuration = 30;
  
    let step = 0;
    let lastTime = 0;
  
    function tick(now) {
      if (!state.isAnimating) return;
  
      if (!lastTime) lastTime = now;
  
      const elapsed = now - lastTime;
  
      if (elapsed >= frameDuration) {
        lastTime = now;
  
        const revealCount = Math.max(0, step - holdSteps);
        element.textContent = buildDigitalRevealText(state.originalText, revealCount);
  
        step += 1;
  
        if (step > totalSteps) {
          element.textContent = state.originalText;
          state.isAnimating = false;
          unlockDigitalRevealSize(element);
          return;
        }
      }
  
      state.rafId = requestAnimationFrame(tick);
    }
  
    cancelAnimationFrame(state.rafId);
    state.rafId = requestAnimationFrame(tick);
  }
  
  export function setDigitalRevealVisible(element, isVisible) {
    if (!element) return;
  
    const state = getDigitalRevealState(element);
  
    if (isVisible && !state.isVisible) {
      state.isVisible = true;
      resetDigitalReveal(element);
      startDigitalReveal(element);
      return;
    }
  
    if (!isVisible && state.isVisible) {
      state.isVisible = false;
      resetDigitalReveal(element);
    }
  }
  
  export function initDigitalRevealObserver() {
    const automaticTitles = document.querySelectorAll(
      '[data-digital-reveal]:not([data-digital-manual])'
    );
  
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setDigitalRevealVisible(entry.target, entry.isIntersecting);
        });
      },
      {
        threshold: 0.45
      }
    );
  
    automaticTitles.forEach((title) => observer.observe(title));
  }