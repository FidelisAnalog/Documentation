import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.min.mjs";

function renderPageToCanvas(pdf, pageNum, container) {
  return pdf.getPage(pageNum).then(function (page) {
    var containerWidth = container.clientWidth;
    var unscaledViewport = page.getViewport({ scale: 1 });
    var scale = containerWidth / unscaledViewport.width;
    var renderScale = scale * (window.devicePixelRatio || 1);
    var viewport = page.getViewport({ scale: renderScale });

    var placeholder = document.getElementById("pdf-page-" + pageNum);
    placeholder.width = viewport.width;
    placeholder.height = viewport.height;

    var ctx = placeholder.getContext("2d");
    return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function () {
      return placeholder;
    });
  });
}

function embedPDF(container) {
  var url = container.getAttribute("data-pdf-url");
  if (!url) return;

  var loading = document.createElement("div");
  loading.textContent = "Loading PDF\u2026";
  loading.style.cssText = "padding:20px;color:rgba(255,255,255,0.5);font-size:14px;";
  container.appendChild(loading);

  pdfjsLib.getDocument(url).promise.then(function (pdf) {
    container.removeChild(loading);

    // Check for #page=N in URL
    var targetPage = null;
    var hashMatch = window.location.hash.match(/^#page=(\d+)/);
    if (hashMatch) {
      targetPage = Math.min(Math.max(parseInt(hashMatch[1], 10), 1), pdf.numPages);
    }

    var mixedSizes = container.hasAttribute("data-pdf-mixed-sizes");

    // Measure pages for placeholder sizes
    var measurePromise;
    if (mixedSizes) {
      // Measure every page individually
      var pagePromises = [];
      for (var i = 1; i <= pdf.numPages; i++) {
        pagePromises.push(pdf.getPage(i));
      }
      measurePromise = Promise.all(pagePromises);
    } else {
      // Use first page dimensions for all placeholders
      measurePromise = pdf.getPage(1).then(function (firstPage) {
        var arr = [];
        for (var i = 0; i < pdf.numPages; i++) {
          arr.push(firstPage);
        }
        return arr;
      });
    }

    measurePromise.then(function (pages) {
      // Create placeholders with aspect-ratio for responsive sizing
      for (var i = 0; i < pages.length; i++) {
        var unscaledViewport = pages[i].getViewport({ scale: 1 });

        var canvas = document.createElement("canvas");
        canvas.id = "pdf-page-" + (i + 1);
        canvas.style.cssText = "width:100%;height:auto;display:block;margin-bottom:2px;background:#f5f5f5;aspect-ratio:" + unscaledViewport.width + "/" + unscaledViewport.height + ";";
        container.appendChild(canvas);
      }

      // Download link at end
      var dl = document.createElement("a");
      dl.href = url;
      dl.download = "";
      dl.textContent = "Download PDF";
      dl.style.cssText = "display:inline-block;margin-top:8px;font-size:13px;color:#00e5ff;text-decoration:none;";
      container.appendChild(dl);

      // Render target page first if specified, then scroll instantly
      if (targetPage) {
        renderPageToCanvas(pdf, targetPage, container).then(function (canvas) {
          canvas.scrollIntoView({ behavior: "instant" });
          renderRemaining(pdf, container, targetPage);
        });
      } else {
        renderSequential(pdf, container, 1);
      }
    });
  }).catch(function (err) {
    container.removeChild(loading);
    var errMsg = document.createElement("div");
    errMsg.textContent = "Failed to load PDF: " + err.message;
    errMsg.style.cssText = "padding:20px;color:#ff4444;font-size:14px;";
    container.appendChild(errMsg);
  });
}

function renderSequential(pdf, container, pageNum) {
  if (pageNum > pdf.numPages) return;
  renderPageToCanvas(pdf, pageNum, container).then(function () {
    renderSequential(pdf, container, pageNum + 1);
  });
}

function renderRemaining(pdf, container, skip) {
  var pages = [];
  for (var i = 1; i <= pdf.numPages; i++) {
    if (i !== skip) pages.push(i);
  }
  var idx = 0;
  function next() {
    if (idx >= pages.length) return;
    renderPageToCanvas(pdf, pages[idx], container).then(function () {
      idx++;
      next();
    });
  }
  next();
}

// Initialize all PDF embeds on the page
var containers = document.querySelectorAll(".pdf-embed");
for (var i = 0; i < containers.length; i++) {
  embedPDF(containers[i]);
}
