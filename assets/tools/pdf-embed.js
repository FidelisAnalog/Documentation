import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.min.mjs";

function embedPDF(container) {
  var url = container.getAttribute("data-pdf-url");
  if (!url) return;

  var loading = document.createElement("div");
  loading.textContent = "Loading PDF\u2026";
  loading.style.cssText = "padding:20px;color:rgba(255,255,255,0.5);font-size:14px;";
  container.appendChild(loading);

  pdfjsLib.getDocument(url).promise.then(function (pdf) {
    container.removeChild(loading);

    // Download link at top
    var dl = document.createElement("a");
    dl.href = url;
    dl.download = "";
    dl.textContent = "Download PDF (" + pdf.numPages + " pages)";
    dl.style.cssText = "display:inline-block;margin-bottom:12px;font-size:13px;color:#00e5ff;text-decoration:none;";
    container.appendChild(dl);

    // Check for #page=N in URL
    var targetPage = null;
    var hashMatch = window.location.hash.match(/^#page=(\d+)/);
    if (hashMatch) {
      targetPage = parseInt(hashMatch[1], 10);
    }

    // Render each page to a canvas
    var renderPage = function (pageNum) {
      pdf.getPage(pageNum).then(function (page) {
        var containerWidth = container.clientWidth;
        var unscaledViewport = page.getViewport({ scale: 1 });
        var scale = containerWidth / unscaledViewport.width;
        var renderScale = scale * (window.devicePixelRatio || 1);
        var viewport = page.getViewport({ scale: renderScale });

        var canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.cssText = "width:100%;height:auto;display:block;margin-bottom:2px;";
        canvas.id = "pdf-page-" + pageNum;
        container.appendChild(canvas);

        var ctx = canvas.getContext("2d");
        page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function () {
          // Scroll to target page once it's rendered
          if (targetPage === pageNum) {
            canvas.scrollIntoView({ behavior: "smooth" });
          }

          if (pageNum < pdf.numPages) {
            renderPage(pageNum + 1);
          }
        });
      });
    };

    renderPage(1);
  }).catch(function (err) {
    container.removeChild(loading);
    var errMsg = document.createElement("div");
    errMsg.textContent = "Failed to load PDF: " + err.message;
    errMsg.style.cssText = "padding:20px;color:#ff4444;font-size:14px;";
    container.appendChild(errMsg);
  });
}

// Initialize all PDF embeds on the page
var containers = document.querySelectorAll(".pdf-embed");
for (var i = 0; i < containers.length; i++) {
  embedPDF(containers[i]);
}
