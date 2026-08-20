(() => {
  const FRAME_COUNT = 300;
  const FOLDER_PATH = 'ezgif-10b4802df43b0199-jpg';
  
  const canvas = document.getElementById('animation-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const loader = document.getElementById('loader');
  const loaderText = document.getElementById('loader-text');

  // Preloaded image objects cache
  const images = new Array(FRAME_COUNT);
  let loadedCount = 0;
  let isInitialFrameRendered = false;

  // Smooth scroll interpolation variables
  let targetFrame = 0;
  let currentFrame = 0;
  let lastDrawnFrame = -1;
  const LERP_FACTOR = 0.15; // Smooth interpolation speed

  // Format frame URL with 3-digit zero padding (ezgif-frame-001.jpg -> ezgif-frame-300.jpg)
  function getFrameUrl(index) {
    const frameNum = String(index + 1).padStart(3, '0');
    return `${FOLDER_PATH}/ezgif-frame-${frameNum}.jpg`;
  }

  // Configure high-DPI canvas size matching window viewport
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Optimized crispness
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
    }

    // Force redraw on resize
    const frameToDraw = Math.round(currentFrame);
    if (images[frameToDraw] && images[frameToDraw].complete) {
      drawFrame(frameToDraw);
    }
  }

  // Draw a frame centered with crisp aspect ratio preservation (contain)
  function drawFrame(frameIndex) {
    const img = images[frameIndex];
    if (!img || !img.complete || img.naturalWidth === 0) {
      return;
    }

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Calculate aspect ratio fill (cover) to eliminate any black side bars
    const scale = Math.max(cw / iw, ch / ih);
    const drawW = iw * scale;
    const drawH = ih * scale;
    const offsetX = (cw - drawW) / 2;
    const offsetY = (ch - drawH) / 2;

    // Draw frame filling the entire screen edge-to-edge
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

    lastDrawnFrame = frameIndex;
  }

  // Update target frame from window scroll position
  function updateScrollTarget() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) {
      targetFrame = 0;
      return;
    }
    const scrollFraction = Math.max(0, Math.min(1, window.scrollY / maxScroll));
    targetFrame = scrollFraction * (FRAME_COUNT - 1);
  }

  // Animation render loop with continuous smooth easing
  function renderLoop() {
    // Interpolate current frame towards target frame
    const delta = targetFrame - currentFrame;
    if (Math.abs(delta) > 0.001) {
      currentFrame += delta * LERP_FACTOR;
    } else {
      currentFrame = targetFrame;
    }

    const frameIndex = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(currentFrame)));
    
    // Only repaint if frame changed or canvas was invalidated
    if (frameIndex !== lastDrawnFrame) {
      if (images[frameIndex] && images[frameIndex].complete) {
        drawFrame(frameIndex);
      } else {
        // Fallback search to nearest cached frame
        let fallback = -1;
        for (let offset = 1; offset < FRAME_COUNT; offset++) {
          if (frameIndex - offset >= 0 && images[frameIndex - offset]?.complete) {
            fallback = frameIndex - offset;
            break;
          }
          if (frameIndex + offset < FRAME_COUNT && images[frameIndex + offset]?.complete) {
            fallback = frameIndex + offset;
            break;
          }
        }
        if (fallback !== -1) {
          drawFrame(fallback);
        }
      }
    }

    requestAnimationFrame(renderLoop);
  }

  // Preload all frames asynchronously
  function preloadImages() {
    let initialBuffered = false;

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src = getFrameUrl(i);

      img.onload = () => {
        loadedCount++;
        const percent = Math.floor((loadedCount / FRAME_COUNT) * 100);
        if (loaderText) {
          loaderText.textContent = `Loading Experience... ${percent}%`;
        }

        // Render first frame immediately once loaded
        if (i === 0 && !isInitialFrameRendered) {
          isInitialFrameRendered = true;
          resizeCanvas();
          drawFrame(0);
        }

        // Hide preloader as soon as critical initial buffer is ready
        if (!initialBuffered && (loadedCount >= Math.min(25, FRAME_COUNT) || loadedCount === FRAME_COUNT)) {
          initialBuffered = true;
          setTimeout(() => {
            if (loader) {
              loader.classList.add('hidden');
            }
          }, 150);
        }
      };

      img.onerror = () => {
        loadedCount++;
      };

      images[i] = img;
    }
  }

  // Smooth active nav link highlight
  const sections = document.querySelectorAll('section[id], footer[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  function updateActiveNavLink() {
    let currentSection = '';
    const scrollPos = window.scrollY + 200;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  }

  // Progressive scroll drawing for workflow cards & genuine circular dots
  const workflowSection = document.getElementById('workflow');
  const workflowCards = document.querySelectorAll('.workflow-step-card');
  const maskLine12 = document.getElementById('mask-line-1-2');
  const maskLine23 = document.getElementById('mask-line-2-3');
  const maskLine34 = document.getElementById('mask-line-3-4');

  const maskElements = [maskLine12, maskLine23, maskLine34];
  const maskLengths = [];

  function initPaths() {
    maskElements.forEach((maskLine) => {
      if (maskLine) {
        const len = maskLine.getTotalLength ? maskLine.getTotalLength() : 400;
        maskLengths.push(len);
        maskLine.style.strokeDasharray = `${len} ${len}`;
        maskLine.style.strokeDashoffset = len;
      }
    });
  }

  function updateWorkflowProgress() {
    if (!workflowSection) return;
    const rect = workflowSection.getBoundingClientRect();
    const windowH = window.innerHeight;

    // Trigger window: starts when workflow section is within 85% of viewport
    const startY = rect.top;
    const totalH = rect.height;
    const scrolledPx = (windowH * 0.85) - startY;
    const progress = Math.max(0, Math.min(1, scrolledPx / (totalH * 0.90)));

    // Card 1 (Plan): pops up first
    const card1Visible = progress >= 0.05;
    
    // Dot Path 1 -> 2 (Left to Right): draws from progress 0.08 to 0.32
    const p12Prog = Math.max(0, Math.min(1, (progress - 0.08) / 0.24));
    if (maskLine12 && maskLengths[0]) {
      maskLine12.style.strokeDashoffset = maskLengths[0] * (1 - p12Prog);
    }
    // Card 2 (Design): appears as soon as dots reach the right side (0.32)
    const card2Visible = progress >= 0.32;

    // Dot Path 2 -> 3 (Right to Left): draws from progress 0.34 to 0.58
    const p23Prog = Math.max(0, Math.min(1, (progress - 0.34) / 0.24));
    if (maskLine23 && maskLengths[1]) {
      maskLine23.style.strokeDashoffset = maskLengths[1] * (1 - p23Prog);
    }
    // Card 3 (Develop): appears as soon as dots reach the left side (0.58)
    const card3Visible = progress >= 0.58;

    // Dot Path 3 -> 4 (Left to Right): draws from progress 0.60 to 0.84
    const p34Prog = Math.max(0, Math.min(1, (progress - 0.60) / 0.24));
    if (maskLine34 && maskLengths[2]) {
      maskLine34.style.strokeDashoffset = maskLengths[2] * (1 - p34Prog);
    }
    // Card 4 (Deploy): appears as soon as dots reach the right side (0.84)
    const card4Visible = progress >= 0.84;

    const cardsVisible = [card1Visible, card2Visible, card3Visible, card4Visible];

    workflowCards.forEach((card, idx) => {
      if (cardsVisible[idx]) {
        card.classList.add('is-revealed');
      } else {
        card.classList.remove('is-revealed');
      }
    });
  }

  // Event Listeners
  window.addEventListener('scroll', () => {
    updateScrollTarget();
    updateActiveNavLink();
    updateWorkflowProgress();
  }, { passive: true });

  window.addEventListener('resize', () => {
    resizeCanvas();
    updateScrollTarget();
    updateWorkflowProgress();
  }, { passive: true });

  window.addEventListener('orientationchange', resizeCanvas, { passive: true });

  // Initialize
  resizeCanvas();
  initPaths();
  updateScrollTarget();
  updateWorkflowProgress();
  preloadImages();
  requestAnimationFrame(renderLoop);
})();
