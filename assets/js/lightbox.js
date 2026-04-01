"use strict";
(function () {
  // Collect all images in main content
  var images = Array.from(document.querySelectorAll(".main-content img"));
  if (!images.length) return;

  // Create overlay
  var overlay = document.createElement("div");
  overlay.className = "lightbox-overlay";
  overlay.style.display = "none";

  var img = document.createElement("img");
  img.className = "lightbox-img";
  overlay.appendChild(img);

  var counter = document.createElement("div");
  counter.className = "lightbox-counter";
  overlay.appendChild(counter);

  // Close button
  var closeBtn = document.createElement("div");
  closeBtn.className = "lightbox-close";
  closeBtn.textContent = "\u00d7";
  overlay.appendChild(closeBtn);

  // Nav arrows (visible on non-touch devices, hidden on touch)
  var prevBtn = document.createElement("div");
  prevBtn.className = "lightbox-nav lightbox-prev";
  prevBtn.textContent = "\u2039";
  overlay.appendChild(prevBtn);

  var nextBtn = document.createElement("div");
  nextBtn.className = "lightbox-nav lightbox-next";
  nextBtn.textContent = "\u203a";
  overlay.appendChild(nextBtn);

  document.body.appendChild(overlay);

  var currentIndex = -1;

  function show(index) {
    if (index < 0 || index >= images.length) return;
    currentIndex = index;
    img.src = images[index].src;
    img.alt = images[index].alt || "";
    counter.textContent = (index + 1) + " / " + images.length;
    counter.style.display = images.length > 1 ? "block" : "none";
    prevBtn.style.display = images.length > 1 && index > 0 ? "flex" : "none";
    nextBtn.style.display = images.length > 1 && index < images.length - 1 ? "flex" : "none";
    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function hide() {
    overlay.style.display = "none";
    document.body.style.overflow = "";
    currentIndex = -1;
  }

  function next() {
    if (currentIndex < images.length - 1) show(currentIndex + 1);
  }

  function prev() {
    if (currentIndex > 0) show(currentIndex - 1);
  }

  // Click image to open
  images.forEach(function (image, i) {
    image.style.cursor = "pointer";
    image.addEventListener("click", function () { show(i); });
  });

  // Close button
  closeBtn.addEventListener("click", hide);

  // Click overlay background to close
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) hide();
  });

  // Nav arrows
  prevBtn.addEventListener("click", function (e) { e.stopPropagation(); prev(); });
  nextBtn.addEventListener("click", function (e) { e.stopPropagation(); next(); });

  // Tap left/right half of image to navigate on touch
  img.addEventListener("click", function (e) {
    if (images.length <= 1) return;
    var rect = img.getBoundingClientRect();
    var x = e.clientX - rect.left;
    if (x < rect.width / 3) prev();
    else if (x > rect.width * 2 / 3) next();
    else hide();
  });

  // Swipe gestures
  var touchStartX = 0;
  var touchStartY = 0;

  overlay.addEventListener("touchstart", function (e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  overlay.addEventListener("touchend", function (e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;

    // Only register horizontal swipes (ignore vertical)
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) next();
      else prev();
    }
  }, { passive: true });

  // Trackpad horizontal scroll (two-finger swipe on desktop)
  var wheelAccum = 0;
  var wheelTimeout = null;

  overlay.addEventListener("wheel", function (e) {
    if (currentIndex === -1) return;
    e.preventDefault();

    wheelAccum += e.deltaX;

    if (wheelTimeout) clearTimeout(wheelTimeout);
    wheelTimeout = setTimeout(function () { wheelAccum = 0; }, 200);

    if (wheelAccum > 80) {
      wheelAccum = 0;
      next();
    } else if (wheelAccum < -80) {
      wheelAccum = 0;
      prev();
    }
  }, { passive: false });

  // Keyboard navigation
  document.addEventListener("keydown", function (e) {
    if (currentIndex === -1) return;
    if (e.key === "Escape") hide();
    else if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
  });
})();
