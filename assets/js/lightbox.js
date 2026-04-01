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

  document.body.appendChild(overlay);

  var currentIndex = -1;

  function show(index) {
    if (index < 0 || index >= images.length) return;
    currentIndex = index;
    img.src = images[index].src;
    img.alt = images[index].alt || "";
    counter.textContent = (index + 1) + " / " + images.length;
    counter.style.display = images.length > 1 ? "block" : "none";
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

  // Click overlay to close (but not on the image itself)
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) hide();
  });

  // Keyboard navigation
  document.addEventListener("keydown", function (e) {
    if (currentIndex === -1) return;
    if (e.key === "Escape") hide();
    else if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
  });
})();
