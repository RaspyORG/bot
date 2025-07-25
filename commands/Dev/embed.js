const {
  SlashCommandBuilder,
  ContainerBuilder,
  MediaGalleryBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const { getGuildConfig } = require("../../utils/db");
const isOwner = require("../../utils/dev");
const { incorrectEmbed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("components")
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

    const guildId = interaction.guild.id;
    const config = await getGuildConfig(guildId);
    if (!config || !config.owner_id) {
      return interaction.reply({
        content: "This command can only be used by the bot owner.",
        ephemeral: true,
      });
    }
    if (interaction.user.id !== config.owner_id.toString()) {
      return interaction.reply({
        content: "This command can only be used by the bot owner.",
        ephemeral: true,
      });
    }
    const mediaGallery = new MediaGalleryBuilder().addItems((item) =>
      item
        .setDescription(
          "Alt text displaying on an image from the AttachmentBuilder"
        )
        .setURL("https://imgur.com/TMkTsgn.png")
    );
    const mainContainer = new ContainerBuilder()
      .addMediaGalleryComponents(() => mediaGallery)
      .addSeparatorComponents((separator) => separator)
      .addSectionComponents((section) =>
        section
          .addTextDisplayComponents(
            (textDisplay) =>
              textDisplay.setContent("### example server Roleplay Sessions"),
            (textDisplay) =>
              textDisplay.setContent(
                "Welcome to the sessions channel. \nYou will find information regarding the server status here. \nSessions will be hosted at the discretion of the staff team."
              ),
            (textDisplay) =>
              textDisplay.setContent(
                "And you can place one button or one thumbnail component next to it!"
              )
          )
          .setButtonAccessory((button) =>
            button
              .setCustomId("exampleButton")
              .setLabel("Server Offline")
              .setStyle(ButtonStyle.Danger)
          )
      )
      .addSeparatorComponents((separator) => separator);
    await interaction.reply({
      components: [mainContainer],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
