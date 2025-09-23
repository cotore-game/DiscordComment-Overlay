module.exports = {
    name: 'end',
    aliases: ['e'],
    description: 'コメントの監視を停止します。',
    async execute(msg, args, context) {
        context.settingsManager.setWatchingChannelId(null);
        msg.reply('コメントの監視を停止しました。');
    },
};
