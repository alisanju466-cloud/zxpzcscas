
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

let demoBalance = 1000;
let running = false;
let multiplier = 1;
let timer = null;

const balanceEl = document.getElementById("balance");
const multiplierEl = document.getElementById("multiplier");
const planeEl = document.getElementById("plane");
const statusEl = document.getElementById("status");
const playBtn = document.getElementById("play");
const historyEl = document.getElementById("history");

function updateBalance() {
  balanceEl.textContent = demoBalance.toLocaleString("en-IN");
}

function addHistory(value) {
  const item = document.createElement("span");
  item.textContent = value + "  ";
  item.style.color = "#ff7777";
  item.style.marginRight = "12px";
  historyEl.prepend(item);
}

function startRound() {
  if (running) return;

  const bet = Number(document.getElementById("bet").value);

  if (!Number.isSafeInteger(bet) || bet < 1 || bet > 1000) {
    statusEl.textContent = "ENTER A VALID DEMO AMOUNT";
    return;
  }

  if (bet > demoBalance) {
    statusEl.textContent = "NOT ENOUGH DEMO POINTS";
    return;
  }

  demoBalance -= bet;
  updateBalance();

  running = true;
  multiplier = 1;
  let elapsed = 0;

  playBtn.disabled = true;
  playBtn.textContent = "ROUND RUNNING";
  statusEl.textContent = "PLANE IN FLIGHT";

  timer = setInterval(() => {
    elapsed += 0.1;
    multiplier = 1 + elapsed * 0.25;

    multiplierEl.textContent = multiplier.toFixed(2) + "x";
    planeEl.style.left = Math.min(85, 10 + elapsed * 5) + "%";
    planeEl.style.bottom = Math.min(230, 35 + elapsed * 12) + "px";

    if (elapsed >= 8) {
      clearInterval(timer);
      running = false;

      statusEl.textContent = "DEMO ROUND FINISHED";
      addHistory(multiplier.toFixed(2) + "x");

      playBtn.disabled = false;
      playBtn.textContent = "START DEMO ROUND";
    }
  }, 100);
}

playBtn.addEventListener("click", startRound);
updateBalance();
