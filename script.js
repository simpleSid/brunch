document.documentElement.classList.add("js");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = document.querySelectorAll(".reveal");
const gallery = document.querySelector("[data-gallery]");
const scrollVideo = document.querySelector("[data-scroll-video]");

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );

  revealItems.forEach((item) => observer.observe(item));
}

if (scrollVideo) {
  initScrollVideo(scrollVideo);
}

function initScrollVideo(section) {
  const canvas = section.querySelector("[data-scroll-video-canvas]");
  const context = canvas?.getContext("2d", { alpha: false });
  const frameCount = Number(section.dataset.frameCount) || 440;
  const framePath = (index) => `assets/hero/frames/brunch_${String(index + 1).padStart(4, "0")}.avif`;
  const cache = new Map();
  let requestedFrame = prefersReducedMotion ? frameCount - 1 : 0;
  let currentImage = null;
  let animationFrame = 0;

  if (!canvas || !context) {
    return;
  }

  const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
  const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);
  const videoEndProgress = 0.68;
  const menuRevealFrame = 410;
  const revealStartProgress = videoEndProgress * ((menuRevealFrame - 1) / (frameCount - 1));
  const revealDuration = 0.22;

  const setRevealState = (progress) => {
    const reveal = easeOutCubic(clamp((progress - revealStartProgress) / revealDuration));

    section.style.setProperty("--hero-reveal-opacity", reveal.toFixed(3));
    section.style.setProperty("--hero-scrim-opacity", (reveal * 0.88).toFixed(3));
    section.style.setProperty("--hero-copy-x", `${(1 - reveal) * -26}px`);
    section.style.setProperty("--hero-copy-y", `${(1 - reveal) * 38}px`);
    section.style.setProperty("--hero-media-x", `${(1 - reveal) * 34}px`);
    section.style.setProperty("--hero-media-y", `${(1 - reveal) * 10}px`);
    section.style.setProperty("--hero-media-scale", (0.96 + reveal * 0.04).toFixed(3));
  };

  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * pixelRatio));
    const height = Math.max(1, Math.round(rect.height * pixelRatio));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    if (currentImage) {
      drawImage(currentImage);
    }
  };

  const drawImage = (image) => {
    const rect = canvas.getBoundingClientRect();
    const canvasRatio = rect.width / rect.height;
    const imageRatio = image.naturalWidth / image.naturalHeight;
    let drawWidth = rect.width;
    let drawHeight = rect.height;
    let x = 0;
    let y = 0;

    if (imageRatio > canvasRatio) {
      drawWidth = rect.height * imageRatio;
      x = (rect.width - drawWidth) / 2;
    } else {
      drawHeight = rect.width / imageRatio;
      y = (rect.height - drawHeight) / 2;
    }

    context.clearRect(0, 0, rect.width, rect.height);
    context.drawImage(image, x, y, drawWidth, drawHeight);
    currentImage = image;
  };

  const loadFrame = (index) => {
    const frameIndex = clamp(index, 0, frameCount - 1);

    if (cache.has(frameIndex)) {
      return cache.get(frameIndex);
    }

    const image = new Image();
    const promise = new Promise((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = reject;
    });

    image.decoding = "async";
    image.src = framePath(frameIndex);
    cache.set(frameIndex, promise);
    return promise;
  };

  const drawFrame = (index) => {
    requestedFrame = clamp(index, 0, frameCount - 1);

    loadFrame(requestedFrame)
      .then((image) => {
        if (index === requestedFrame) {
          drawImage(image);
        }
      })
      .catch(() => {
        section.classList.add("is-sequence-error");
      });
  };

  const preloadAround = (index) => {
    for (let offset = -2; offset <= 8; offset += 1) {
      const nextIndex = index + offset;

      if (nextIndex >= 0 && nextIndex < frameCount) {
        loadFrame(nextIndex).catch(() => {});
      }
    }
  };

  const getScrollProgress = () => {
    const distance = Math.max(1, section.offsetHeight - window.innerHeight);
    const top = section.getBoundingClientRect().top;

    return clamp(-top / distance);
  };

  const update = () => {
    animationFrame = 0;

    const progress = prefersReducedMotion ? 1 : getScrollProgress();
    const sequenceProgress = clamp(progress / videoEndProgress);
    const frameIndex = Math.round(sequenceProgress * (frameCount - 1));

    setRevealState(progress);
    drawFrame(frameIndex);
    preloadAround(frameIndex);
  };

  const requestUpdate = () => {
    if (!animationFrame) {
      animationFrame = window.requestAnimationFrame(update);
    }
  };

  resizeCanvas();
  setRevealState(prefersReducedMotion ? 1 : 0);
  drawFrame(requestedFrame);
  preloadAround(requestedFrame);

  if (!prefersReducedMotion) {
    window.addEventListener("scroll", requestUpdate, { passive: true });
  }

  window.addEventListener(
    "resize",
    () => {
      resizeCanvas();
      requestUpdate();
    },
    { passive: true }
  );

  requestUpdate();
}

