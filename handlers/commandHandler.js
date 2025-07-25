const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const fs = require("fs");
const path = require("path");
const glob = require("glob");

module.exports = (client, logger) => {
  const commands = [];
  const commandFiles = glob.sync("./commands/**/*.js");

  for (const file of commandFiles) {
    const command = require(path.resolve(file));
    if (command.data && command.data.name) {
      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
      logger(`Loaded command: ${command.data.name}`, "cmd");
    } else {
      logger(
        `Command file at ${file} is missing data or data.name property.`,
        "warn"
      );
    }
  }

  const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN);

  (async () => {
    try {
      logger("Started refreshing application (/) commands.", "log");

      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
        body: commands,
      });

      logger("Successfully reloaded application (/) commands.", "ready");
    } catch (error) {
      logger(error, "error");
    }
  })();
};
