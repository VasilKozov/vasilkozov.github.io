/*
  AI or Real Painting? Static comparison experiment
  -------------------------------------------------
  1. Replace GOOGLE_SCRIPT_URL with your deployed Google Apps Script Web App URL.
  2. Add your image pairs to the comparisons array.
  3. Put your images in the /images folder of your GitHub repository.
  4. Host the folder on GitHub Pages.
*/

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby3nBka0BzTM4oQuLYLoEQJrEYLVn6CPFh8szxbVfVo_lOCbdobJS-TlMmFpbNblwP0/exec";

/*
  Image pair configuration.

  Naming recommendation:
  images/pair01_real.jpg
  images/pair01_ai.jpg
  images/pair02_real.jpg
  images/pair02_ai.jpg

  The file names are not shown to participants.
  Keep the id stable because it will be stored in the Google Sheet.
*/
const comparisons = [
  {
    id: "pair01",
    real: "images/pair01_real.jpg",
    ai: "images/pair01_ai.jpg"
  },
  {
    id: "pair02",
    real: "images/pair02_real.jpg",
    ai: "images/pair02_ai.jpg"
  },
  {
    id: "pair03",
    real: "images/pair03_real.jpg",
    ai: "images/pair03_ai.jpg"
  }

  // Add more pairs here:
  // ,{
  //   id: "pair04",
  //   real: "images/pair04_real.jpg",
  //   ai: "images/pair04_ai.jpg"
  // }
];

const startScreen = document.getElementById("start-screen");
const comparisonScreen = document.getElementById("comparison-screen");
const endScreen = document.getElementById("end-screen");

const participantForm = document.getElementById("participant-form");
const participantCodeInput = document.getElementById("participant-code");
const progressTitle = document.getElementById("progress-title");
const sessionPill = document.getElementById("session-pill");

const leftImage = document.getElementById("left-image");
const rightImage = document.getElementById("right-image");
const chooseLeftButton = document.getElementById("choose-left");
const chooseRightButton = document.getElementById("choose-right");
const confidenceSelect = document.getElementById("confidence");
const saveStatus = document.getElementById("save-status");

const completedCount = document.getElementById("completed-count");
const correctCount = document.getElementById("correct-count");
const finalMessage = document.getElementById("final-message");
const restartButton = document.getElementById("restart-button");

let participantCode = "";
let sessionId = "";
let randomizedComparisons = [];
let currentIndex = 0;
let currentLayout = null;
let questionStartTime = 0;
let correctAnswers = 0;
let completedAnswers = 0;

participantForm.addEventListener("submit", function (event) {
  event.preventDefault();

  participantCode = participantCodeInput.value.trim();

  if (!participantCode) {
    participantCodeInput.focus();
    return;
  }

  startExperiment();
});

chooseLeftButton.addEventListener("click", function () {
  handleChoice("left");
});

chooseRightButton.addEventListener("click", function () {
  handleChoice("right");
});

restartButton.addEventListener("click", function () {
  window.location.reload();
});

function startExperiment() {
  sessionId = createSessionId();
  randomizedComparisons = shuffleArray([...comparisons]);
  currentIndex = 0;
  correctAnswers = 0;
  completedAnswers = 0;

  sessionPill.textContent = `Participant: ${participantCode} | ${sessionId}`;
  showScreen(comparisonScreen);
  loadCurrentComparison();
}

function loadCurrentComparison() {
  if (currentIndex >= randomizedComparisons.length) {
    finishExperiment();
    return;
  }

  const pair = randomizedComparisons[currentIndex];
  const aiOnLeft = Math.random() < 0.5;

  currentLayout = {
    pairId: pair.id,
    leftImage: aiOnLeft ? pair.ai : pair.real,
    rightImage: aiOnLeft ? pair.real : pair.ai,
    correctSide: aiOnLeft ? "left" : "right"
  };

  progressTitle.textContent = `Pair ${currentIndex + 1} of ${randomizedComparisons.length}`;
  leftImage.src = currentLayout.leftImage;
  rightImage.src = currentLayout.rightImage;
  confidenceSelect.value = "";
  saveStatus.textContent = "";
  saveStatus.className = "save-status";
  setChoiceButtonsDisabled(false);

  questionStartTime = performance.now();
}

async function handleChoice(userChoice) {
  if (!currentLayout) return;

  setChoiceButtonsDisabled(true);
  saveStatus.textContent = "Saving response...";
  saveStatus.className = "save-status";

  const responseTimeMs = Math.round(performance.now() - questionStartTime);
  const isCorrect = userChoice === currentLayout.correctSide;

  const responseData = {
    timestampClient: new Date().toISOString(),
    sessionId: sessionId,
    participantCode: participantCode,
    pairId: currentLayout.pairId,
    leftImage: currentLayout.leftImage,
    rightImage: currentLayout.rightImage,
    correctSide: currentLayout.correctSide,
    userChoice: userChoice,
    isCorrect: isCorrect,
    confidence: confidenceSelect.value,
    responseTimeMs: responseTimeMs,
    userAgent: navigator.userAgent
  };

  const saved = await saveResponse(responseData);

  completedAnswers += 1;
  if (isCorrect) correctAnswers += 1;

  if (saved) {
    saveStatus.textContent = "Response saved.";
    saveStatus.className = "save-status success";
  } else {
    saveStatus.textContent = "Response was stored locally, but the Google Sheet submission may have failed. Check the Apps Script URL.";
    saveStatus.className = "save-status error";
    storeFailedResponseLocally(responseData);
  }

  setTimeout(function () {
    currentIndex += 1;
    loadCurrentComparison();
  }, 550);
}

async function saveResponse(responseData) {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_YOUR")) {
    console.warn("Google Apps Script URL is not configured. Response:", responseData);
    return false;
  }

  try {
    /*
      mode: "no-cors" is used because a simple Google Apps Script Web App often does not return
      CORS headers readable by the browser. The request is still sent to Google Sheets.
      Because of no-cors, the browser cannot verify the response body.
    */
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(responseData)
    });

    return true;
  } catch (error) {
    console.error("Failed to submit response:", error);
    return false;
  }
}

function finishExperiment() {
  completedCount.textContent = String(completedAnswers);
  correctCount.textContent = String(correctAnswers);
  finalMessage.textContent = "Your responses have been recorded. Thank you for participating in the study.";
  showScreen(endScreen);
}

function showScreen(screenToShow) {
  [startScreen, comparisonScreen, endScreen].forEach(function (screen) {
    screen.classList.remove("active-screen");
  });

  screenToShow.classList.add("active-screen");
}

function setChoiceButtonsDisabled(isDisabled) {
  chooseLeftButton.disabled = isDisabled;
  chooseRightButton.disabled = isDisabled;
}

function createSessionId() {
  const randomPart = Math.random().toString(36).slice(2, 10).toUpperCase();
  const timePart = Date.now().toString(36).toUpperCase();
  return `S-${timePart}-${randomPart}`;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

function storeFailedResponseLocally(responseData) {
  const key = "failed_ai_image_study_responses";
  const previous = JSON.parse(localStorage.getItem(key) || "[]");
  previous.push(responseData);
  localStorage.setItem(key, JSON.stringify(previous));
}
