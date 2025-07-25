const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const isOwner = require("../../utils/dev");
const { incorrectEmbed } = require("../../utils/embeds");
const embed = require("./embed");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("interact")
    .setDescription(
      "Owner-only command to demonstrate interactive components."
    ),

  async execute(interaction, client) {
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

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("select_example")
      .setPlaceholder("Choose an option")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Option 1")
          .setValue("option_1"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Option 2")
          .setValue("option_2")
      );
    const button1 = new ButtonBuilder()
      .setCustomId("button_1")
      .setLabel("Click Me")
      .setStyle(ButtonStyle.Primary);
    const button2 = new ButtonBuilder()
      .setCustomId("button_2")
      .setLabel("Another Button")
      .setStyle(ButtonStyle.Secondary);
    const row1 = new ActionRowBuilder().addComponents(selectMenu);
    const row2 = new ActionRowBuilder().addComponents(button1, button2);
    await interaction.reply({
      content: "Please interact with the components below:",
      components: [row1, row2],
    });
  },
};
