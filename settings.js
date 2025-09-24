const fs = require('fs');

const CONFIG_FILE = 'config.json';
const DEFAULT_SETTINGS = {
    font_size: 60,
    speed: 8,
    color: '#ffffff',
    outline_size: 6,
    outline_color: '#000000',
    watching_channel_id: null
};

let currentSettings = { ...DEFAULT_SETTINGS };
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
    
    // 各種getterとsetter
    return {
        loadSettings,
        saveSettings,
        emitSettings,
        getSettings: () => currentSettings,
        setWatchingChannelId: (id) => {
            currentSettings.watching_channel_id = id;
            saveSettings();
        },
        getWatchingChannelId: () => currentSettings.watching_channel_id,
        setSetting: (key, value) => {
            currentSettings[key] = value;
            saveSettings();
            emitSettings();
        }
    };
};
