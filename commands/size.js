const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: 'size',
    description: 'フォントサイズを変更します。',
    async execute(msg, args, context) {
        const value = args[0];
        if (value) {
            const newSize = parseInt(value, 10);
            if (!isNaN(newSize) && newSize > 0) {
                context.settingsManager.setSetting('font_size', newSize);
                msg.reply(`コメントのフォントサイズを **${newSize}px** に変更しました。`);
            } else {
                msg.reply('サイズは正の整数で指定してください。');
            }
        } else {
            const currentSize = context.settingsManager.getSettings().font_size;
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('現在のフォントサイズ')
                .setDescription(`${currentSize}px`);
            msg.reply({ embeds: [embed] });
        }
    },
};
