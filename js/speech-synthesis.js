window.speechSynthesis.onvoiceschanged = function () {
  var voices = window.speechSynthesis.getVoices();
  var englishVoices = voices.filter((voice) => voice.lang.includes("en"));
  var voiceSelect = document.getElementById("voice-select");

  englishVoices.forEach((voice, index) => {
    var option = document.createElement("option");
    option.textContent = voice.name;
    option.value = index;
    voiceSelect.appendChild(option);
  });
};

var isPaused = false; // Flag to track the pause status

function playVoice() {
  if (isPaused) {
    console.log("resuming");
    // Manually resume playback by creating a new utterance and speaking it
    isPaused = false; // Set the flag to false to indicate resumption
    speechSynthesis.resume();
  } else {
    console.log("playing");
    // Play from the beginning if not already paused
    textForVoice = document.getElementById("guide-text").innerText;
    let speed = document.getElementById("speed-range").value;
    let pitch = document.getElementById("pitch-range").value;
    var englishVoices = window.speechSynthesis
      .getVoices()
      .filter((voice) => voice.lang.includes("en"));
    var voiceSelect = document.getElementById("voice-select");
    var selectedVoice = voiceSelect.options[voiceSelect.selectedIndex].value;
    var utterance = new SpeechSynthesisUtterance(textForVoice);
    console.log(speed, pitch, selectedVoice)
    utterance.rate = speed;
    utterance.pitch = pitch;
    utterance.voice = englishVoices[selectedVoice];
    window.speechSynthesis.speak(utterance);
  }
}

function pauseVoice() {
  window.speechSynthesis.pause();
  isPaused = true; // Set the flag to true when paused
}

function stopVoice() {
  window.speechSynthesis.cancel();
  isPaused = false; // Set the flag to false when stopped
}

function toggleVoice() {
  if (window.speechSynthesis.speaking) {
    pauseVoice();
  } else {
    playVoice();
  }
}

document.getElementById("pause-voice").addEventListener("click", function () {
  pauseVoice();
});

document.getElementById("stop-voice").addEventListener("click", function () {
  stopVoice();
});

document.getElementById("play-voice").addEventListener("click", function () {
  playVoice();
});

