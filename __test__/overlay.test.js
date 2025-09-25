const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Discord.jsとdotenvをモックする
jest.mock('discord.js', () => {
    return {
        Client: jest.fn(() => ({
            once: jest.fn((event, callback) => {
                if (event === 'ready') {
                    // Botが準備完了したかのように振る舞う
                    callback();
                }
            }),
            login: jest.fn(),
            on: jest.fn((event, callback) => {
                // messageCreateイベントをモックする
                if (event === 'messageCreate') {
                    // テストケース内で呼び出すための関数をエクスポートする
                    module.exports.mockMessageCreate = callback;
                }
            }),
        })),
        GatewayIntentBits: {
            Guilds: 1,
            GuildMessages: 1,
            MessageContent: 1,
        },
        EmbedBuilder: jest.fn(),
    };
});
jest.mock('dotenv', () => ({
    config: jest.fn(),
}));

const indexModule = require('../index'); // テスト対象のindex.jsを読み込む

describe('E2E Test: Web Server and Overlay Communication', () => {
    let browser;
    let page;
    let server;
    let io;

    // index.jsのサーバーを起動
    beforeAll(async () => {
        // index.jsからSocket.ioのインスタンスを取得
        const { server: appServer, io: appIo } = indexModule;
        server = appServer;
        io = appIo;

        // Discord Botのログインと`ready`イベントをモック
        appIo.once("connection", () => {
            appIo.emit("comment", "Welcome to the test!");
        });

        // サーバー起動
        server.listen(3000);

        // ブラウザを起動
        browser = await chromium.launch();
    });

    // テスト終了後にサーバーとブラウザを閉じる
    afterAll(async () => {
        await browser.close();
        server.close();
    });

    beforeEach(async () => {
        page = await browser.newPage();
    });

    afterEach(async () => {
        await page.close();
    });

    test('should display a comment when a message is sent', async () => {
        // `index.html`をブラウザで開く
        await page.goto(`file://${path.join(__dirname, '../public/index.html')}`);

        // `index.js`の`messageCreate`イベントを模擬的にトリガーする
        // テスト用のメッセージオブジェクトを作成
        const mockMsg = {
            author: { bot: false },
            content: 'Hello, world!',
            channelId: 'mock-channel-id',
        };

        // 監視対象チャンネルIDを設定
        const { settingsManager } = require('../settings')(io);
        settingsManager.setWatchingChannelId('mock-channel-id');

        // `messageCreate`イベントを呼び出す
        require('../index').mockMessageCreate(mockMsg);

        // 新しいdiv要素が表示されるまで待機
        await page.waitForSelector('.comment', { state: 'visible', timeout: 5000 });

        // div要素の内容を確認
        const commentText = await page.textContent('.comment');
        expect(commentText).toBe('Hello, world!');

    }, 30000);
});
