const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check your or another user\'s Roblox verification status.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to check the verification status of')
        .setRequired(false)
    ),
  async execute(interaction, client) {
    const user = interaction.options.getUser('user') || interaction.user; // Get the user from the command or default to the invoking user
    
    try {
      const db = require('../../utils/db');
      await db.connect();
      const record = await db.findOne('verifications', { discordId: user.id });

      if (!record) {
        return client.errorReply(
          interaction,
          'Not verified',
          `${user.tag} does not have a linked Roblox account. Run \`/verify\` to start the process.`
        );
      }

      return client.successReply(
        interaction,
        'Verified',
        `${user.tag}\'s Discord account is linked to Roblox ID: ${record.robloxId}`
      );
    } catch (err) {
      client.errorReply(interaction, 'Error', `Failed to check status: ${err.message}`);
    }
  },
};
