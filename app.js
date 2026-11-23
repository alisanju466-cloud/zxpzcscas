
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

const plane = document.getElementById("plane");
const sky = document.querySelector(".sky");
const multiplierEl = document.getElementById("multiplier");
const statusEl = document.getElementById("status");
const playBtn = document.getElementById("play");
const historyEl = document.getElementById("history");

let running = false;
let multiplier = 1;
let timer = null;
let startTime = 0;
let crashAt = 0;
let bestScore = Number(localStorage.getItem("bestFlightScore") || 0);

const lockBtn = document.createElement("button");
lockBtn.id = "saveScore";
lockBtn.textContent = "SAVE SCORE";
lockBtn.disabled = true;
playBtn.parentNode.appendChild(lockBtn);

function updateMultiplier() {
  multiplierEl.textContent = multiplier.toFixed(2) + "x";
}

function addHistory(value) {
  const item = document.createElement("span");
  item.textContent = value.toFixed(2) + "x";
  historyEl.prepend(item);

  while (historyEl.children.length > 12) {
    historyEl.lastElementChild.remove();
  }
}

function resetFlight() {
  running = false;
  clearInterval(timer);

  multiplier = 1;
  updateMultiplier();

  plane.style.transform = "translate(0, 0)";
  plane.style.opacity = "1";

  statusEl.textContent = "READY FOR TAKEOFF";
  playBtn.disabled = false;
  playBtn.textContent = "START NEW FLIGHT";
  lockBtn.disabled = true;
}

function startFlight() {
  if (running) return;

  running = true;
  multiplier = 1;
  startTime = Date.now();

  // Visual-only random crash point
  crashAt = 1.5 + Math.random() * 8;

  playBtn.disabled = true;
  playBtn.textContent = "FLIGHT RUNNING";
  lockBtn.disabled = false;
  statusEl.textContent = "PLANE IN FLIGHT";

  timer = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;

    multiplier = Math.exp(elapsed * 0.16);
    updateMultiplier();

    const progress = Math.min(elapsed / 12, 1);
    plane.style.transform =
      `translate(${progress * 180}px, ${-progress * 120}px)`;

    if (multiplier >= crashAt) {
      endFlight();
    }
  }, 50);
}

function endFlight() {
  if (!running) return;

  running = false;
  clearInterval(timer);

  addHistory(multiplier);
  statusEl.textContent = "FLIGHT ENDED";

  plane.style.opacity = "0.35";
  playBtn.disabled = false;
  playBtn.textContent = "START NEW FLIGHT";
  lockBtn.disabled = true;
}

function saveScore() {
  if (!running) return;

  const score = multiplier;

  running = false;
  clearInterval(timer);

  addHistory(score);

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("bestFlightScore", bestScore);
  }

  statusEl.textContent =
    `SCORE SAVED: ${score.toFixed(2)}x | BEST: ${bestScore.toFixed(2)}x`;

  playBtn.disabled = false;
  playBtn.textContent = "START NEW FLIGHT";
  lockBtn.disabled = true;
}

playBtn.addEventListener("click", startFlight);
lockBtn.addEventListener("click", saveScore);

resetFlight();
