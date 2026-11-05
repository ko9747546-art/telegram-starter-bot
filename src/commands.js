
import { InlineKeyboard, InputFile } from "grammy"
import { createWriteStream } from "node:fs"
import { unlink } from "node:fs/promises"
import { pipeline } from "node:stream/promises"
import { Readable } from "node:stream"
import { tmpdir } from "node:os"
import { join } from "node:path"

export function registerCommands(bot) {
  bot.command("start", async (ctx) => {
    await ctx.reply(
      "မင်္ဂလာပါ။ YeYintStoryBot မှ ကြိုဆိုပါတယ်။ 🎬\n\nဗီဒီယိုတစ်ခု ပေးပို့လိုက်ပါ။ Bot က လက်ခံပြီး ပြန်ပို့ပေးပါမယ်။",
      {
        reply_markup: new InlineKeyboard()
          .text("စမ်းသပ်ရန်", "ping")
          .row()
          .text("အကူအညီ", "help"),
      },
    )
  })

  bot.command("help", (ctx) =>
    ctx.reply(
      "🎬 YeYintStoryBot\n\n" +
      "/start - စတင်ရန်\n" +
      "/help - အကူအညီ\n" +
      "/ping - Bot စမ်းသပ်ရန်\n\n" +
      "ဗီဒီယိုဖိုင် 20 MB အောက် ပေးပို့နိုင်ပါတယ်။",
    ),
  )

  bot.command("ping", (ctx) =>
    ctx.reply("Bot အလုပ်လုပ်နေပါတယ်။ ✅"),
  )

  bot.callbackQuery("ping", async (ctx) => {
    await ctx.answerCallbackQuery({
      text: "Bot အလုပ်လုပ်နေပါတယ်!",
    })
  })

  bot.callbackQuery("help", async (ctx) => {
    await ctx.answerCallbackQuery()
    await ctx.reply("ဗီဒီယိုဖိုင် 20 MB အောက် ပေးပို့ပါ။ 🎬")
  })

  async function processVideo(ctx, fileId, fileSize) {
    if (fileSize > 20 * 1024 * 1024) {
      return ctx.reply(
        "❌ ဗီဒီယိုဖိုင် 20 MB ကျော်နေပါတယ်။ ဖိုင်သေးသေးလေး ပို့ပေးပါ။",
      )
    }

    let path

    try {
      await ctx.reply("⏳ ဗီဒီယိုကို လက်ခံရရှိပါပြီ။ ပြင်ဆင်နေပါတယ်...")

      const file = await ctx.api.getFile(fileId)
      const token =
        process.env.BOT_TOKEN ||
        process.env.TELEGRAM_BOT_TOKEN ||
        process.env.TELEGRAM_TOKEN ||
        process.env.TOKEN

      if (!file.file_path || !token) {
        throw new Error("File path or bot token missing")
      }

      const url =
        `https://api.telegram.org/file/bot${token}/${file.file_path}`

      const response = await fetch(url)

      if (!response.ok || !response.body) {
        throw new Error("Video download failed")
      }

      path = join(tmpdir(), `yeyint-${Date.now()}.mp4`)

      await pipeline(
        Readable.fromWeb(response.body),
        createWriteStream(path),
      )

      await ctx.replyWithVideo(
        new InputFile(path),
        {
          caption: "✅ YeYintStoryBot မှ ဗီဒီယိုကို ပြန်ပို့ပေးလိုက်ပါပြီ။",
        },
      )
    } catch (error) {
      console.error("Video processing error:", error)

      await ctx.reply(
        "❌ ဗီဒီယိုလုပ်ဆောင်မှု မအောင်မြင်ပါ။ နောက်တစ်ကြိမ် စမ်းကြည့်ပါ။",
      )
    } finally {
      if (path) {
        await unlink(path).catch(() => {})
      }
    }
  }

  bot.on("message:video", (ctx) => {
    const video = ctx.message.video
    return processVideo(
      ctx,
      video.file_id,
      video.file_size || 0,
    )
  })

  bot.on("message:document", (ctx) => {
    const file = ctx.message.document

    if (file.mime_type?.startsWith("video/")) {
      return processVideo(
        ctx,
        file.file_id,
        file.file_size || 0,
      )
    }

    return ctx.reply("ဗီဒီယိုဖိုင်ကိုသာ ပေးပို့ပါ။ 🎬")
  })

  bot.on("message:text", (ctx) => {
    return ctx.reply(
      "🎬 ဗီဒီယိုတစ်ခု ပေးပို့ပြီး စတင်နိုင်ပါတယ်။",
    )
  })
        }
