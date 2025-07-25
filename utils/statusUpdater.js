// utils/statusUpdater.js

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const axios = require("axios");
const pool = require("./db");
const { getGuildConfig } = require("./db");

// Helper: Get status for a guild
async function getGuildStatus(guildId) {
  const { rows } = await pool.query(
    "SELECT * FROM guild_status WHERE guild_id = $1",
    [guildId]
  );
  return rows[0] || null;
}

// Helper: Set status for a guild
async function setGuildStatus(
  guildId,
  { statusMessageId, longestSession, longestQueue }
) {
  await pool.query(
    `INSERT INTO guild_status (guild_id, status_message_id, longest_session, longest_queue)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (guild_id) DO UPDATE SET
       status_message_id = EXCLUDED.status_message_id,
       longest_session = EXCLUDED.longest_session,
       longest_queue = EXCLUDED.longest_queue`,
    [guildId, statusMessageId, longestSession, longestQueue]
  );
}

// --- API error logger unchanged ---
function logApiError(error, endpointName, logger) {
  logger(
    `Failed to fetch data from PRC API endpoint: [${endpointName}]`,
    "error"
  );
  if (error.response) {
    logger(
      `- Status: ${error.response.status} ${error.response.statusText}`,
      "error"
    );
    logger(
      `- API Response Data: ${JSON.stringify(error.response.data)}`,
      "error"
    );
    if (error.response.status === 403) {
      logger(
        `[ACTION REQUIRED] The API returned a 403 Forbidden error. This almost always means your SERVER_TOKEN is incorrect, expired, or does not have permission for this endpoint. Please verify your .env file.`,
        "warn"
      );
    }
  } else if (error.request) {
    logger(
      "- Error: No response received from the server. This could be a network issue, a firewall block, or the API endpoint is down.",
      "error"
    );
  } else {
    logger(
      `- Error: Axios request setup failed. Message: ${error.message}`,
      "error"
    );
  }
}

// Main status update function
async function updateStatus(client, logger, guildId) {
  const config = await getGuildConfig(guildId);
  if (!config || !config.channel_id) {
    logger(
      `[Status Update] Channel with ID undefined not found (config missing or channel_id not set for guild ${guildId}).`,
      "warn"
    );
    return;
  }
  const CHANNEL_ID = config.channel_id;
  const status = await getGuildStatus(guildId);
  if (!status || !status.status_message_id) return;
  const channel = client.channels.cache.get(CHANNEL_ID);
  if (!channel) {
    return logger(
      `[Status Update] Channel with ID ${CHANNEL_ID} not found (guild ${guildId}).`,
      "error"
    );
  }
  const headers = { "server-key": config.erlc_api_key };
  let playerData = null;
  let queueData = null;
  try {
    const playerResponse = await axios.get(
      "https://api.policeroleplay.community/v1/server/players",
      { headers }
    );
    playerData = playerResponse.data;
  } catch (error) {
    logApiError(error, "server/players", logger);
  }
  try {
    const queueResponse = await axios.get(
      "https://api.policeroleplay.community/v1/server/queue",
      { headers }
    );
    queueData = queueResponse.data;
  } catch (error) {
    logApiError(error, "server/queue", logger);
  }
  const playerCount = Array.isArray(playerData)
    ? playerData.filter((p) => p.Player !== "Remote Server").length
    : "Error";
  const queueCount = Array.isArray(queueData) ? queueData.length : "Error";
  const isOnline = typeof playerCount === "number" && playerCount > 0;
  let staffCount = 0;
  const guild = client.guilds.cache.get(guildId);
  if (guild) {
    const onDutyRole = guild.roles.cache.get(config.on_duty_role_id);
    if (onDutyRole) {
      await guild.members.fetch();
      staffCount = onDutyRole.members.size;
    }
  }
  logger(
    `[Status Update] Players: ${playerCount}, Staff: ${staffCount}, Queue: ${queueCount}`,
    "log"
  );
  const embed1 = new EmbedBuilder()
    .setColor("#3d4fab")
    .setImage("https://i.imgur.com/qNU99XK.png");
  const embed2 = new EmbedBuilder()
    .setColor("#3d4fab")
    .setTitle("**Server Sessions**")
    .setDescription(
      "Welcome!\n\n" +
        `- **Longest Session:** ${status.longest_session || "N/A"}\n` +
        `- **Longest Queue:** ${status.longest_queue || "N/A"}\n\n` +
        `### Last Updated: <t:${Math.floor(Date.now() / 1000)}:R>`
    )
    .setFields(
      { name: "Players", value: `${playerCount}`, inline: true },
      { name: "On-Duty Staff", value: `${staffCount}`, inline: true },
      { name: "Queue", value: `${queueCount}`, inline: true }
    )
    .setImage("https://i.imgur.com/yJx0Y4e.png");
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("serverstatus_indicator")
      .setLabel(isOnline ? "Server Online" : "Server Offline")
      .setStyle(isOnline ? ButtonStyle.Success : ButtonStyle.Danger)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId("session_notifications")
      .setLabel("Session Notifications")
      .setStyle(ButtonStyle.Primary)
  );
  if (isOnline) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel("Quick Join")
        .setURL("https://policeroleplay.community/join?code=dot")
        .setStyle(ButtonStyle.Link)
    );
  }
  try {
    const message = await channel.messages.fetch(status.status_message_id);
    await message.edit({ embeds: [embed1, embed2], components: [row] });
  } catch (e) {
    logger(`Failed to edit Discord status message: ${e.message}`, "error");
  }
}

const hasRole = (member, roleIds) => {
  if (!roleIds) return false;
  const ids = roleIds.split(",");
  return member.roles.cache.some((role) => ids.includes(role.id));
};

module.exports = { updateStatus, hasRole, getGuildStatus, setGuildStatus };
