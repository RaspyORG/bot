const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Lists all available commands."),
  async execute(interaction, client) {
    const helpEmbed = new EmbedBuilder()
      .setColor("1fa048")
      .setTitle("Help")
      .setDescription("List of commands:")
      .setTimestamp();

    const commandFolders = fs.readdirSync(
      path.join(__dirname, "../../commands")
    );

    for (const folder of commandFolders) {
      const commandFiles = fs
        .readdirSync(path.join(__dirname, `../../commands/${folder}`))
        .filter((file) => file.endsWith(".js"));
      const commandList = [];

      for (const file of commandFiles) {
        const command = require(`../../commands/${folder}/${file}`);
        if (command.data) {
          commandList.push(
            `\`/${command.data.name}\` - ${command.data.description}`
          );
        }
      }

      if (commandList.length > 0) {
        helpEmbed.addFields({
          name: `**${folder}**`,
          value: commandList.join("\n"),
          inline: false,
        });
      }
    }

    await interaction.reply({ embeds: [helpEmbed] });
  },
};
