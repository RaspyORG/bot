const { Events, MessageFlags } = require('discord.js');
const { correctEmbed, incorrectEmbed } = require('../../utils/embeds');

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client, logger) {
    try {
      if (!interaction.isCommand()) return;

      const command = client.commands.get(interaction.commandName);
      if (!command) {
        logger(`No command matching ${interaction.commandName} was found.`, 'warn');
  return interaction.reply({ embeds: [incorrectEmbed('Command not found', `The command \"/${interaction.commandName}\" could not be found.`)], flags: MessageFlags.Ephemeral });
      }

      await command.execute(interaction, client, logger);
    } catch (error) {
      logger(error, 'error');
      try {
        const embed = incorrectEmbed('Execution Error', 'There was an error while executing this command.');
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply({ embeds: [embed] });
        } else {
          await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
      } catch (err) {
        logger(`Failed to send error reply: ${err}`, 'error');
      }
    }
  },
};
