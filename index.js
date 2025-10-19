// index.js

require("dotenv").config();
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");
const logger = require("./utils/logger"); // Assuming your logger is here

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// embed helpers attached to client for standardized replies
const { correctEmbed, incorrectEmbed } = require('./utils/embeds');
const { MessageFlags } = require('discord.js');

/**
 * Reply (or edit reply) with a success embed.
 * @param {Interaction} interaction
 * @param {string} title
 * @param {string} description
 * @param {object} options { ephemeral: boolean }
 */
client.successReply = async (interaction, title, description, options = {}) => {
  const embed = correctEmbed(title, description);
  try {
    const flags = options.ephemeral ? MessageFlags.Ephemeral : undefined;
    if (interaction.replied || interaction.deferred) {
      return interaction.editReply({ embeds: [embed], ...(flags ? { flags } : {}) });
    }
    return interaction.reply({ embeds: [embed], ...(flags ? { flags } : {}) });
  } catch (err) {
    logger(`Failed to send success reply: ${err}`, 'error');
  }
};

client.errorReply = async (interaction, title, description, options = {}) => {
  const embed = incorrectEmbed(title, description);
  try {
    const flags = options.ephemeral !== false ? MessageFlags.Ephemeral : undefined;
    if (interaction.replied || interaction.deferred) {
      return interaction.editReply({ embeds: [embed], ...(flags ? { flags } : {}) });
    }
    return interaction.reply({ embeds: [embed], ...(flags ? { flags } : {}) });
  } catch (err) {
    logger(`Failed to send error reply: ${err}`, 'error');
  }
};

// Central state management for the status feature, per guild
client.botState = {}; // Key: guildId, Value: state object

// Helper to get or initialize state for a guild
client.getGuildState = function (guildId) {
  if (!this.botState[guildId]) {
    this.botState[guildId] = {
      statusMessageId: null,
      longestSession: "N/A",
      longestQueue: "N/A",
      updateInterval: null,
    };
  }
  return this.botState[guildId];
};

client.commands = new Collection();

const handlersPath = path.join(__dirname, "handlers");
const handlerFiles = fs
  .readdirSync(handlersPath)
  .filter((file) => file.endsWith(".js"));

for (const file of handlerFiles) {
  const filePath = path.join(handlersPath, file);
  require(filePath)(client, logger);
}

// Global error handlers to help debugging crashes
process.on('unhandledRejection', (reason, promise) => {
  logger(`Unhandled Rejection: ${reason}`,'error');
});

process.on('uncaughtException', (err) => {
  logger(`Uncaught Exception: ${err.stack || err}`,'error');
});

process.on('beforeExit', (code) => {
  logger(`Process beforeExit with code: ${code}`, 'debug');
});

process.on('exit', (code) => {
  logger(`Process exit with code: ${code}`, 'debug');
});

// Wrap login so we catch immediate login rejects
client
  .login(process.env.DISCORD_TOKEN)
  .then(() => {
    logger('Login promise resolved.', 'debug');
  })
  .catch((err) => {
    logger(`Failed to login: ${err}`, 'error');
  });
