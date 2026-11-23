
const statusEl = document.getElementById("status");
const profile = document.getElementById("profile");

function status(message) {
  statusEl.textContent = message;
}

function showAccount(account) {
  document.getElementById("name").textContent =
    account.first_name || "Telegram user";

  document.getElementById("handle").textContent =
    account.username
      ? "@" + account.username
      : "Telegram account";

  document.getElementById("points").textContent =
    Number(account.points || 0).toLocaleString();

  profile.classList.remove("hidden");
  status("Your Telegram account is successfully linked!");
}

async function autoLink() {
  const tg = window.Telegram?.WebApp;

  if (!tg || !tg.initData) {
    status("Open this website using the Telegram bot's Web App button.");
    return;
  }

  tg.ready();
  tg.expand();

  status("Verifying your Telegram account...");

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        initData: tg.initData
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Account linking failed.");
    }

    showAccount(result.account);

  } catch (error) {
    status(error.message || "Unable to connect. Please try again.");
  }
}

autoLink();
