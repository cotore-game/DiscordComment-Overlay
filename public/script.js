const socket = io();
const root = document.documentElement;

socket.on("comment", text => {
    const div = document.createElement("div");
    div.className = "comment";
    
    // 縦位置ランダム
    div.style.setProperty("--rand", Math.random());
    
    div.textContent = text;
    
    // HTML追加
    document.body.appendChild(div);
    
    // アニメーション終了後に要素削除
    div.addEventListener("animationend", () => div.remove());
});

// 設定を受信
socket.on("settings", settings => {
    console.log("受信した設定:", settings);
    
    if (settings.font_size) {
        root.style.setProperty('--font-size', `${settings.font_size}px`);
    }
    if (settings.speed) {
        root.style.setProperty('--speed', `${settings.speed}s`);
    }
    if (settings.color) {
        root.style.setProperty('--color', settings.color);
    }
});
