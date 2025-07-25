const { Events } = require("discord.js");
const { getGuildConfig } = require("../../utils/db");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client, logger) {
    // --- Button Interaction Handler ---
    if (interaction.isButton()) {
      if (interaction.customId === "session_notifications") {
        const guildId = interaction.guild.id;
        const config = await getGuildConfig(guildId);
        if (!config || !config.notification_role_id) {
          logger(
            `Notification role not set in config for guild ${guildId}.`,
            "error"
          );
          return interaction.reply({
            content:
              "Error: The notification role is not configured. Please contact an admin.",
            ephemeral: true,
          });
        }
        const role = interaction.guild.roles.cache.get(
          config.notification_role_id
        );
        if (!role) {
          logger(
            `Role ${config.notification_role_id} not found in guild ${guildId}.`,
            "error"
          );
          return interaction.reply({
            content: "Error: The notification role was not found.",
            ephemeral: true,
          });
        }
        try {
          await interaction.member.roles.add(role);
          await interaction.reply({
            content: `Success! You will now receive <@&${role.id}> notifications.`,
            ephemeral: true,
          });
        } catch (error) {
          logger(
            `Failed to add role for ${interaction.user.tag}: ${error}`,
            "error"
          );
          await interaction.reply({
            content: "An error occurred while assigning the role.",
            ephemeral: true,
          });
        }
      }
      return;
    }

    // --- Slash Command Handler ---
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      logger(
        `No command matching ${interaction.commandName} was found.`,
        "warn"
      );
      return;
    }

    try {
      await command.execute(interaction, client, logger);
    } catch (error) {
      logger(error, "error");
      const errorMessage = {
        content: "A critical error occurred while executing this command!",
        ephemeral: true,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction
          .followUp(errorMessage)
          .catch((err) =>
            logger(`Failed to send follow-up error: ${err}`, "error")
          );
      } else {
        await interaction
          .reply(errorMessage)
          .catch((err) =>
            logger(`Failed to send initial error reply: ${err}`, "error")
          );
      }
    }
  },
};
