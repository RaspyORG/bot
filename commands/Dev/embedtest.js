const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { correctEmbed, incorrectEmbed } = require("../../utils/embeds");
const isOwner = require("../../utils/dev");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("embedtest")
    .setDescription("Test the embed functionality")
    .addStringOption((option) =>
      option
        .setName("category")
        .setDescription("The gif category")
        .setRequired(true)
        .addChoices(
          { name: "Correct", value: "correct" },
          { name: "Incorrect", value: "incorrect" }
        )
    ),

  async execute(interaction) {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          incorrectEmbed(
            "Permission Denied",
            "You do not have permission to use this command."
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const category = interaction.options.getString("category");

    let embed;
    if (category === "correct") {
      embed = correctEmbed(
        "Action Completed",
        "Action has been completed successfully."
      );
    } else {
      embed = incorrectEmbed(
        "Action Failed",
        "There was an error completing the action."
      );
    }

    await interaction.reply({
      embeds: [embed],
    });
  },
};
