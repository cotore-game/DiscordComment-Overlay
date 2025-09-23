const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

// 監視対象のチャンネルID
let watchingChannelId = null;

// コメント送信
const emitComment = (content) => {
    io.emit("comment", content);
};

// メッセージ作成イベント
client.on("messageCreate", (msg) => {
    // ボット自身のメッセージには反応しない
    if (msg.author.bot) return;

    // 監視チャンネルの設定
    // メッセージがボットへのメンションを含んでいるかチェック
    if (msg.mentions.users.has(client.user.id)) {
        watchingChannelId = msg.channelId;
        // ユーザーに監視を開始したことを通知
        msg.reply(`このチャンネルのメッセージを監視開始します。`);
        console.log(`監視開始: ${msg.channel.name}`);
    }
    
    // 監視対象のチャンネルIDと一致する場合にコメントを送信
    if (msg.channelId === watchingChannelId) {
        emitComment(msg.content);
    }
});

client.once("ready", () => {
    console.log(`Login: ${client.user.tag}`);
});

client.login(process.env.DISCORD_BOT_TOKEN);
server.listen(3000, () => console.log("http://localhost:3000"));
