// events/client/ready.js

const { Events } = require("discord.js");
const { updateStatus } = require("../../utils/statusUpdater"); // Import the new utility
const dcheckManager = require("../../utils/dcheck");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(readyClient, client, logger) {
    logger(`${readyClient.user.tag} is now online and ready!`, "ready");
    client.user.setPresence({
      activities: [{ name: "🔧 /help | Rapsy", type: 4 }],
      status: "dnd",
    });
    // Fix: Always pass a valid guild ID to dcheckManager.initialize
    if (client.guilds.cache.size === 0) {
      logger(
        "No guilds found for this bot. DCheck will not initialize.",
        "error"
      );
    } else {
      for (const [guildId] of client.guilds.cache) {
        dcheckManager.initialize(client, guildId);
      }
    }

    // --- Add this block to start the status update loop ---
    if (!client.botState.updateInterval) {
      logger("Starting status update loop (runs every 60 seconds).", "log");

      // Run the update task every 60 seconds
      client.botState.updateInterval = setInterval(() => {
        for (const [guildId] of client.guilds.cache) {
          updateStatus(client, logger, guildId);
        }
      }, 60 * 1000);
    }
    // --------------------------------------------------
  },
};
