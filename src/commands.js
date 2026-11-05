
import { InlineKeyboard } from "grammy"

export function registerCommands(bot) {
  bot.command("start", (ctx) =>
    ctx.reply(
      "မင်္ဂလာပါ။ YeYintStoryBot မှ ကြိုဆိုပါတယ်။ 🎬\n\nဗီဒီယိုတစ်ခု ပေးပို့ပြီး စတင်အသုံးပြုနိုင်ပါပြီ။",
      {
        reply_markup: new InlineKeyboard().text("စမ်းသပ်ရန်", "ping"),
      },
    ),
  )

  bot.command("help", (ctx) =>
    ctx.reply(
      "🎬 YeYintStoryBot\n\n/start - စတင်ရန်\n/help - အကူအညီ\n/ping - Bot စမ်းသပ်ရန်\n\nဗီဒီယိုပေးပို့နိုင်ပါတယ်။",
    ),
  )

  bot.command("ping", (ctx) => ctx.reply("Bot အလုပ်လုပ်နေပါတယ်။ ✅"))

  bot.callbackQuery("ping", (ctx) =>
    ctx.answerCallbackQuery({ text: "Bot အလုပ်လုပ်နေပါတယ်!" }),
  )

  bot.on("message:video", (ctx) =>
    ctx.reply("🎬 ဗီဒီယိုကို လက်ခံရရှိပါပြီ။ နောက်တစ်ဆင့် ပြင်ဆင်ပေးပါမယ်။"),
  )

  bot.on("message:document", (ctx) => {
    const file = ctx.message.document

    if (file.mime_type?.startsWith("video/")) {
      return ctx.reply("🎬 ဗီဒီယိုဖိုင်ကို လက်ခံရရှိပါပြီ။")
    }
  })

  bot.on("message:text", (ctx) => ctx.reply(ctx.message.text))
}
