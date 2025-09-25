const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// テストに必要なサーバーとIOインスタンスをここで作成
const mockServer = http.createServer();
const mockIo = new Server(mockServer);

// settingsManagerのモックを作成し、テストで操作可能にする
const mockSettingsManager = {
    loadSettings: jest.fn(),
    saveSettings: jest.fn(),
    emitSettings: jest.fn(),
    getSettings: jest.fn(() => ({
        font_size: 60,
        speed: 8,
        color: '#ffffff',
        outline_size: 2,
        outline_color: '#000000',
    })),
    setWatchingChannelId: jest.fn(),
    getWatchingChannelId: jest.fn(() => 'mock-channel-id'),
    setSetting: jest.fn(),
};

// index.jsのsettingsManagerがモックのioインスタンスを使うようにモックする
jest.mock('../settings', () => {
    return jest.fn(() => mockSettingsManager);
});

// index.jsのサーバーとioインスタンスをモックする
jest.mock('http', () => {
    return {
        createServer: jest.fn(() => ({
            listen: jest.fn(),
            on: jest.fn()
        }))
    };
});

jest.mock('socket.io', () => {
    return {
        Server: jest.fn(() => ({
            on: jest.fn(),
            emit: jest.fn(),
            attach: jest.fn()
        }))
    };
});

// fsモジュールをモックし、ファイル読み込みを回避
jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    // commandsディレクトリの読み込みを回避
    readdirSync: jest.fn(() => []), 
}));

// discord.jsモジュールをモック
jest.mock('discord.js', () => {
    const eventHandlers = {};

    return {
        Client: jest.fn(() => ({
            user: { tag: 'TestBot#1234' },
            on: jest.fn((event, callback) => {
                eventHandlers[event] = callback;
            }),
            once: jest.fn((event, callback) => {
                eventHandlers[event] = callback;
            }),
            login: jest.fn(() => {
                // loginが呼ばれたらreadyイベントを即座に発火
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
                    addFields: jest.fn(() => ({
                        setDescription: jest.fn(() => ({}))
                    }))
                }))
            })),
        })),
        // テストコードからイベントをトリガーするためのヘルパー関数
        __triggerEvent: (event, ...args) => {
            if (eventHandlers[event]) {
                eventHandlers[event](...args);
            }
        },
    };
});

// index.js をモックした後に読み込む
require('../index');

describe('E2E Test: Web Server and Overlay Communication', () => {
    let server;
    let browser;
    let page;
    
    beforeAll(async () => {
        // Playwrightでブラウザを起動
        browser = await chromium.launch();
        page = await browser.newPage();
    }, 30000); // タイムアウトを延長

    afterAll(async () => {
        // テストの後に、ブラウザを確実に閉じる
        await browser.close();
    }, 30000);

    test('should display a comment when a message is sent to the watching channel', async () => {
        // Playwrightで`index.html`を開く
        await page.goto(`file://${path.join(__dirname, '../public/index.html')}`);
        
        // テスト内で動的にモックioのイベントリスナーを設定
        mockIo.on('connection', socket => {
            // クライアントが接続したら、コメントイベントを送信する
            socket.on('send-message', msg => {
                mockIo.emit('comment', msg);
            });
        });

        // 監視チャンネルIDを設定
        mockSettingsManager.setWatchingChannelId('mock-channel-id');

        // ダミーのメッセージオブジェクトを作成
        const mockMsg = {
            author: { bot: false },
            content: 'Hello, test!',
            channelId: 'mock-channel-id',
        };

        // メッセージ作成イベントをトリガー
        const { __triggerEvent } = require('discord.js');
        __triggerEvent('messageCreate', mockMsg);

        // 新しいdiv要素が表示されるまで待機
        await page.waitForSelector('.comment', { state: 'visible', timeout: 5000 });

        // div要素の内容を確認
        const commentText = await page.textContent('.comment');
        expect(commentText).toBe('Hello, test!');
    }, 30000);
});
