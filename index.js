require("dotenv").config();
const { Client, GatewayIntentBits, AttachmentBuilder } = require("discord.js");
const Canvas = require("canvas");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Lưu dữ liệu checkin
const streakData = {}; // { userId: { lastCheckin: Date, streak: Number } }

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.toLowerCase() === "!checkin") {
    const userId = message.author.id;
    const today = new Date().toDateString();

    if (!streakData[userId]) {
      streakData[userId] = { lastCheckin: null, streak: 0 };
    }

    const userData = streakData[userId];

    if (userData.lastCheckin === today) {
      return message.reply("❌ Bạn đã check-in hôm nay rồi, quay lại vào ngày mai nhé!");
    }

    // Tính ngày liên tục
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (userData.lastCheckin === yesterday.toDateString()) {
      userData.streak += 1;
    } else {
      userData.streak = 1;
    }

    userData.lastCheckin = today;

    // Cập nhật biệt danh 🔥
    try {
      const member = await message.guild.members.fetch(userId);
      let baseName = member.user.username;
      let newNick = `${baseName} 🔥${userData.streak}`;
      await member.setNickname(newNick);
    } catch (err) {
      console.error("Không đổi được biệt danh:", err.message);
    }

    // Vẽ ảnh streak
    const imgBuffer = await createStreakImage(message.author.username, userData.streak);
    const attachment = new AttachmentBuilder(imgBuffer, { name: "streak.png" });

    message.reply({ content: `🎉 ${message.author}, bạn đã check-in thành công!`, files: [attachment] });
  }
});

async function createStreakImage(username, streak) {
  const width = 700;
  const height = 300;
  const canvas = Canvas.createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Nền
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#3a1c71");
  gradient.addColorStop(1, "#d76d77");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Icon 🔥
  ctx.font = "80px Sans";
  ctx.fillStyle = "#ff9933";
  ctx.fillText("🔥", 50, 100);

  // Streak text
  ctx.font = "40px Sans";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`${streak} days active`, 150, 90);

  // Username
  ctx.font = "30px Sans";
  ctx.fillStyle = "#eeeeee";
  ctx.fillText(username, 50, 180);

  return canvas.toBuffer();
}

client.login(process.env.TOKEN);
