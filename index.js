require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const Canvas = require("canvas");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const PREFIX = "mv!";
const userData = new Map();

client.once("ready", () => {
  console.log(`✅ Đăng nhập thành công: ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: "Mysvale", type: 0 }],
    status: "online",
  });

  // reset daily vào đúng 0h
  setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      userData.forEach((data) => {
        data.checkedInToday = false;
        data.messagesSentToday = 0;
      });
      console.log("🔄 Reset daily thành công!");
    }
  }, 60 * 1000);
});

// Hàm tiện ích vẽ bo góc
function roundRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const userId = message.author.id;
  if (!userData.has(userId)) {
    userData.set(userId, {
      streak: 0,
      lastCheckin: null,
      messagesSentToday: 0,
      checkedInToday: false,
    });
  }

  const data = userData.get(userId);

  if (!data.checkedInToday) {
    data.messagesSentToday++;

    const requiredMessages = 5 * (data.streak + 1);

    if (data.messagesSentToday >= requiredMessages) {
      data.streak++;
      data.checkedInToday = true;
      data.lastCheckin = new Date().toDateString();

      try {
        const member = await message.guild.members.fetch(userId);
        const baseName = member.nickname || message.author.username;

        const cleanedName = baseName.replace(/ 🔥\d+$/, "");
        const newName = `${cleanedName} 🔥${data.streak}`;

        await member.setNickname(newName);

        // --- TẠO ẢNH CHECK-IN KIỂU STREAK ---
        const canvas = Canvas.createCanvas(1000, 400);
        const ctx = canvas.getContext("2d");

        // Nền gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#1e1e1e");
        gradient.addColorStop(1, "#3b0a0a");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Icon lửa
        ctx.fillStyle = "#ff9500";
        ctx.font = "80px sans-serif";
        ctx.fillText("🔥", 60, 120);

        // Streak text
        ctx.fillStyle = "#ffffff";
        ctx.font = "40px sans-serif";
        ctx.fillText(`${data.streak} days`, 150, 100);

        ctx.font = "24px sans-serif";
        ctx.fillText("Active", 150, 140);

        // Progress bar
        const progressWidth = 600;
        const progressHeight = 40;
        const progressX = 300;
        const progressY = 80;
        const progress = Math.min(data.messagesSentToday / requiredMessages, 1);

        ctx.fillStyle = "#444";
        roundRect(ctx, progressX, progressY, progressWidth, progressHeight, 20);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        roundRect(ctx, progressX, progressY, progressWidth * progress, progressHeight, 20);
        ctx.fill();

        ctx.font = "28px sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`${data.messagesSentToday} / ${requiredMessages} messages to streak`, progressX, progressY - 15);

        // Calendar mini
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const today = new Date().getDay();
        const startX = 300;
        const startY = 180;

        ctx.font = "22px sans-serif";

        days.forEach((day, i) => {
          ctx.fillStyle = "#ffffff";
          ctx.fillText(day, startX + i * 80, startY);

          if (i === today && data.checkedInToday) {
            ctx.fillStyle = "#00ff00"; // tick xanh
            ctx.fillText("✔", startX + i * 80 + 20, startY + 40);
          } else {
            ctx.fillStyle = "#ff0000"; // dấu X
            ctx.fillText("✖", startX + i * 80 + 20, startY + 40);
          }
        });

        const buffer = canvas.toBuffer();
        message.channel.send({
          content: `🔥 ${message.author} đã check-in thành công!`,
          files: [{ attachment: buffer, name: "checkin.png" }],
        });
      } catch (err) {
        console.error("❌ Lỗi đổi biệt danh:", err);
        message.channel.send("Bot không thể đổi biệt danh (thiếu quyền Manage Nicknames).");
      }
    }
  }

  // Lệnh với prefix
  if (!message.content.startsWith(PREFIX)) return;
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "help") {
    message.channel.send(
      `📜 **Danh sách lệnh**:
      \n\`${PREFIX}help\` → Xem danh sách lệnh
      \n\`${PREFIX}reset\` → Xóa 🔥 trong biệt danh của bạn`
    );
  }

  if (command === "reset") {
    try {
      const member = await message.guild.members.fetch(userId);
      const baseName = member.nickname || message.author.username;
      const cleanedName = baseName.replace(/ 🔥\d+$/, "");
      await member.setNickname(cleanedName);

      userData.set(userId, {
        streak: 0,
        lastCheckin: null,
        messagesSentToday: 0,
        checkedInToday: false,
      });

      message.channel.send(`🔄 ${message.author} đã reset thành công!`);
    } catch (err) {
      console.error("❌ Lỗi reset:", err);
      message.channel.send("Bot không thể reset biệt danh.");
    }
  }
});

client.login(process.env.TOKEN);

const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot is running!");
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});
