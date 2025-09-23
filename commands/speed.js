const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: 'speed',
    description: 'コメントの流れるスピードを変更します。',
    async execute(msg, args, context) {
        const value = args[0];
        if (value) {
            const newSpeed = parseInt(value, 10);
            if (!isNaN(newSpeed) && newSpeed > 0) {
                context.settingsManager.setSetting('speed', newSpeed);
                msg.reply(`コメントの流れるスピードを **${newSpeed}秒** に変更しました。`);
            } else {
                msg.reply('スピードは正の整数で指定してください。');
            }
        } else {
            const currentSpeed = context.settingsManager.getSettings().speed;
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('現在の流れるスピード')
                .setDescription(`${currentSpeed}秒`);
            msg.reply({ embeds: [embed] });
        }
    },
};
