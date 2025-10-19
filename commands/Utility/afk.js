const { SlashCommandBuilder } = require('discord.js');
const afkMap = require('../../utils/afkMap');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Set your AFK status with an optional reason')
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for going AFK')
                .setRequired(false)),
                
    async execute(interaction, client) {
        const reason = interaction.options.getString('reason') || 'AFK';

        try {
            afkMap.set(interaction.user.id, {
                reason,
                timestamp: Date.now()
            });

            await client.successReply(interaction, 'AFK set', `You are now AFK: **${reason}**`, { ephemeral: true });
            return;
        } catch (err) {
            console.error(err);
            await client.errorReply(interaction, 'AFK Error', 'Something went wrong while setting your AFK status.', { ephemeral: true });
            return;
        }
    },
};
