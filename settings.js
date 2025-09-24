const fs = require('fs');

const CONFIG_FILE = 'config.json';
const DEFAULT_SETTINGS = {
    font_size: 60,
    speed: 8,
    color: '#ffffff',
    outline_size: 2,
    outline_color: '#000000',
};

let currentSettings = { ...DEFAULT_SETTINGS };
let watchingChannelId = null;
let io;

module.exports = (socketIo) => {
    io = socketIo;
    
    // 設定を読み込む
    function loadSettings() {
        try {
            if (fs.existsSync(CONFIG_FILE)) {
                const data = fs.readFileSync(CONFIG_FILE, 'utf8');
                currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
            } else {
                saveSettings();
            }
        } catch (error) {
            console.error('設定ファイルの読み込みに失敗しました:', error);
        }
    }
    
    // 設定を保存する
    function saveSettings() {
        try {
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(currentSettings, null, 2), 'utf8');
        } catch (error) {
            console.error('設定ファイルの保存に失敗しました:', error);
        }
    }
    
    // 設定をクライアントに送信
    function emitSettings() {
        io.emit("settings", currentSettings);
    }
    
    // チャンネルIDのsetterとgetter
    const setWatchingChannelId = (id) => {
        watchingChannelId = id;
    };

    const getWatchingChannelId = () => {
        return watchingChannelId;
    };
    
    // 各種getterとsetter
    return {
        loadSettings,
        saveSettings,
        emitSettings,
        getSettings: () => currentSettings,
        setWatchingChannelId,
        getWatchingChannelId,
        setSetting: (key, value) => {
            currentSettings[key] = value;
            saveSettings();
            emitSettings();
        }
    };
};
