const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: 'outline',
    aliases: ['o'],
    description: 'コメントのアウトラインサイズを変更します。',
    async execute(msg, args, context) {
        const value = args[0];
        if (value) {
            const newSize = parseInt(value, 10);
            if (!isNaN(newSize) && newSize >= 0) {
                context.settingsManager.setSetting('outline_size', newSize);
                msg.reply(`コメントのアウトラインサイズを **${newSize}px** に変更しました。`);
            } else {
                msg.reply('サイズは0以上の整数で指定してください。');
            }
        } else {
            const currentSize = context.settingsManager.getSettings().outline_size;
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('現在のアウトラインサイズ')
                .setDescription(`${currentSize}px`);
            msg.reply({ embeds: [embed] });
        }
    },
};
