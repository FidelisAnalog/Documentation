import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.min.mjs";

function embedPDF(container) {
  var url = container.getAttribute("data-pdf-url");
  if (!url) return;

  // Check for page hash in the main URL
  var pageFromHash = null;
  var hashMatch = window.location.hash.match(/^#page=(\d+)/);
  if (hashMatch) {
    pageFromHash = parseInt(hashMatch[1], 10);
  }

  var loading = document.createElement("div");
  loading.textContent = "Loading PDF\u2026";
  loading.style.cssText = "padding:20px;color:rgba(255,255,255,0.5);font-size:14px;";
  container.appendChild(loading);

  pdfjsLib.getDocument(url).promise.then(function (pdf) {
    pdf.getPage(1).then(function (page) {
      var viewport = page.getViewport({ scale: 1 });
      var aspectRatio = viewport.height / viewport.width;
      var totalPages = pdf.numPages;

      container.removeChild(loading);

      // Create iframe with browser's native PDF renderer
      var iframe = document.createElement("iframe");
      var pdfSrc = url;
      if (pageFromHash) {
        pdfSrc += "#page=" + pageFromHash;
      }
      iframe.src = pdfSrc;
      iframe.style.cssText = "width:100%;border:none;display:block;overflow:hidden;";

      function setHeight() {
        var width = container.clientWidth;
        var pageHeight = width * aspectRatio;
        var totalHeight = pageHeight * totalPages;
        iframe.style.height = Math.ceil(totalHeight) + "px";
      }

      container.appendChild(iframe);
      setHeight();

      // Download link
      var dl = document.createElement("a");
      dl.href = url;
      dl.download = "";
      dl.textContent = "Download PDF";
      dl.style.cssText = "display:inline-block;margin-top:8px;font-size:13px;color:#00e5ff;text-decoration:none;";
      container.appendChild(dl);

      window.addEventListener("resize", setHeight);
    });
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
