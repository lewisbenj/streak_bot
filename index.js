require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");

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
    activities: [{ name: "Mysvale", type: 0 }], // Playing Mysvale
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

  // Nếu hôm nay chưa checkin thì đếm tin nhắn
  if (!data.checkedInToday) {
    data.messagesSentToday++;

    // Số tin nhắn cần để lên lửa = 5 * ngày streak tiếp theo
    const requiredMessages = 5 * (data.streak + 1);

    if (data.messagesSentToday >= requiredMessages) {
      data.streak++;
      data.checkedInToday = true;
      data.lastCheckin = new Date().toDateString();

      try {
        const member = await message.guild.members.fetch(userId);
        const baseName = member.nickname || message.author.username;

        // Xóa icon lửa cũ nếu có
        const cleanedName = baseName.replace(/ 🔥\d+$/, "");
        const newName = `${cleanedName} 🔥${data.streak}`;

        await member.setNickname(newName);
        message.channel.send(
          `🔥 ${message.author} đã check-in thành công! Streak: ${data.streak} ngày`
        );
      } catch (err) {
        console.error("❌ Lỗi đổi biệt danh:", err);
        message.channel.send(
          "Bot không thể đổi biệt danh (thiếu quyền Manage Nicknames)."
        );
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
