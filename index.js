require("dotenv").config();
const { Client, GatewayIntentBits, AttachmentBuilder } = require("discord.js");
const fs = require("fs");
const Canvas = require("canvas");
const moment = require("moment");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const PREFIX = "mv!";
const DATA_FILE = "streakData.json";

// Load dữ liệu
let streakData = {};
if (fs.existsSync(DATA_FILE)) {
  streakData = JSON.parse(fs.readFileSync(DATA_FILE));
}

// Lưu dữ liệu
function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(streakData, null, 2));
}

// Hàm checkin
async function handleCheckin(userId, username) {
  const today = moment().format("YYYY-MM-DD");
  const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");

  if (!streakData[userId]) {
    streakData[userId] = {
      streak: 0,
      lastCheckin: null,
      week: {},
    };
  }

  const userData = streakData[userId];

  // Đã checkin hôm nay
  if (userData.lastCheckin === today) {
    return { error: true, message: "❌ Bạn đã checkin hôm nay rồi!" };
  }

  // Nếu hôm qua có checkin → tăng streak
  if (userData.lastCheckin === yesterday) {
    userData.streak += 1;
  } else {
    // Bỏ qua hôm qua → reset streak
    userData.streak = 1;
    userData.week = {}; // reset tuần
  }

  userData.lastCheckin = today;

  // Lưu trong tuần (Mon, Tue...)
  const dayOfWeek = moment().format("ddd"); // Mon, Tue...
  userData.week[dayOfWeek] = true;

  saveData();
  return { error: false, data: userData };
}

// Vẽ ảnh giống mẫu
async function generateStreakImage(user, userData) {
  const width = 700;
  const height = 300;
  const canvas = Canvas.createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Nền
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, width, height);

  // Icon lửa
  ctx.font = "100px Sans";
  ctx.fillStyle = "#ff6600";
  ctx.fillText("🔥", 40, 120);

  // Số ngày streak
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 40px Sans";
  ctx.fillText(`${userData.streak} days`, 160, 80);

  ctx.font = "20px Sans";
  ctx.fillStyle = "#aaaaaa";
  ctx.fillText("Active", 160, 110);

  // Thanh progress (giả sử 5 messages/streak như ảnh mẫu)
  ctx.fillStyle = "#333333";
  ctx.fillRect(160, 150, 400, 20);

  ctx.fillStyle = "#ffcc00";
  const progress = Math.min(userData.streak % 5, 5);
  ctx.fillRect(160, 150, (progress / 5) * 400, 20);

  // Vẽ lịch tuần
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  days.forEach((d, i) => {
    ctx.font = "25px Sans";
    ctx.fillStyle = userData.week[d] ? "#00ff00" : "#ff0000";
    ctx.fillText(userData.week[d] ? "✔" : "✘", 160 + i * 60, 230);

    ctx.font = "18px Sans";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(d, 160 + i * 60, 260);
  });

  return new AttachmentBuilder(canvas.toBuffer(), { name: "streak.png" });
}

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  const args = message.content.slice(PREFIX.length).trim().split(" ");
  const cmd = args.shift().toLowerCase();

  if (cmd === "checkin") {
    const res = await handleCheckin(message.author.id, message.author.username);

    if (res.error) {
      message.reply(res.message);
    } else {
      const img = await generateStreakImage(message.author, res.data);
      message.channel.send({ content: `🔥 ${message.author} đã checkin thành công!`, files: [img] });
    }
  }

  if (cmd === "reset") {
    streakData[message.author.id] = { streak: 0, lastCheckin: null, week: {} };
    saveData();
    message.reply("✅ Đã reset streak của bạn.");
  }

  if (cmd === "streak") {
    const userData = streakData[message.author.id];
    if (!userData) return message.reply("Bạn chưa có streak nào!");
    const img = await generateStreakImage(message.author, userData);
    message.channel.send({ files: [img] });
  }

  if (cmd === "help") {
    message.reply(
      "📌 Các lệnh:\n" +
        "`mv!checkin` - Checkin hôm nay\n" +
        "`mv!streak` - Xem streak hiện tại\n" +
        "`mv!reset` - Reset streak\n" +
        "`mv!help` - Xem hướng dẫn"
    );
  }
});

client.login(process.env.DISCORD_TOKEN);
