var pdf; // The PDF document
var pageNum = 1; // The current page number
var guideText; // The guide text for each slide

function openFile(folderName, fileName) {
  pageNum = 1;
  document.getElementById("file-management").classList.remove("active");

  var transaction = db.transaction(["files"]);
  var store = transaction.objectStore("files");

  // Get the PDF and its corresponding guide
  var pdfRequest = store.get([folderName, fileName]);
  var guideRequest = store.get([folderName, fileName.slice(0,fileName.length-4) + "_GUIDE.pdf"]);

  pdfjsLib.GlobalWorkerOptions.workerSrc = "pdfjs/build/pdf.worker.js";

  pdfRequest.onsuccess = function () {
    var fileReader = new FileReader();
    fileReader.onload = function () {
      var arrayBuffer = this.result;
      pdfjsLib
        .getDocument({ data: arrayBuffer })
        .promise.then(function (pdfDoc_) {
          pdf = pdfDoc_;
          renderPage(pageNum);
        });
    };
    fileReader.readAsArrayBuffer(pdfRequest.result);
  };

  guideRequest.onsuccess = function() {
    var fileReader = new FileReader();
    fileReader.onload = function() {
        var arrayBuffer = this.result;
        pdfjsLib.getDocument({data: arrayBuffer}).promise.then(function(guideDoc) {
            var totalPages = guideDoc.numPages;
            var allPromises = [];
            for (var i = 1; i <= totalPages; i++) {
                var promise = guideDoc.getPage(i).then(function(page) {
                    return page.getTextContent().then(function(textContent) {
                        return textContent.items.map(function(item) {
                            return item.str;
                        }).join(' ');
                    });
                });
                allPromises.push(promise);
            }
            Promise.all(allPromises).then(function(allTexts) {
                guideText = splitGuideIntoSlides(allTexts.join('\n'));
                displayGuideText(pageNum);
            });
        });
    };
    fileReader.readAsArrayBuffer(guideRequest.result);
};


}

function renderPage(num) {
  pdf.getPage(num).then(function (page) {
    var scale = 1;
    var viewport = page.getViewport({ scale: scale });

    // Prepare canvas using PDF page dimensions
    var canvas = document.getElementById("pdf-canvas");
    var context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render PDF page into canvas context
    var renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    var renderTask = page.render(renderContext);

    // Wait for rendering to finish
    renderTask.promise
      .then(function () {
        return page.getTextContent();
      })
      .then(function (textContent) {
        // Create a separate div for the text layer
        var textLayerDiv = document.getElementById("text-layer");
        textLayerDiv.style.height = canvas.style.height;
        textLayerDiv.style.width = canvas.style.width;
        textLayerDiv.style.top = canvas.style.top;
        textLayerDiv.style.left = canvas.style.left;

        // Set the scale factor
        textLayerDiv.style.setProperty("--scale-factor", scale);

        // Prepare the text layer div by removing all its children
        while (textLayerDiv.firstChild) {
          textLayerDiv.firstChild.remove();
        }

        // Render the text layer
        return pdfjsLib.renderTextLayer({
          textContent: textContent,
          container: textLayerDiv,
          viewport: viewport,
          enhanceTextSelection: true,
        });
      })
      .then(function () {
        // console.log("Text layer rendered");
      });
  });
  updateProgressBar();
}

function splitGuideIntoSlides(guide) {
  var slides = {};
  var slideNumberPattern = /[Ss]lide:* \d+/gi; // [Ss]lide:* \d+
  var slideNumbers = guide.match(slideNumberPattern);

  for (var i = 0; i < slideNumbers.length - 1; i++) {
    var start = guide.indexOf(slideNumbers[i]);
    var end = guide.indexOf(slideNumbers[i + 1]);
    slides[slideNumbers[i].match(/\d+/)[0]] = guide.substring(start, end).replace(slideNumbers[i], '').trim();
  }

  // Add the last slide
  slides[slideNumbers[slideNumbers.length - 1].match(/\d+/)[0]] = guide.substring(guide.indexOf(slideNumbers[slideNumbers.length - 1])).replace(slideNumbers[slideNumbers.length - 1], '').trim();

  return slides;
}
