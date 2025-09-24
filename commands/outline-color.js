const { EmbedBuilder } = require("discord.js");

// HEXカラーコードのバリデーション
const isHexColor = (color) => {
    return /^#[0-9A-F]{6}$/i.test(color);
};

module.exports = {
    name: 'outline-color',
    aliases: ['oc'],
    description: 'コメントのアウトライン色を変更します。',
    async execute(msg, args, context) {
        const value = args[0];
        if (value) {
            const newColor = value.startsWith('#') ? value : `#${value}`;
            if (isHexColor(newColor)) {
                context.settingsManager.setSetting('outline_color', newColor);
                msg.reply(`コメントのアウトライン色を **${newColor}** に変更しました。`);
            } else {
                msg.reply('有効なHEXカラーコードを指定してください。例: #000000 または 000000');
            }
        } else {
            const currentColor = context.settingsManager.getSettings().outline_color;
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('現在のアウトライン色')
                .setDescription(currentColor);
            msg.reply({ embeds: [embed] });
        }
    },
};
