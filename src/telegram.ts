import { Telegraf } from "telegraf";
import HttpsProxyAgent from "https-proxy-agent";

const proxyUrl = process.env.HTTPS_PROXY;

let telegramBot: Telegraf | undefined;
if (proxyUrl) {
  telegramBot =
    // optionally use telegram bot if token and chat id are available
    process.env.TELEGRAM_TOKEN && process.env.TELEGRAM_CHAT_ID
      ? new Telegraf(process.env.TELEGRAM_TOKEN, {
          telegram: {
            agent: HttpsProxyAgent(proxyUrl),
          },
        })
      : undefined;
} else {
  telegramBot =
    // optionally use telegram bot if token and chat id are available
    process.env.TELEGRAM_TOKEN && process.env.TELEGRAM_CHAT_ID
      ? new Telegraf(process.env.TELEGRAM_TOKEN)
      : undefined;
}

// you might use this snippet to get you chat id
// bot.on("text", (ctx) => {
//   console.log("chat from id ", ctx.message.chat.id);
//   const chatId = ctx.telegram.sendMessage(ctx.message.chat.id, `Hello ${ctx.message.chat.id}`);
// });

if (telegramBot) telegramBot.launch();

export function sendTelegramMessage(message: string) {
  if (!telegramBot) return;

  // Multiple ChatIds have to be seperated by comma
  // Example: TELEGRAM_CHAT_ID=xxxxxxxx, yyyyyyyy
  const chatString = process.env.TELEGRAM_CHAT_ID || "";
  const chats = chatString.split(",");
  for (let chatid of chats) {
    telegramBot.telegram.sendMessage(chatid.trim(), message);
  }
}
