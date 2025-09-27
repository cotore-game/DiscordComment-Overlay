# Discord Comment Overlay

Discord Botからメッセージをリアルタイムで読み取り、HTMLに表示するプログラムです。メッセージは右から左に流れていきます。OBS Studio等の配信ソフトにブラウザソースとして配置することで、Discordのメッセージをライブ配信等で表示することができます。

## 機能

- Discord Botを使用して、メッセージをリアルタイムで取得します。
- メッセージを画面右から左へニコニコ動画風に流します。
- ローカルサーバーで、ブラウザで表示するためのHTMLをストリーミングします。
- ブラウザソースとしてOBSなどの配信ソフト上に配置することができます。
- Discord上から、コマンドで操作可能です。
- メッセージの表示スタイルをカスタムすることができます。
  - フォントサイズ
  - 文字色
  - 縁取りのサイズ・色
  - コメントが流れる速度

## インストール

### 1. プロジェクトをセットアップする

下記コマンドを実行して、プロジェクトと依存のインストールを行ってください。

```bash
git clone https://github.com/cotore-game/DiscordComment-Overlay.git
cd DiscordComment-Overlay
npm install
```

### 2. DiscordBotTokenを取得する

[Discord Developer Portal](https://discord.com/developers/applications)にてBotを作成し、`Token`を取得してください。
取得した`Token`は、コピーして保存しておいてください。
**なお、**`Token`**を知っている人全員がこのBotを操作することができます。基本的に漏洩しないようにしてください。**

Botの作成に当たっては下記の要件を満たしてください。

- Botタブ
  - `Privileged Gateway Intents`で、`Message Content Intent`を有効化してください。
  - `Bot Permissions`で`Send Messages`と`Read Message History`を選択してください。
  ※いずれも、メッセージに反応するために必須です。

### 3. Botをサーバーに招待する

1. 左メニューから`OAuth2`タブから→「URL Generator」を確認します。
2. `Scopes`で`bot`を選択してください。
3. `Bot Permissions`で`Send Messages`と`Read Message History`を選択してください。
4. 生成されたURLからBotをサーバーに招待してください。

### 4. 環境変数の設定

プロジェクトのルートフォルダ直下に`.env`ファイルを作成し、先ほど取得したDiscord BotのTokenを下記の通りに記述してください。

```env
DISCORD_BOT_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 使い方

### 1. アプリケーションの起動

```bash
node index.js
```

起動後、以下が表示されれば成功です：

- `Login: BotName#1234`
- `http://localhost:3000`

### 2. OBS Studioでの設定

1. ソース追加 → 「ブラウザ」を選択
2. URL: `http://localhost:3000`
3. 「ページと対話する」にチェック

### 3. Discord コマンド

- `!nico`
  コマンドの一覧を確認する

#### 基本操作

- `!nico start` | `!nico s`
  - 現在のチャンネルでコメント監視を開始
  
- `!nico end` | `!nico e`
  - コメントの監視を停止

- `!nico settings`
  - 現在の設定一覧を表示

#### スタイル設定

- `!nico size [数値]`
  - フォントサイズを変更（例: `!nico size 80`）
  - 引数なしで現在の設定を表示

- `!nico speed [数値]`
  - コメントの流れる速度を変更（秒単位、例: `!nico speed 6`）
  - 数値が大きいほど遅くなります

- `!nico color [カラーコード]`
  - 文字色を変更（例: `!nico color #ff0000`）

- `!nico outline [数値]` または `!nico o [数値]`
  - アウトライン（縁取り）のサイズを変更（例: `!nico outline 4`）

- `!nico outline-color [カラーコード]` または `!nico oc [カラーコード]`
  - アウトラインの色を変更（例: `!nico oc #000000`）

### 使用例

```bash
!nico start          # コメント監視開始
!nico size 100       # フォントサイズを100pxに
!nico color #00ff00  # 文字色を緑に
!nico speed 4        # 4秒で画面を横切るように
!nico outline 3      # 縁取りを3pxに
!nico oc #ff0000     # 縁取りを赤色に
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルをご覧ください。
