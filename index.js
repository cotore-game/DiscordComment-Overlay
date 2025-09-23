const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require('fs');
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

// コマンドと設定の管理
const commands = new Map();

// 設定管理モジュール
const settingsManager = require('./settings')(io);

// コマンドファイルの読み込み
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.set(command.name, command);
}

// ユーザーに送信するコメントをオーバーレイに流す関数
const emitComment = (content) => {
    io.emit("comment", content);
};

// メッセージ作成イベント
client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;

    const args = msg.content.trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const subCommandName = args.shift()?.toLowerCase();
    
    // コマンドプレフィックスのチェックと実行
    if (commandName === '!nico') {
        if (commands.has(subCommandName)) {
            const command = commands.get(subCommandName);
            try {
                await command.execute(msg, args, { settingsManager });
            } catch (error) {
                console.error(error);
                msg.reply('コマンドの実行中にエラーが発生しました。');
            }
        } else {
            // コマンドが見つからない場合のデフォルト動作（開始/監視）
            settingsManager.setWatchingChannelId(msg.channelId);
            msg.reply('このチャンネルのメッセージを監視します。');
        }
        return;
    }

    // 監視対象のチャンネルに投稿されたメッセージをオーバーレイに送信
    const watchingChannelId = settingsManager.getWatchingChannelId();
    if (msg.channelId === watchingChannelId && watchingChannelId !== null) {
        emitComment(msg.content);
    }
});

client.once("ready", () => {
    console.log(`Login: ${client.user.tag}`);
    settingsManager.loadSettings();
    settingsManager.emitSettings();
});

client.login(process.env.DISCORD_BOT_TOKEN);
server.listen(3000, () => console.log("http://localhost:3000"));
