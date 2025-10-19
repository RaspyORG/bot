// events/client/ready.js

const { Events } = require("discord.js");
const botName = process.env.BOT_NAME || 'Raspy';

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(readyClient, client, logger) {
    logger(`${readyClient.user.tag} is now online and ready!`, "ready");
    client.user.setPresence({
      activities: [{ name: `🔧 /help | ${botName}`, type: 4 }],
      status: "idle",
    });
  },
};
