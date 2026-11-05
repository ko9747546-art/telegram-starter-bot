import { InlineKeyboard } from "grammy"
import { createWriteStream } from "node:fs"
import { pipeline } from "node:stream/promises"
import { Readable } from "node:stream"
import { tmpdir } from "node:os"
import { join } from "node:path"

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

  async function saveVideo(ctx, fileId, fileSize) {
    if (fileSize > 20 * 1024 * 1024) {
      return ctx.reply("ဗီဒီယိုဖိုင်က 20 MB ကျော်နေပါတယ်။ သေးငယ်တဲ့ဖိုင် ပို့ပေးပါ။")
    }

    try {
      const file = await ctx.api.getFile(fileId)
      const token = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN

      if (!file.file_path || !token) {
        throw new Error("File path or bot token missing")
      }

      const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`
      const response = await fetch(url)

      if (!response.ok || !response.body) {
        throw new Error("Download failed")
      }

      const path = join(tmpdir(), `video-${Date.now()}.mp4`)
      await pipeline(
        Readable.fromWeb(response.body),
        createWriteStream(path),
      )

      return ctx.reply("✅ ဗီဒီယိုကို Download လုပ်ပြီး ယာယီသိမ်းဆည်းပြီးပါပြီ။")
    } catch (error) {
      console.error("Video download failed:", error.message)
      return ctx.reply("❌ ဗီဒီယို Download မအောင်မြင်ပါ။ ထပ်စမ်းကြည့်ပါ။")
    }
  }

  bot.on("message:video", (ctx) => {
    const video = ctx.message.video
    return saveVideo(ctx, video.file_id, video.file_size || 0)
  })

  bot.on("message:document", (ctx) => {
    const file = ctx.message.document

    if (file.mime_type?.startsWith("video/")) {
      return saveVideo(ctx, file.file_id, file.file_size || 0)
    }
  })

  bot.on("message:text", (ctx) => ctx.reply(ctx.message.text))
        }
