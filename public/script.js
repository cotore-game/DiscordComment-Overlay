const socket = io();

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
