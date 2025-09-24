const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: 'settings',
    description: '現在の設定一覧を表示します。',
    async execute(msg, args, context) {
        const currentSettings = context.settingsManager.getSettings();
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('現在のオーバーレイ設定')
            .addFields(
                { name: 'フォントサイズ', value: `${currentSettings.font_size}px`, inline: true },
                { name: 'スピード', value: `${currentSettings.speed}秒`, inline: true },
                { name: '文字色', value: `${currentSettings.color}`, inline: true },
                { name: 'アウトラインサイズ', value: `${currentSettings.outline_size}px`, inline: true },
                { name: 'アウトライン色', value: `${currentSettings.outline_color}`, inline: true }
            );
        msg.reply({ embeds: [embed] });
    },
};
