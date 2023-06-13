// Show the file management when the Files button is clicked
document.getElementById('file-button').addEventListener('click', function() {
    document.getElementById('file-management').classList.add('active');
});

// Hide the file management when the Files button is clicked again
document.getElementById('file-management-close').addEventListener('click', function() {
    document.getElementById('file-management').classList.remove('active');
});

function updateSpeed(){
  var speed = document.getElementById("speed-range").value;
  document.getElementById("speed-value").innerText = speed;
}

function updatePitch(){
  var pitch = document.getElementById("pitch-range").value;
  document.getElementById("pitch-value").innerText = pitch;
}

function updateProgressBar(){
  var progressBar = document.getElementById("file-progress");
  var value = Math.round((pageNum / pdf.numPages) * 100);
  progressBar.value = value;
}

function prevSlide() {
  if (pageNum > 1) {
    pageNum--;
    renderPage(pageNum);
    displayGuideText(pageNum);
  }
  updateProgressBar();
};

function nextSlide() {
  if (pageNum < pdf.numPages) {
    pageNum++;
    renderPage(pageNum);
    displayGuideText(pageNum);
    stopVoice();
  }
  updateProgressBar();
};

function displayGuideText(num) {
  // TODO: Display the guide text for the current slide
  var slideText = guideText["slide " + num];
  document.querySelector("#guide-text p").innerText = slideText;
  stopVoice();
}

document.getElementById("prev-slide").addEventListener("click", function () {
    prevSlide();
  });
  
document.getElementById("next-slide").addEventListener("click", function () {
    nextSlide();
  });

document.addEventListener('keydown', function(event) {
  switch (event.key) {
    case 'ArrowLeft':
      prevSlide();
      break;
    case 'ArrowRight':
      nextSlide();
      break;
    case ' ':
      toggleVoice();
      break;
    default:
      break;
  }
});




