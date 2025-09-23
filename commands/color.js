const { EmbedBuilder } = require("discord.js");

// HEXカラーコードのバリデーション
const isHexColor = (color) => {
    return /^#[0-9A-F]{6}$/i.test(color);
};

module.exports = {
    name: 'color',
    description: 'コメントの文字色を変更します。',
    async execute(msg, args, context) {
        const value = args[0];
        if (value) {
            const newColor = value.startsWith('#') ? value : `#${value}`;
            if (isHexColor(newColor)) {
                context.settingsManager.setSetting('color', newColor);
                msg.reply(`コメントの文字色を **${newColor}** に変更しました。`);
            } else {
                msg.reply('有効なHEXカラーコードを指定してください。例: #FFFFFF または FFFFFF');
            }
        } else {
            const currentColor = context.settingsManager.getSettings().color;
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('現在の文字色')
                .setDescription(currentColor);
            msg.reply({ embeds: [embed] });
        }
    },
};
