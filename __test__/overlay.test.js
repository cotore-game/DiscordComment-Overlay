const { chromium } = require('playwright');
const path = require('path');
const http = require('http');

// fsモジュールをモック
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readdirSync: jest.fn(() => []), // コマンドフォルダの読み込みを回避
  existsSync: jest.fn(() => true), // configファイルが存在すると仮定
  readFileSync: jest.fn(() => JSON.stringify({
    font_size: 60,
    speed: 8,
    color: '#ffffff',
    watching_channel_id: 'mock-channel-id'
  })), // ダミーの設定を返す
  writeFileSync: jest.fn(), // 保存処理をモック
}));

// discord.jsモジュールをモック
jest.mock('discord.js', () => {
    // onとonceイベントをテストコードから制御するためのモック
    const eventHandlers = {};

    return {
        Client: jest.fn(() => ({
            user: {
                tag: 'TestBot#1234',
            },
            on: jest.fn((event, callback) => {
                eventHandlers[event] = callback;
            }),
            once: jest.fn((event, callback) => {
                eventHandlers[event] = callback;
            }),
            login: jest.fn(() => {
                // loginが呼ばれたら、readyイベントを模擬的に発火させる
                if (eventHandlers.ready) {
                    eventHandlers.ready();
                }
            }),
        })),
        GatewayIntentBits: {
            Guilds: 1,
            GuildMessages: 1,
            MessageContent: 1,
        },
        EmbedBuilder: jest.fn(() => ({
            setColor: jest.fn(() => ({
                setTitle: jest.fn(() => ({
                    addFields: jest.fn(() => ({})),
                    setDescription: jest.fn(() => ({})),
                })),
            })),
        })),
        // テストコードからイベントをトリガーするためのヘルパー関数をエクスポート
        __triggerEvent: (event, ...args) => {
            if (eventHandlers[event]) {
                eventHandlers[event](...args);
            }
        },
    };
});

// settings.jsモジュールをモック
jest.mock('../settings', () => {
    const mockSettings = {
        font_size: 60,
        speed: 8,
        color: '#ffffff',
        watching_channel_id: null,
    };
    return jest.fn((io) => ({
        loadSettings: jest.fn(),
        saveSettings: jest.fn(),
        emitSettings: jest.fn(),
        getSettings: jest.fn(() => mockSettings),
        setWatchingChannelId: jest.fn((id) => {
            mockSettings.watching_channel_id = id;
        }),
        getWatchingChannelId: jest.fn(() => mockSettings.watching_channel_id),
        setSetting: jest.fn((key, value) => {
            mockSettings[key] = value;
        }),
    }));
});

describe('E2E Test: Web Server and Overlay Communication', () => {
    let server;
    let browser;
    let page;
    let mockMessageCreate;

    beforeAll(async () => {
        // index.jsをロード
        require('../index.js');
        const indexModule = require('../index.js');
        server = indexModule.server;

        // モックされたDiscordイベントをトリガーする関数を取得
        const { __triggerEvent } = require('discord.js');
        mockMessageCreate = (msg) => __triggerEvent('messageCreate', msg);

        // ブラウザを起動
        browser = await chromium.launch();
        page = await browser.newPage();
    }, 30000);

    afterAll(async () => {
        await browser.close();
        server.close();
    });

    test('should display a comment when a message is sent', async () => {
        // ブラウザでindex.htmlを開く
        await page.goto(`file://${path.join(__dirname, '../public/index.html')}`);
        
        // 監視チャンネルを設定する
        const { settingsManager } = require('../settings')();
        settingsManager.setWatchingChannelId('mock-channel-id');

        // ダミーのメッセージを送信
        const mockMsg = {
            author: { bot: false },
            content: 'Hello, test!',
            channelId: 'mock-channel-id',
        };

        // メッセージ作成イベントをトリガー
        mockMessageCreate(mockMsg);

        // 新しいdiv要素が表示されるまで待機
        await page.waitForSelector('.comment', { state: 'visible', timeout: 5000 });

        // div要素の内容を確認
        const commentText = await page.textContent('.comment');
        expect(commentText).toBe('Hello, test!');

    }, 30000);
});
