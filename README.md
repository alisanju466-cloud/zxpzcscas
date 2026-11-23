# ZXPZCS automatic Telegram account linking

This version uses a Telegram Mini App (Web App), not a manual login form.

## Automatic linking
1. The player opens the `Open Website` button sent by @zxpzcsbot.
2. Telegram supplies signed Mini App `initData`.
3. The backend validates its signature with the bot token and rejects data older than 5 minutes.
4. The verified Telegram numeric ID becomes the website account ID.
5. The account page displays the matching profile and its separate virtual-points wallet.

No username, Telegram ID, password, or separate registration is required. The URL must be opened inside Telegram from the bot's Web App button. An ordinary browser cannot automatically identify the Telegram user.

## Deployment
- Deploy this Node.js project to an HTTPS host with persistent storage.
- Set BOT_TOKEN and BOT_API_SECRET as private environment variables; never commit them.
- Set DATABASE_FILE to a persistent disk path.
- Run `npm install` and `npm start`.
- Set the bot domain in BotFather using `/setdomain`.
- Add the Web App button from `bot-snippets/README.txt`.
- Simplest setup: serve frontend and backend on the same HTTPS domain.

## Wallet limitation
This package intentionally does not read or modify the bot's existing `balance_<telegram_id>` property, because the uploaded bot uses that property in payment, deposit, withdrawal and wagering commands. It provides a separate virtual-points wallet only; no betting, wager-loss, cashout, deposits, withdrawals, or conversion to money.

## Security
Keep secrets server-side. Use HTTPS and persistent storage. Rotate any bot token previously exposed in source archives or chats. Before adding sensitive account actions, add secure server sessions, CSRF protection, rate limits, origin restrictions, audit logs and backups.
