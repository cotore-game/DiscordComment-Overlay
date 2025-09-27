const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const express = require("express");
const fs = require("fs");
require("dotenv").config();

/**
 * アプリケーション生成関数
 * @param {object} deps - 依存関係を注入
 * @param {any} deps.httpLib - http モジュール
 * @param {any} deps.socketIoLib - socket.io モジュール
 * @param {any} deps.settingsModule - 設定モジュール
 */
function createApp({
    httpLib = require("http"),
    socketIoLib = require("socket.io"),
    settingsModule = require("./settings"),
} = {}) {
    const app = express();
    const server = httpLib.createServer(app);
    const io = new socketIoLib.Server(server);

    app.use(express.static("public"));

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
        ],
    });

    // コマンド管理
    const commands = new Map();
    const aliases = new Map();

    const settingsManager = settingsModule(io);

    // コマンド読み込み
    const commandFiles = fs
        .readdirSync("./commands")
        .filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        commands.set(command.name, command);
        if (command.aliases) {
            command.aliases.forEach((alias) => {
                aliases.set(alias, command.name);
            });
        }
    }

    // コメントをemit
    const emitComment = (content) => {
        io.emit("comment", content);
    };

    client.on("messageCreate", async (msg) => {
        if (msg.author.bot) return;

        const args = msg.content.trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        if (commandName === "!nico") {
            const subCommandName = args.shift()?.toLowerCase();
            if (!subCommandName) {
                const embed = new EmbedBuilder()
                    .setColor(0x0099ff)
                    .setTitle("Discordコメントオーバーレイコマンド一覧")
                    .setDescription("`!nico <コマンド> [引数]` で使用できます。")
                    .addFields(
                        { name: "start または s", value: "コメントの監視を開始します。", inline: true },
                        { name: "end または e", value: "コメントの監視を停止します。", inline: true },
                        { name: "settings", value: "現在の設定一覧を表示します。", inline: true },
                        { name: "size [数字]", value: "フォントサイズを変更/表示します。", inline: true },
                        { name: "speed [数字]", value: "コメントの流れるスピードを変更/表示します。", inline: true },
                        { name: "color [カラーコード]", value: "文字色を変更/表示します。", inline: true },
                        { name: "outline または o [数字]", value: "アウトラインのサイズを変更/表示します。", inline: true },
                        { name: "outline-color または oc [カラーコード]", value: "アウトラインの色を変更/表示します。", inline: true },
                    );
                msg.reply({ embeds: [embed] });
                return;
            }

            const resolvedCommandName = aliases.get(subCommandName) || subCommandName;
            const command = commands.get(resolvedCommandName);

            if (!command) {
                msg.reply(
                    `'${subCommandName}' というコマンドは見つかりませんでした。\nコマンド一覧は \`!nico\` で確認できます。`
                );
                return;
            }

            try {
                await command.execute(msg, args, { settingsManager });
            } catch (error) {
                console.error(error);
                msg.reply("コマンドの実行中にエラーが発生しました。");
            }
            return;
        }

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

    return { app, server, io, client };
}

// 実行時のみサーバー起動
if (require.main === module) {
    const { server, client } = createApp();
    client.login(process.env.DISCORD_BOT_TOKEN);
    server.listen(3000, () => console.log("http://localhost:3000"));
}

module.exports = createApp;
