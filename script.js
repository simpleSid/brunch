document.documentElement.classList.add("js");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = document.querySelectorAll(".reveal");
const gallery = document.querySelector("[data-gallery]");

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

if (gallery) {
  const slides = [
    {
      src: "photos/interior_photos/interior_001_source_003.jpg",
      alt: "Круглый стол, цветочные кресла и растения в зале Brunch",
    },
    {
      src: "photos/interior_photos/interior_002_source_006.jpg",
      alt: "Фактурная стена с логотипом Brunch и столиком",
    },
    {
      src: "photos/interior_photos/interior_003_source_011.jpg",
      alt: "Стол у окна с люстрой и видом из зала Brunch",
    },
    {
      src: "photos/interior_photos/interior_004_source_012.jpg",
      alt: "Пудровый диван, зеркала и черно-белая плитка в Brunch",
    },
    {
      src: "photos/interior_photos/interior_008_source_024.jpg",
      alt: "Два пудровых кресла у фактурной стены",
    },
    {
      src: "photos/interior_photos/interior_009_source_033.jpg",
      alt: "Посадка у витрин с мягкими креслами и столами",
    },
    {
      src: "photos/interior_photos/interior_010_source_034.jpg",
      alt: "Светлый столик и диван у стены с логотипом Brunch",
    },
    {
      src: "photos/interior_photos/interior_016_source_057.jpg",
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
