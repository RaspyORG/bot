const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const fs = require("fs");
const path = require("path");
const glob = require("glob");

module.exports = (client, logger) => {
  // Helper to determine whether to register commands globally or to a single guild
  const guildId = process.env.GUILD_ID || process.env.DEV_GUILD_ID || null;

  const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN);

  // load all command files and populate client.commands. Returns array suitable for REST registration.
  const loadCommands = () => {
    const commands = [];
    // Use absolute glob to avoid duplicate relative matches and ensure consistent paths
    let absolutePattern = path.join(__dirname, "..", "commands", "**", "*.js");
    // glob on Windows works more reliably with forward slashes
    absolutePattern = absolutePattern.replace(/\\/g, "/");
    let commandFiles = glob.sync(absolutePattern);

    // Fallback to relative pattern if absolute didn't find anything (handles some envs)
    if (!commandFiles || commandFiles.length === 0) {
      commandFiles = glob.sync("./commands/**/*.js");
    }

    // Clear the existing collection so reloads replace previous commands
    client.commands.clear();

    const seen = new Set();

    for (const file of commandFiles) {
      try {
        const resolved = path.resolve(file);
        if (seen.has(resolved)) continue; // skip duplicates
        seen.add(resolved);

        const command = require(resolved);
        if (command && command.data && command.data.name) {
          client.commands.set(command.data.name, command);
          commands.push(command.data.toJSON());
          logger(`Loaded command: ${command.data.name}`, "cmd");
        } else {
          logger(
            `Command file at ${file} is missing data or data.name property.`,
            "warn"
          );
        }
      } catch (err) {
        logger(`Failed to load command at ${file}: ${err.message}`, "error");
      }
    }

    logger(`Command files discovered: ${commandFiles.length}, unique: ${seen.size}`, "debug");

    return commands;
  };

  // Function to register commands with Discord (global or guild)
  const registerCommands = async (commands) => {
    try {
      logger("Started refreshing application (/) commands.", "log");

      if (guildId) {
        // Clear global commands so we don't end up with duplicate global + guild commands
        try {
          await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
          logger('Cleared global application commands before registering guild commands.', 'debug');
        } catch (err) {
          logger(`Failed to clear global commands: ${err}`, 'warn');
        }
        await rest.put(
          Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
          { body: commands }
        );
        logger(`Successfully reloaded application (/) commands to guild ${guildId}.`, "ready");
      } else {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
          body: commands,
        });
        logger("Successfully reloaded global application (/) commands.", "ready");
      }
    } catch (error) {
      logger(error, "error");
    }
  };

  // Expose a reload helper on the client to allow runtime command refresh without restarting
  client.reloadCommands = async () => {
    try {
      logger('Reloading commands (client.reloadCommands) started.', 'log');
      // Find all command files, clear require cache for them, then reload and register
      const commandFiles = glob.sync("./commands/**/*.js");

      for (const file of commandFiles) {
        try {
          const resolved = path.resolve(file);
          if (require.cache[resolved]) {
            delete require.cache[resolved];
            logger(`Cleared require cache for ${resolved}`, 'debug');
          }
        } catch (err) {
          logger(`Error clearing cache for ${file}: ${err}`, 'warn');
        }
      }

      const commands = loadCommands();
      await registerCommands(commands);
      logger('Reloading commands finished successfully.', 'ready');
    } catch (err) {
      logger(`client.reloadCommands failed: ${err}`, 'error');
      throw err;
    }
  };

  // Initial load + register
  const initialCommands = loadCommands();
  registerCommands(initialCommands);
};
