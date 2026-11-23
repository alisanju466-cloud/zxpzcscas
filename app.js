
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

const sky = document.querySelector(".sky");
const plane = document.getElementById("plane");
const multiplierEl = document.getElementById("multiplier");
const statusEl = document.getElementById("status");
const playBtn = document.getElementById("play");
const historyEl = document.getElementById("history");

let running = false;
let locked = false;
let multiplier = 1;
let elapsed = 0;
let crashAt = 1;
let timer = null;
let lockBtn = null;

function setupClouds() {
  ["one", "two"].forEach(name => {
    const cloud = document.createElement("div");
    cloud.className = "cloud " + name;
    sky.appendChild(cloud);
  });
}

function resetPlane() {
  plane.style.left = "10%";
  plane.style.bottom = "35px";
  plane.textContent = "✈️";
  sky.classList.remove("explosion");
}

function addHistory(value) {
  const item = document.createElement("span");
  item.className = "history-item";
  item.textContent = value;
  historyEl.prepend(item);

  while (historyEl.children.length > 12) {
    historyEl.lastElementChild.remove();
  }
}

function finishFlight() {
  clearInterval(timer);
  running = false;

  sky.classList.add("explosion");
  plane.textContent = "💥";
  statusEl.textContent = "FLIGHT ENDED";

  if (!locked) {
    addHistory("Ended at " + multiplier.toFixed(2) + "x");
  }

  playBtn.disabled = false;
  playBtn.textContent = "START NEW FLIGHT";
  lockBtn.disabled = true;
}

function startFlight() {
  if (running) return;

  running = true;
  locked = false;
  elapsed = 0;
  multiplier = 1;

  // Random visual ending point for the demo.
  crashAt = 1.5 + Math.random() * 7;

  multiplierEl.textContent = "1.00x";
  statusEl.textContent = "PLANE TAKING OFF";

  resetPlane();

  playBtn.disabled = true;
  playBtn.textContent = "FLIGHT RUNNING";

  lockBtn.disabled = false;
  lockBtn.textContent = "LOCK SCORE";

  timer = setInterval(() => {
    elapsed += 0.1;

    multiplier = 1 + elapsed * 0.22 + elapsed * elapsed * 0.018;

    multiplierEl.textContent = multiplier.toFixed(2) + "x";

    const progress = Math.min(elapsed / 9, 1);

    plane.style.left = Math.min(82, 10 + elapsed * 7) + "%";
    plane.style.bottom = Math.min(275, 35 + elapsed * 24) + "px";

    statusEl.textContent = "IN FLIGHT • " + multiplier.toFixed(2) + "x";

    if (multiplier >= crashAt) {
      finishFlight();
    }
  }, 100);
}

function lockScore() {
  if (!running || locked) return;

  locked = true;
  clearInterval(timer);
  running = false;

  addHistory("Locked " + multiplier.toFixed(2) + "x");

  statusEl.textContent = "SCORE LOCKED: " + multiplier.toFixed(2) + "x";
  playBtn.disabled = false;
  playBtn.textContent = "START NEW FLIGHT";
  lockBtn.disabled = true;
}

playBtn.addEventListener("click", startFlight);

lockBtn = document.createElement("button");
lockBtn.className = "lock";
lockBtn.textContent = "LOCK SCORE";
lockBtn.disabled = true;
lockBtn.addEventListener("click", lockScore);

playBtn.parentNode.appendChild(lockBtn);

setupClouds();
resetPlane();

playBtn.addEventListener("click", startRound);
updateBalance();
