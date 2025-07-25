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

client.login(process.env.DISCORD_TOKEN);
