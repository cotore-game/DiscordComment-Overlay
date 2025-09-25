const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// テストに必要なサーバーとIOインスタンスをここで作成
const mockServer = http.createServer();
const mockIo = new Server(mockServer);

// index.jsのsettingsManager変数をモック
const mockSettingsManager = {
    loadSettings: jest.fn(),
    saveSettings: jest.fn(),
    emitSettings: jest.fn(),
    getSettings: jest.fn(() => ({
        font_size: 60,
        speed: 8,
        color: '#ffffff',
        watching_channel_id: 'mock-channel-id',
    })),
    setWatchingChannelId: jest.fn(),
    getWatchingChannelId: jest.fn(() => 'mock-channel-id'),
    setSetting: jest.fn(),
};

// settings.jsモジュール全体をモック
jest.mock('../settings', () => {
    return jest.fn(() => mockSettingsManager);
});

// index.jsモジュール全体をモック
jest.mock('../index', () => {
    // index.jsの内部で使われる依存関係をモックする
    const mockFs = {
        readdirSync: jest.fn(() => []),
    };

    const mockDiscordClient = {
        user: { tag: 'TestBot#1234' },
        on: jest.fn((event, callback) => {
            // messageCreateイベントハンドラを保存
            if (event === 'messageCreate') {
                module.exports.mockMessageCreate = callback;
            }
        }),
        once: jest.fn((event, callback) => {
            // readyイベントを保存し、ログイン時に呼び出せるようにする
            if (event === 'ready') {
                module.exports.mockReady = callback;
            }
        }),
        login: jest.fn(() => {
            // loginが呼ばれたらreadyイベントをトリガー
            if (module.exports.mockReady) {
                module.exports.mockReady();
            }
        }),
    };

    // index.jsのメインロジックを模倣
    const moduleExports = {
        server: mockServer,
        io: mockIo,
        // テスト用のユーティリティ関数
        mockMessageCreate: null,
        mockReady: null,
    };

    // index.jsが実行されると仮定して、依存関係を注入して初期化
    require('fs').readdirSync = mockFs.readdirSync;
    require('discord.js').Client = jest.fn(() => mockDiscordClient);
    require('./settings').mockImplementation(() => mockSettingsManager);

    // テストに必要な変数をエクスポート
    moduleExports.server = mockServer;
    moduleExports.io = mockIo;

    return moduleExports;
});

describe('E2E Test: Web Server and Overlay Communication', () => {
    let browser;
    let page;
    let server;
    let mockMessageCreate;

    beforeAll(async () => {
        // index.jsモジュールをロードし、モックされたインスタンスを取得
        const indexModule = require('../index');
        server = indexModule.server;
        mockMessageCreate = indexModule.mockMessageCreate;

        // サーバーを起動
        server.listen(3000);

        // ブラウザを起動
        browser = await chromium.launch();
        page = await browser.newPage();
    }, 30000);

    afterAll(async () => {
        // サーバーとブラウザを確実に閉じる
        await browser.close();
        await new Promise(resolve => server.close(resolve));
    }, 30000);

    test('should display a comment when a message is sent', async () => {
        // `index.html`をブラウザで開く
        await page.goto(`file://${path.join(__dirname, '../public/index.html')}`);

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
