// events/client/ready.js

const { Events } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(readyClient, client, logger) {
    logger(`${readyClient.user.tag} is now online and ready!`, "ready");
    client.user.setPresence({
      activities: [{ name: "🔧 /help | MDOT", type: 4 }],
      status: "idle",
    });
  },
};