if (gallery) {
  const slides = [
    {
      src: "photos/interior/interior_001_source_003.jpg",
      alt: "Круглый стол, цветочные кресла и растения в зале Brunch",
    },
    {
      src: "photos/interior/interior_002_source_006.jpg",
      alt: "Фактурная стена с логотипом Brunch и столиком",
    },
    {
      src: "photos/interior/interior_003_source_011.jpg",
      alt: "Стол у окна с люстрой и видом из зала Brunch",
    },
    {
      src: "photos/interior/interior_004_source_012.jpg",
      alt: "Пудровый диван, зеркала и черно-белая плитка в Brunch",
    },
    {
      src: "photos/interior/interior_008_source_024.jpg",
      alt: "Два пудровых кресла у фактурной стены",
    },
    {
      src: "photos/interior/interior_009_source_033.jpg",
      alt: "Посадка у витрин с мягкими креслами и столами",
    },
    {
      src: "photos/interior/interior_010_source_034.jpg",
      alt: "Светлый столик и диван у стены с логотипом Brunch",
    },
    {
      src: "photos/interior/interior_016_source_057.jpg",
      alt: "Уютный уголок с пудровыми стульями и настенным декором",
    },
  ];

  const cards = [...gallery.querySelectorAll("[data-gallery-card]")];
  const prevButton = gallery.querySelector("[data-gallery-prev]");
  const nextButton = gallery.querySelector("[data-gallery-next]");
  const dotsContainer = gallery.querySelector("[data-gallery-dots]");
  const intervalMs = 3000;
  let currentIndex = 0;
  let timerId;
  let touchStartX = 0;
  let rotation = 0;

  slides.forEach((slide, index) => {
    const dot = document.createElement("button");
    dot.className = "gallery-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Показать фото ${index + 1}`);
    dot.addEventListener("click", () => showSlide(index, true));
    dotsContainer.append(dot);
  });

  const dots = [...dotsContainer.querySelectorAll(".gallery-dot")];

  const restartTimer = () => {
    window.clearInterval(timerId);

    if (!prefersReducedMotion) {
      timerId = window.setInterval(() => showSlide(currentIndex + 1), intervalMs);
    }
  };

  const setImageState = (visibleImage, hiddenImage, slide) => {
    visibleImage.src = slide.src;
    visibleImage.alt = slide.alt;
    visibleImage.setAttribute("aria-hidden", "false");
    hiddenImage.alt = "";
    hiddenImage.setAttribute("aria-hidden", "true");
  };

  function showSlide(nextIndex, userInitiated = false, animate = true) {
    currentIndex = (nextIndex + slides.length) % slides.length;
    const shouldAnimate = animate && !prefersReducedMotion;
    const nextRotation = shouldAnimate ? rotation - 180 : 0;

    cards.forEach((card, cardIndex) => {
      const slide = slides[(currentIndex + cardIndex) % slides.length];
      const front = card.querySelector("[data-gallery-front]");
      const back = card.querySelector("[data-gallery-back]");
      const activeSide = card.dataset.activeSide || "front";
      const visibleImage = activeSide === "front" ? front : back;
      const hiddenImage = activeSide === "front" ? back : front;

      if (!shouldAnimate) {
        card.dataset.activeSide = "front";
        card.style.transitionDelay = "0ms";
        card.style.transform = "rotateY(0deg)";
        setImageState(front, back, slide);
        return;
      }

      card.dataset.activeSide = activeSide === "front" ? "back" : "front";
      card.style.transitionDelay = `${cardIndex * 200}ms`;
      hiddenImage.src = slide.src;
      hiddenImage.alt = slide.alt;
      hiddenImage.setAttribute("aria-hidden", "false");
      visibleImage.alt = "";
      visibleImage.setAttribute("aria-hidden", "true");
      card.style.transform = `rotateY(${nextRotation}deg)`;
    });

    rotation = nextRotation;

    dots.forEach((dot, index) => {
      const isActive = index === currentIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });

    if (userInitiated) {
      restartTimer();
    }
  }

  prevButton.addEventListener("click", () => showSlide(currentIndex - 1, true));
  nextButton.addEventListener("click", () => showSlide(currentIndex + 1, true));

  gallery.addEventListener("mouseenter", () => window.clearInterval(timerId));
  gallery.addEventListener("mouseleave", restartTimer);
  gallery.addEventListener("focusin", () => window.clearInterval(timerId));
  gallery.addEventListener("focusout", restartTimer);

  gallery.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      showSlide(currentIndex - 1, true);
    }

    if (event.key === "ArrowRight") {
      showSlide(currentIndex + 1, true);
    }
  });

  gallery.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.changedTouches[0].clientX;
    },
    { passive: true }
  );

  gallery.addEventListener(
    "touchend",
    (event) => {
      const deltaX = event.changedTouches[0].clientX - touchStartX;

      if (Math.abs(deltaX) > 42) {
        showSlide(currentIndex + (deltaX < 0 ? 1 : -1), true);
      }
    },
    { passive: true }
  );

  showSlide(0, false, false);
  restartTimer();
}
