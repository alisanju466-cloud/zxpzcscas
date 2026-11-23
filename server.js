
const express = require("express");
const crypto = require("crypto");
const { Pool } = require("pg");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const BOT_TOKEN = process.env.BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;

console.log("BOT_TOKEN present:", Boolean(BOT_TOKEN));
console.log("DATABASE_URL present:", Boolean(DATABASE_URL));

if (!BOT_TOKEN || !DATABASE_URL) {
  console.error("One or more environment variables are missing.");
  process.exit(1);
}
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

function verifyTelegramData(initData) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) return null;

  params.delete("hash");

  const authDate = Number(params.get("auth_date"));
  if (!authDate || Math.abs(Date.now() / 1000 - authDate) > 300) {
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

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  try {
    return JSON.parse(params.get("user") || "null");
  } catch {
    return null;
  }
}

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/login", async (req, res) => {
  try {
    const initData = req.body && req.body.initData;

    if (typeof initData !== "string" || !initData) {
      return res.status(401).json({ error: "Open this app inside Telegram." });
    }

    const user = verifyTelegramData(initData);

    if (!user || !user.id) {
      return res.status(401).json({ error: "Telegram authentication failed." });
    }

    await pool.query(
      `INSERT INTO web_accounts (telegram_id, username, first_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (telegram_id)
       DO UPDATE SET username = EXCLUDED.username,
                     first_name = EXCLUDED.first_name`,
      [String(user.id), user.username || null, user.first_name || null]
    );

    const result = await pool.query(
      `SELECT telegram_id, username, first_name, points
       FROM web_accounts WHERE telegram_id = $1`,
      [String(user.id)]
    );

    res.json({ ok: true, account: result.rows[0] });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ error: "Server error. Please try again." });
  }
});

app.get("/api/account", async (req, res) => {
  res.status(401).json({
    error: "Authenticate through Telegram using /api/login first."
  });
});

const PORT = process.env.PORT || 10000;

initDatabase()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`ZXPZCS WebApp backend running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error("Database initialization failed:", error.message);
    process.exit(1);
  });
