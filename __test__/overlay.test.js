/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const { EventEmitter } = require('events');
jest.mock('fs');

describe('settings.js', () => {
  let ioMock;
  let settings;

  beforeEach(() => {
    fs.existsSync.mockReset();
    fs.readFileSync.mockReset();
    fs.writeFileSync.mockReset();

    ioMock = new EventEmitter();
    ioMock.emit = jest.fn();

    jest.isolateModules(() => {
      settings = require('../settings')(ioMock);
    });
  });

  test('設定が存在しない場合、デフォルト設定を保存する', () => {
    fs.existsSync.mockReturnValue(false);

    settings.loadSettings();

    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  test('設定ファイルが存在する場合、マージして読み込む', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ font_size: 42 }));

    settings.loadSettings();

    expect(settings.getSettings().font_size).toBe(42);
  });

  test('setSettingで設定が更新・保存・emitされる', () => {
    settings.setSetting('color', '#ff0000');

    expect(settings.getSettings().color).toBe('#ff0000');
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(ioMock.emit).toHaveBeenCalledWith('settings', expect.any(Object));
  });

  test('watchingChannelIdのsetter/getterが動作する', () => {
    settings.setWatchingChannelId('12345');
    expect(settings.getWatchingChannelId()).toBe('12345');
  });
});

describe('overlay front-end', () => {
  let socketMock;
  let script;

  beforeEach(() => {
    // HTMLの準備
    document.body.innerHTML = `
      <html>
        <head></head>
        <body></body>
      </html>
    `;

    // ソケットのモック
    socketMock = new EventEmitter();

    // script.jsを読み込む
    global.io = () => socketMock;
    jest.isolateModules(() => {
      script = require('../public/script.js'); 
    });
  });

  test('commentイベントでdiv.commentが追加される', () => {
    socketMock.emit('comment', 'テストコメント');

    const div = document.querySelector('.comment');
    expect(div).not.toBeNull();
    expect(div.textContent).toBe('テストコメント');
  });

  test('settingsイベントでCSS変数が反映される', () => {
    socketMock.emit('settings', {
      speed: 5,
      font_size: 40,
      color: '#00ff00',
      outline_size: 3,
      outline_color: '#ff00ff'
    });

    const root = document.documentElement;

    expect(root.style.getPropertyValue('--speed')).toBe('5s');
    expect(root.style.getPropertyValue('--font-size')).toBe('40px');
    expect(root.style.getPropertyValue('--color')).toBe('#00ff00');
    expect(root.style.getPropertyValue('--outline-size')).toBe('3px');
    expect(root.style.getPropertyValue('--outline-color')).toBe('#ff00ff');
  });
});
