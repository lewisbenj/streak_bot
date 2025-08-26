# 🔥 Streaks Bot Discord

Streaks Bot is a Discord bot that tracks **daily activity streaks** for users in your server.
Users need to send a required number of messages each day to maintain their streak.
If a user skips more than **3 days**, their streak will be **reset to 0**.

The bot also generates **custom check-in images** with Canvas and automatically updates users’ **nicknames** with their streak count (e.g. `Username 🔥3`).

---

## ✨ Features

* ✅ **Automatic streak tracking** – send enough messages each day to keep your streak alive.
* ✅ **Nickname updates** – bot appends a 🔥 + streak number to your nickname.
* ✅ **Visual check-in** – `mv!checkin` shows your streak progress with a generated image.
* ✅ **Daily reset at midnight** – message counts reset automatically every day.
* ✅ **Streak expiration** – streak resets if you skip more than 3 days.
* ✅ **Web health endpoints** – simple Express server for uptime monitoring (`/`, `/ping`, `/status`).

---

## ⚙️ Commands

```
mv!help     → Show command list  
mv!checkin  → Show your current streak with a generated image  
mv!reset    → Reset your nickname and streak progress  
```

---

## 🚀 Installation & Run

### 1. Clone the project

```bash
git clone https://github.com/yourusername/streaks-bot.git
cd streaks-bot
```

### 2. Install dependencies

```bash
npm init -y && npm install discord.js dotenv canvas && npm install && npm install express
```

### 3. Create a `.env` file

Inside the project folder, create a file named `.env` and add your Discord bot token:

```
TOKEN=your_discord_bot_token_here
PORT=3000
```

### 4. Run the bot

```bash
node index.js
```

If you want to run it continuously:

```bash
npm install -g pm2
pm2 start index.js --name streaks-bot
```

---

## 📦 Requirements

* Node.js v16 or later
* Discord.js v14
* Canvas
* Express

---

## 🌐 Web Endpoints

The bot also runs a small Express server:

* `/` → Returns `Bot is running!`
* `/ping` → Returns `{ ok: true, ts: <timestamp> }`
* `/status` → Returns bot status, uptime, and memory usage

Useful for uptime monitors like **UptimeRobot** or **BetterStack**.

---

## 🛡️ Permissions Required

Make sure your bot has:

* `Manage Nicknames` → for updating streak numbers
* `Read/Send Messages` → for tracking activity
* `Attach Files` → for sending generated streak images

---
