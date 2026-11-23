
const express = require("express");
const crypto = require("crypto");
const { Pool } = require("pg");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: "32kb" }));

// Website files
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/app.js", (req, res) => {
  res.sendFile(path.join(__dirname, "app.js"));
});

app.get("/style.css", (req, res) => {
  res.sendFile(path.join(__dirname, "style.css"));
});

// Environment variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;
const BOT_API_SECRET = process.env.BOT_API_SECRET;

console.log("BOT_TOKEN present:", Boolean(BOT_TOKEN));
console.log("DATABASE_URL present:", Boolean(DATABASE_URL));
console.log("BOT_API_SECRET present:", Boolean(BOT_API_SECRET));

if (!BOT_TOKEN || !DATABASE_URL) {
  console.error("Missing BOT_TOKEN or DATABASE_URL.");
  process.exit(1);
}

// Database
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS web_accounts (
      telegram_id BIGINT PRIMARY KEY,
      username TEXT,
      first_name TEXT,
      points BIGINT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

// Telegram Mini App verification
function verifyTelegramData(initData) {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");

    if (!hash) return null;

    params.delete("hash");

    const authDate = Number(params.get("auth_date"));

    if (
      !authDate ||
      Math.abs(Date.now() / 1000 - authDate) > 300
    ) {
      return null;
    }

    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(BOT_TOKEN)
      .digest();

    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    const a = Buffer.from(calculatedHash, "hex");
    const b = Buffer.from(hash, "hex");

    if (
      a.length !== b.length ||
      !crypto.timingSafeEqual(a, b)
    ) {
      return null;
    }

    return JSON.parse(params.get("user") || "null");
  } catch {
    return null;
  }
}

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Telegram login
app.post("/api/login", async (req, res) => {
  try {
    const initData = req.body?.initData;

    if (typeof initData !== "string" || !initData) {
      return res.status(401).json({
        error: "Open this app inside Telegram."
      });
    }

    const user = verifyTelegramData(initData);

    if (!user || !user.id) {
      return res.status(401).json({
        error: "Telegram authentication failed."
      });
    }

    await pool.query(
      `INSERT INTO web_accounts
       (telegram_id, username, first_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (telegram_id)
       DO UPDATE SET
         username = EXCLUDED.username,
         first_name = EXCLUDED.first_name`,
      [
        String(user.id),
        user.username || null,
        user.first_name || null
      ]
    );

    const result = await pool.query(
      `SELECT telegram_id, username, first_name, points
       FROM web_accounts
       WHERE telegram_id = $1`,
      [String(user.id)]
    );

    res.json({
      ok: true,
      account: result.rows[0]
    });

  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      error: "Server error. Please try again."
    });
  }
});

// Account endpoint
app.get("/api/account", (req, res) => {
  res.status(401).json({
    error: "Authenticate through Telegram using /api/login first."
  });
});

// Separate virtual-points API
app.post("/api/bot/points", async (req, res) => {
  try {
    const suppliedSecret = req.headers["x-bot-secret"];

    if (
      !BOT_API_SECRET ||
      suppliedSecret !== BOT_API_SECRET
    ) {
      return res.status(401).json({
        error: "Unauthorized"
      });
    }

    const { action, telegram_id, amount } = req.body || {};

    if (!/^\d+$/.test(String(telegram_id || ""))) {
      return res.status(400).json({
        error: "Invalid Telegram ID"
      });
    }

    const id = String(telegram_id);

    if (action === "get") {
      const result = await pool.query(
        `SELECT telegram_id, points
         FROM web_accounts
         WHERE telegram_id = $1`,
        [id]
      );

      return res.json({
        ok: true,
        points: result.rows[0]?.points ?? 0
      });
    }

    if (!["add", "remove"].includes(action)) {
      return res.status(400).json({
        error: "Invalid action"
      });
    }

    const value = Number(amount);

    if (
      !Number.isSafeInteger(value) ||
      value < 1 ||
      value > 1000000
    ) {
      return res.status(400).json({
        error: "Invalid amount"
      });
    }

    const change = action === "add" ? value : -value;

    const result = await pool.query(
      `INSERT INTO web_accounts (telegram_id, points)
       VALUES ($1, GREATEST(0, $2))
       ON CONFLICT (telegram_id)
       DO UPDATE SET
         points = GREATEST(0, web_accounts.points + $2)
       RETURNING telegram_id, points`,
      [id, change]
    );

    res.json({
      ok: true,
      account: result.rows[0]
    });

  } catch (error) {
    console.error("Virtual-points API error:", error.message);
    res.status(500).json({
      error: "Server error"
    });
  }
});

// Start server after database initialization
async function startServer() {
  try {
    await initDatabase();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`ZXPZCS backend running on port ${PORT}`);
    });

  } catch (error) {
    console.error(
      "Database initialization failed:",
      error.message
    );
    process.exit(1);
  }
}

startServer();
