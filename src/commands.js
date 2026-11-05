
import { InlineKeyboard } from "grammy"
import { createWriteStream } from "node:fs"
import { unlink } from "node:fs/promises"
import { pipeline } from "node:stream/promises"
import { Readable } from "node:stream"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { promisify } from "node:util"
import { execFile } from "node:child_process"
import ffmpegPath from "ffmpeg-static"

const execFileAsync = promisify(execFile)

export function registerCommands(bot) {
  bot.command("start", async (ctx) => {
    await ctx.reply(
      "မင်္ဂလာပါ။ YeYintStoryBot မှ ကြိုဆိုပါတယ်။ 🎬\n\nဗီဒီယိုတစ်ခု ပေးပို့ပါ။ အသံကို စာသားပြောင်းပေးပါမယ်။",
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
      "ဗီဒီယိုဖိုင် 20 MB အောက် ပေးပို့ပါ။",
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
      return ctx.reply("❌ ဗီဒီယိုဖိုင် 20 MB ကျော်နေပါတယ်။")
    }

    const videoPath = join(tmpdir(), `video-${Date.now()}.mp4`)
    const audioPath = join(tmpdir(), `audio-${Date.now()}.mp3`)

    try {
      await ctx.reply("⏳ ဗီဒီယိုကို လက်ခံရရှိပါပြီ။ အသံခွဲထုတ်နေပါတယ်...")

      const token =
        process.env.BOT_TOKEN ||
        process.env.TELEGRAM_BOT_TOKEN ||
        process.env.TELEGRAM_TOKEN ||
        process.env.TOKEN

      const whisperUrl = process.env.WHISPER_API_URL

      if (!token || !whisperUrl) {
        throw new Error("Bot token or Whisper URL missing")
      }

      if (!ffmpegPath) {
        throw new Error("FFmpeg binary is unavailable")
      }

      const file = await ctx.api.getFile(fileId)

      if (!file.file_path) {
        throw new Error("Telegram file path missing")
      }

      const downloadUrl =
        `https://api.telegram.org/file/bot${token}/${file.file_path}`

      const response = await fetch(downloadUrl)

      if (!response.ok || !response.body) {
        throw new Error("Video download failed")
      }

      await pipeline(
        Readable.fromWeb(response.body),
        createWriteStream(videoPath),
      )

      await ctx.reply("🎧 အသံကို စာသားပြောင်းနေပါတယ်။ ခဏစောင့်ပေးပါ...")

      await execFileAsync(ffmpegPath, [
        "-y",
        "-i", videoPath,
        "-vn",
        "-ac", "1",
        "-ar", "16000",
        "-b:a", "64k",
        audioPath,
      ])

      const audioBuffer = await import("node:fs/promises")
        .then((fs) => fs.readFile(audioPath))

      const whisperResponse = await fetch(whisperUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
        },
        body: audioBuffer,
      })

      const result = await whisperResponse.json()

      if (!whisperResponse.ok || result.success === false) {
        throw new Error(result.error || "Whisper transcription failed")
      }

      const transcript =
        result.result?.text ||
        result.text ||
        ""

      if (!transcript.trim()) {
        return ctx.reply("❌ အသံထဲမှ စာသားမရရှိပါ။")
      }

      await ctx.reply("✅ အသံမှ စာသားရရှိပါပြီ။")

      const chunks = transcript.match(/[\s\S]{1,3500}/g) || []

      for (const chunk of chunks) {
        await ctx.reply(chunk)
      }

    } catch (error) {
      console.error("Video processing error:", error)

      await ctx.reply(
        "❌ လုပ်ဆောင်မှု မအောင်မြင်ပါ။ Logs ကို စစ်ဆေးရန် လိုအပ်ပါတယ်။",
      )
    } finally {
      await Promise.all([
        unlink(videoPath).catch(() => {}),
        unlink(audioPath).catch(() => {}),
      ])
    }
  }

  bot.on("message:video", (ctx) => {
    const video = ctx.message.video
    return processVideo(ctx, video.file_id, video.file_size || 0)
  })

  bot.on("message:document", (ctx) => {
    const file = ctx.message.document

    if (file.mime_type?.startsWith("video/")) {
      return processVideo(ctx, file.file_id, file.file_size || 0)
    }

    return ctx.reply("ဗီဒီယိုဖိုင်ကိုသာ ပေးပို့ပါ။ 🎬")
  })

  bot.on("message:text", (ctx) => {
    return ctx.reply("🎬 ဗီဒီယိုတစ်ခု ပေးပို့ပြီး စတင်နိုင်ပါတယ်။")
  })
      }
