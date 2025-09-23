module.exports = {
    name: 'start',
    aliases: ['s'],
    description: 'コメントの監視を開始します。',
    async execute(msg, args, context) {
        context.settingsManager.setWatchingChannelId(msg.channelId);
        msg.reply(`このチャンネルのメッセージを監視し、オーバーレイに表示します。`);
    },
};
