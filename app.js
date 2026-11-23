
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
let locked = false;
let multiplier = 1;
let elapsed = 0;
let timer = null;
let crashAt = 1;

const history = [];

function resetFlight() {
  plane.textContent = "🚀";
  plane.style.left = "8%";
  plane.style.bottom = "35px";
  sky.classList.remove("explosion");
}

function addHistory(value) {
  history.unshift(value);
  history.splice(10);

  historyEl.replaceChildren();

  history.forEach(value => {
    const item = document.createElement("span");
    item.className = "history-item";
    item.textContent = value;
    historyEl.appendChild(item);
  });
}

function startFlight() {
  if (running) return;

  running = true;
  locked = false;
  elapsed = 0;
  multiplier = 1;

  crashAt = 1.5 + Math.random() * 12;

  resetFlight();

  multiplierEl.textContent = "1.00x";
  statusEl.textContent = "ROCKET LAUNCHING";

  playBtn.disabled = true;
  playBtn.textContent = "FLIGHT RUNNING";

  timer = setInterval(() => {
    elapsed += 0.1;

    multiplier = 1 + elapsed * 0.25 +
      elapsed * elapsed * 0.025;

    multiplierEl.textContent =
      multiplier.toFixed(2) + "x";

    plane.style.left =
      Math.min(82, 8 + elapsed * 6) + "%";

    plane.style.bottom =
      Math.min(280, 35 + elapsed * 22) + "px";

    statusEl.textContent =
      "FLYING • " + multiplier.toFixed(2) + "x";

    if (multiplier >= crashAt) {
      endFlight();
    }
  }, 100);
}

function endFlight() {
  clearInterval(timer);
  running = false;

  sky.classList.add("explosion");
  plane.textContent = "💥";

  statusEl.textContent = "FLIGHT ENDED";

  addHistory(multiplier.toFixed(2) + "x");

  playBtn.disabled = false;
  playBtn.textContent = "START NEW FLIGHT";
}

function lockScore() {
  if (!running || locked) return;

  locked = true;
  clearInterval(timer);
  running = false;

  addHistory("Saved " + multiplier.toFixed(2) + "x");

  statusEl.textContent =
    "SCORE SAVED: " + multiplier.toFixed(2) + "x";

  playBtn.disabled = false;
  playBtn.textContent = "START NEW FLIGHT";
}

playBtn.addEventListener("click", startFlight);

const lockBtn = document.createElement("button");
lockBtn.className = "lock";
lockBtn.textContent = "SAVE FLIGHT SCORE";
lockBtn.disabled = true;

playBtn.parentNode.appendChild(lockBtn);

lockBtn.addEventListener("click", lockScore);

setInterval(() => {
  lockBtn.disabled = !running;
}, 100);

resetFlight();
