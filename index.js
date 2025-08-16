// index.js
require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const Canvas = require("canvas");
const fs = require("fs");

const prefix = "mv!";
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

// Load dữ liệu streak từ file JSON
let streaks = {};
if (fs.existsSync("streaks.json")) {
    streaks = JSON.parse(fs.readFileSync("streaks.json", "utf8"));
}

// Hàm lưu streak ra file
function saveStreaks() {
    fs.writeFileSync("streaks.json", JSON.stringify(streaks, null, 2));
}

// Hàm tạo ảnh streak
async function createStreakCard(username, streakDays, progress, weekData) {
    const width = 700, height = 300;
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#1e1e2f";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#ff6600";
    ctx.font = "bold 80px Arial";
    ctx.fillText("🔥", 50, 120);

    ctx.fillStyle = "white";
    ctx.font = "bold 40px Arial";
    ctx.fillText(`${streakDays} days`, 150, 100);

    ctx.font = "20px Arial";
    ctx.fillText("Active", 150, 140);

    ctx.fillStyle = "#444";
    ctx.fillRect(150, 180, 400, 25);

    ctx.fillStyle = "#00ff99";
    ctx.fillRect(150, 180, (progress / 5) * 400, 25);

    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText(`${progress} / 5 messages to streak`, 150, 170);

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let startX = 150;
    for (let i = 0; i < days.length; i++) {
        ctx.fillStyle = weekData[i] ? "lime" : "red";
        ctx.font = "20px Arial";
        ctx.fillText(weekData[i] ? "✔" : "✘", startX, 250);

        ctx.fillStyle = "white";
        ctx.font = "15px Arial";
        ctx.fillText(days[i], startX - 10, 270);

        startX += 60;
    }

    ctx.fillStyle = "#aaa";
    ctx.font = "16px Arial";
    ctx.fillText(username, 50, 250);

    return canvas.toBuffer();
}

client.once("ready", () => {
    console.log(`✅ Bot đã đăng nhập thành công với tên: ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === "help") {
        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle("📖 Danh sách lệnh")
            .setDescription(`
            **mv!help** → Hiện danh sách lệnh  
            **mv!checkin** → Điểm danh, nhận streak  
            **mv!reset** → Reset streak của bạn
            `)
            .setFooter({ text: "Bot Streak by Mystvale" });

        return message.reply({ embeds: [embed] });
    }

    if (command === "checkin") {
        const userId = message.author.id;
        if (!streaks[userId]) {
            streaks[userId] = {
                streak: 0,
                progress: 0,
                week: [false, false, false, false, false, false, false],
                lastCheckin: null,
            };
        }

        const today = new Date().getDay();
        const userStreak = streaks[userId];

        if (!userStreak.week[today]) {
            userStreak.week[today] = true;
            userStreak.streak++;
            userStreak.progress = 1;
            userStreak.lastCheckin = Date.now();
        } else {
            userStreak.progress++;
        }

        if (userStreak.progress > 5) userStreak.progress = 5;

        saveStreaks();

        const card = await createStreakCard(
            message.author.username,
            userStreak.streak,
            userStreak.progress,
            userStreak.week
        );

        return message.reply({
            content: `${message.author} Streak up!`,
            files: [{ attachment: card, name: "streak.png" }],
        });
    }

    if (command === "reset") {
        const userId = message.author.id;
        streaks[userId] = {
            streak: 0,
            progress: 0,
            week: [false, false, false, false, false, false, false],
            lastCheckin: null,
        };
        saveStreaks();
        return message.reply("🔥 Bạn đã reset streak thành công!");
    }
});

// Lấy token từ .env
client.login(process.env.DISCORD_TOKEN);
