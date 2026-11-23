require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const path = require('path');
const { BOT_TOKEN, BOT_API_SECRET } = process.env;
if (!BOT_TOKEN || !BOT_API_SECRET) { console.error('Set BOT_TOKEN and BOT_API_SECRET in server environment.'); process.exit(1); }
const db = new Database(process.env.DATABASE_FILE || './data.sqlite');
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS web_accounts (telegram_id TEXT PRIMARY KEY, username TEXT, first_name TEXT, points INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
const app = express();
app.use(express.json({limit:'20kb'}));
app.use(express.static(path.join(__dirname,'public')));
function verifyInitData(initData) {
  if (typeof initData !== 'string' || !initData) return null;
  const p = new URLSearchParams(initData), hash = p.get('hash'), authDate = Number(p.get('auth_date')), now = Math.floor(Date.now()/1000);
  if (!hash || !Number.isFinite(authDate) || now-authDate>300 || authDate>now+30) return null;
  const pairs = [...p.entries()].filter(([k])=>k!=='hash').sort(([a],[b])=>a.localeCompare(b));
  const check = pairs.map(([k,v])=>`${k}=${v}`).join('\n');
  const key = crypto.createHmac('sha256','WebAppData').update(BOT_TOKEN).digest();
  const expected = crypto.createHmac('sha256',key).update(check).digest('hex');
  const a=Buffer.from(expected,'hex'), b=Buffer.from(hash,'hex');
  if(a.length!==b.length || !crypto.timingSafeEqual(a,b)) return null;
  try { const u=JSON.parse(p.get('user')||''); return u && u.id ? u : null; } catch { return null; }
}
function requireBotSecret(req,res,next) {
  const got=Buffer.from(req.get('authorization')||''), expected=Buffer.from(`Bearer ${BOT_API_SECRET}`);
  if(got.length!==expected.length || !crypto.timingSafeEqual(got,expected)) return res.status(401).json({error:'unauthorized'});
  next();
}
function getAccount(id) { return db.prepare('SELECT telegram_id,username,first_name,points FROM web_accounts WHERE telegram_id=?').get(String(id)); }
app.post('/api/auth/telegram-webapp',(req,res)=>{
  const u=verifyInitData(req.body?.initData);
  if(!u) return res.status(401).json({error:'Telegram session invalid or expired. Reopen the site from the bot.'});
  const id=String(u.id);
  db.prepare(`INSERT INTO web_accounts(telegram_id,username,first_name) VALUES(?,?,?) ON CONFLICT(telegram_id) DO UPDATE SET username=excluded.username,first_name=excluded.first_name,updated_at=CURRENT_TIMESTAMP`).run(id,u.username||'',u.first_name||'Telegram user');
  res.json({account:getAccount(id)});
});
// These endpoints manage only a separate virtual-points wallet, not the bot's existing payment/game balance.
app.get('/api/bot/points/:id',requireBotSecret,(req,res)=>{const a=getAccount(req.params.id);res.json({telegram_id:String(req.params.id),points:a?a.points:0});});
app.post('/api/bot/points/:id/adjust',requireBotSecret,(req,res)=>{
  const d=Number(req.body?.delta); if(!Number.isSafeInteger(d)||d===0||Math.abs(d)>1000000) return res.status(400).json({error:'delta must be a non-zero whole number up to 1,000,000'});
  const id=String(req.params.id), a=getAccount(id), n=(a?a.points:0)+d; if(n<0) return res.status(409).json({error:'insufficient virtual points'});
  db.prepare(`INSERT INTO web_accounts(telegram_id,points) VALUES(?,?) ON CONFLICT(telegram_id) DO UPDATE SET points=excluded.points,updated_at=CURRENT_TIMESTAMP`).run(id,n);
  res.json({telegram_id:id,points:n});
});
const port=Number(process.env.PORT||3000); app.listen(port,()=>console.log(`ZXPZCS WebApp backend on ${port}`));
