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

// パスとデフォルト設定
const CONFIG_FILE = 'config.json';
const DEFAULT_SETTINGS = {
    font_size: 24,
    speed: 8
};

let currentSettings = { ...DEFAULT_SETTINGS };
let watchingChannelId = null;

// 設定を読み込む関数
function loadSettings() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            currentSettings = JSON.parse(data);
        } else {
            // ファイルがない場合はデフォルト設定で作成
            saveSettings();
        }
    } catch (error) {
        console.error('設定ファイルの読み込みに失敗しました:', error);
    }
}

// 設定を保存する関数
function saveSettings() {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(currentSettings, null, 2), 'utf8');
    } catch (error) {
        console.error('設定ファイルの保存に失敗しました:', error);
    }
}

// Socket.IO経由で設定をクライアントに送信
const emitSettings = () => {
    io.emit("settings", currentSettings);
};

// メッセージ作成イベント
client.on("messageCreate", (msg) => {
    // ボット自身のメッセージには反応しない
    if (msg.author.bot) return;

    // コマンドのパース
    const args = msg.content.trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // !nico かチェック
    if (command === '!nico') {
        const subCommand = args.shift()?.toLowerCase();
        const value = args.shift();

        switch (subCommand) {
            case 'size':
                if (value) {
                    const newSize = parseInt(value, 10);
                    if (!isNaN(newSize) && newSize > 0) {
                        currentSettings.font_size = newSize;
                        saveSettings();
                        emitSettings();
                        msg.reply(`コメントのフォントサイズを **${newSize}px** に変更しました。`);
                    } else {
                        msg.reply('サイズは正の整数で指定してください。');
                    }
                } else {
                    const embed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle('現在の設定')
                        .addFields(
                            { name: 'フォントサイズ', value: `${currentSettings.font_size}px` }
                        );
                    msg.reply({ embeds: [embed] });
                }
                break;
            case 'speed':
                if (value) {
                    const newSpeed = parseInt(value, 10);
                    if (!isNaN(newSpeed) && newSpeed > 0) {
                        currentSettings.speed = newSpeed;
                        saveSettings();
                        emitSettings();
                        msg.reply(`コメントの流れるスピードを **${newSpeed}秒** に変更しました。`);
                    } else {
                        msg.reply('スピードは正の整数で指定してください。');
                    }
                } else {
                    const embed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle('現在の設定')
                        .addFields(
                            { name: '流れるスピード', value: `${currentSettings.speed}秒` }
                        );
                    msg.reply({ embeds: [embed] });
                }
                break;
            default:
                watchingChannelId = msg.channelId;
                msg.reply(`このチャンネルのメッセージを監視します。`);
                break;
        }
        return; // コマンド実行後は終了
    }
    
    // 監視対象のチャンネルIDと一致する場合にコメントを送信
    if (msg.channelId === watchingChannelId) {
        io.emit("comment", msg.content);
    }
});

client.once("ready", () => {
    console.log(`Login: ${client.user.tag}`);
    loadSettings();
    emitSettings(); // 起動時に現在の設定を送信
});

client.login(process.env.DISCORD_BOT_TOKEN);
server.listen(3000, () => console.log("http://localhost:3000"));
