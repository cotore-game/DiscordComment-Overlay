const socket = io();
const root = document.documentElement;
let currentSettings = {};

const setViewportWidth = () => {
    root.style.setProperty('--viewport-width', `${window.innerWidth}px`);
};

setViewportWidth();
window.addEventListener('resize', setViewportWidth);

socket.on("comment", text => {
    const div = document.createElement("div");
    div.className = "comment";
    
    // 縦位置ランダム
    div.style.setProperty("--rand", Math.random());
    
    // フォントサイズと色を直接適用
    div.style.fontSize = `${currentSettings.font_size}px`;
    div.style.color = currentSettings.color;
    
    div.textContent = text;
    
    // HTML追加
    document.body.appendChild(div);
    
    // コメントの幅を取得してCSS変数に設定
    const commentWidth = div.offsetWidth;
    div.style.setProperty("--comment-width", `${commentWidth}px`);
    
    // アニメーション終了後に要素削除
    div.addEventListener("animationend", () => div.remove());
});

// 設定を受信
socket.on("settings", settings => {
    console.log("受信した設定:", settings);

    currentSettings = settings;
    if (settings.speed) {
        root.style.setProperty('--speed', `${settings.speed}s`);
    }
});
