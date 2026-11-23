Add this button in a private-chat bot command. Replace the URL with your deployed HTTPS backend URL. Telegram supplies the signed user identity automatically when opened inside Telegram; no manual account linking is needed.

Api.sendMessage({
  chat_id: user.telegramid,
  text: "Open your ZXPZCS account:",
  reply_markup: {
    inline_keyboard: [[
      { text: "🌐 Open Website", web_app: { url: "https://YOUR-HTTPS-DOMAIN" } }
    ]]
  }
});

If your TelebotHost wrapper does not support `web_app`, use its supported Bot API method to send the same inline keyboard. Never put BOT_TOKEN or BOT_API_SECRET in browser JavaScript.
