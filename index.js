require("dotenv").config();
const { Client, GatewayIntentBits, AttachmentBuilder, EmbedBuilder } = require("discord.js");
const Canvas = require("canvas");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
});

const prefix = "mv!";
let streaks = {}; // { userId: number }

// Load streaks từ file
if (fs.existsSync("streaks.json")) {
  streaks = JSON.parse(fs.readFileSync("streaks.json"));
}

// Hàm lưu streaks
function saveStreaks() {
  fs.writeFileSync("streaks.json", JSON.stringify(streaks, null, 2));
}

client.on("ready", () => {
  console.log(`✅ Bot đã đăng nhập với tên ${client.user.tag}`);
  client.user.setActivity("mv!help", { type: 2 });
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Help
  if (command === "help") {
    const embed = new EmbedBuilder()
      .setTitle("📖 Lệnh của bot")
      .setColor("Orange")
      .setDescription(
        `**${prefix}checkin** → Điểm danh, tăng streak 🔥\n` +
        `**${prefix}reset** → Reset streak về 0\n` +
        `**${prefix}help** → Hiển thị hướng dẫn`
      );
    return message.channel.send({ embeds: [embed] });
  }

  // Checkin
  if (command === "checkin") {
    const userId = message.author.id;

    // Tăng streak
    if (!streaks[userId]) streaks[userId] = 0;
    streaks[userId] += 1;
    saveStreaks();

    const streak = streaks[userId];

    // Đổi biệt danh thành viên
    try {
      const member = await message.guild.members.fetch(userId);
      let baseName = member.displayName.replace(/🔥\d+$/, "").trim(); // xoá 🔥cũ nếu có
      await member.setNickname(`${baseName} 🔥${streak}`);
    } catch (err) {
      console.error("Không đổi được biệt danh:", err.message);
    }

    // Tạo ảnh bằng canvas
    const canvas = Canvas.createCanvas(400, 200);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#222831";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "28px sans-serif";
    ctx.fillStyle = "#fff";
    ctx.fillText(`${message.author.username}`, 30, 60);

    ctx.font = "36px bold sans-serif";
    ctx.fillStyle = "#ff4500";
    ctx.fillText(`🔥 Streak: ${streak}`, 30, 120);

    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: "checkin.png" });

    return message.channel.send({
      content: `✅ ${message.author}, bạn đã điểm danh thành công!`,
      files: [attachment],
    });
  }

  // Reset streak
  if (command === "reset") {
    const userId = message.author.id;
    streaks[userId] = 0;
    saveStreaks();

    try {
      const member = await message.guild.members.fetch(userId);
      let baseName = member.displayName.replace(/🔥\d+$/, "").trim();
      await member.setNickname(baseName); // bỏ 🔥
    } catch (err) {
      console.error("Không reset được biệt danh:", err.message);
    }

    return message.channel.send(`🔄 ${message.author}, streak của bạn đã được reset!`);
  }
});

if (!process.env.DISCORD_TOKEN) {
  console.error("❌ Chưa có DISCORD_TOKEN trong file .env");
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
