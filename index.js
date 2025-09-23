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

// コマンドとエイリアスを両方管理するMap
const commands = new Map();
const aliases = new Map();

// 設定管理モジュール
const settingsManager = require('./settings')(io);

// コマンドファイルの読み込み
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.set(command.name, command);
    if (command.aliases) {
        command.aliases.forEach(alias => {
            aliases.set(alias, command.name);
        });
    }
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

    // コマンドプレフィックスのチェックと実行
    if (commandName === '!nico') {
        const subCommandName = args.shift()?.toLowerCase();

        if (!subCommandName) {
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('Discordコメントオーバーレイコマンド一覧')
                .setDescription('`!nico <コマンド> [引数]` で使用できます。')
                .addFields(
                    { name: 'start または s', value: 'コメントの監視を開始します。', inline: true },
                    { name: 'end または e', value: 'コメントの監視を停止します。', inline: true },
                    { name: 'settings', value: '現在の設定一覧を表示します。', inline: true },
                    { name: 'size [数字]', value: 'フォントサイズを変更/表示します。', inline: true },
                    { name: 'speed [数字]', value: 'コメントの流れるスピードを変更/表示します。', inline: true },
                    { name: 'color [カラーコード]', value: '文字色を変更/表示します。', inline: true }
                );
            msg.reply({ embeds: [embed] });
            return;
        }

        // エイリアスをチェックし、存在する場合は元のコマンド名を取得
        const resolvedCommandName = aliases.get(subCommandName) || subCommandName;
        const command = commands.get(resolvedCommandName);

        if (!command) {
            msg.reply(`'${subCommandName}' というコマンドは見つかりませんでした。\nコマンド一覧は \`!nico\` で確認できます。`);
            return;
        }

        try {
            await command.execute(msg, args, { settingsManager });
        } catch (error) {
            console.error(error);
            msg.reply('コマンドの実行中にエラーが発生しました。');
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
