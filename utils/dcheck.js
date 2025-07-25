const { EmbedBuilder, Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const logger = require("../utils/logger");
const { getGuildConfig } = require("./db");

// The interval for the entire check-and-notify process.
const CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes
const BASE_ERLC_API_URL = "https://api.policeroleplay.community/v1";

/**
 * Cleans a player's name by removing clan tags and other prefixes.
 * This helps match their Roblox name to their Discord display name.
 * @param {string} name - The raw name to clean.
 * @returns {string} The cleaned, lowercase name.
 */
function cleanName(name) {
  if (!name) return "";
  let namePart = name.split("|").pop().trim();
  const separators = [" - ", "-", " ~ ", "~"];
  for (const sep of separators) {
    if (namePart.includes(sep)) {
      namePart = namePart.split(sep).pop().trim();
    }
  }
  return namePart.toLowerCase();
}

/**
 * Checks if a given Roblox username is present in the Discord server's members.
 * It compares against both their display name and username.
 * @param {string} username - The Roblox username.
 * @param {import('discord.js').Guild} guild - The Discord guild object.
 * @returns {Promise<boolean>} - True if a match is found, otherwise false.
 */
async function checkPlayerInDiscord(username, guild) {
  const cleanedRobloxName = cleanName(username);
  if (!cleanedRobloxName) {
    logger.debug(`Skipping check for empty Roblox name.`);
    return false;
  }
  logger.debug(
    `Starting check for Roblox user: "${username}" (Cleaned: "${cleanedRobloxName}")`
  );

  const member = guild.members.cache.find((m) => {
    const cleanedDisplayName = cleanName(m.displayName);
    const cleanedUsername = cleanName(m.user.username);
    return (
      cleanedDisplayName === cleanedRobloxName ||
      cleanedUsername === cleanedRobloxName
    );
  });

  if (member) {
    logger.debug(
      `✔️ SUCCESS: Found match for "${cleanedRobloxName}" -> Discord user "${member.user.tag}"`
    );
    return true;
  } else {
    logger.debug(
      `❌ FAILED: No match found for "${cleanedRobloxName}" in the server member list.`
    );
    return false;
  }
}

/**
 * Fetches ERLC players, checks who is not in Discord, sends a report,
 * and sends an in-game PM to those not in the server.
 * This is the primary consolidated task.
 * @param {Client} client - The Discord client instance.
 */
async function runErlcCheckAndPmTask(client, guildId) {
  logger.info("--- Starting ERLC Player Check & PM Task ---");
  const config = await getGuildConfig(guildId);
  if (!config) {
    logger.error(`Task failed: Guild config not set up for guild ${guildId}.`);
    return;
  }
  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    logger.error(`Task failed: Guild with ID ${guildId} not found.`);
    return;
  }
  const warningChannel = client.channels.cache.get(config.warning_channel_id);
  if (!warningChannel) {
    logger.error(
      `Task failed: Channel with ID ${config.warning_channel_id} not found.`
    );
    return;
  }

  try {
    // 1. Fetch latest server members to ensure our cache is up-to-date
    logger.debug(`Fetching latest member list for guild "${guild.name}"...`);
    await guild.members.fetch();
    logger.debug(
      `Member list fetched. Cached members: ${guild.members.cache.size}`
    );

    // 2. Get the current player list from the ERLC API
    const headers = { "Server-Key": config.erlc_api_key };
    const playersResponse = await axios.get(
      `${BASE_ERLC_API_URL}/server/players`,
      { headers }
    );
    const playersData = playersResponse.data;
    logger.info(
      `API call successful. Received data for ${playersData.length} player(s).`
    );

    if (!Array.isArray(playersData) || playersData.length === 0) {
      logger.info(
        "Server is empty or data is invalid. Ending task for this cycle."
      );
      return;
    }

    // 3. Sort players into two lists: those in Discord and those not.
    const inDiscord = [];
    const notInDiscord = [];
    for (const player of playersData) {
      const playerNameRoblox = player.Player.split(":")[0];
      if (!playerNameRoblox) continue;

      if (await checkPlayerInDiscord(playerNameRoblox, guild)) {
        inDiscord.push(playerNameRoblox);
      } else {
        notInDiscord.push(playerNameRoblox);
      }
    }
    logger.info(
      `Check complete. In Discord: ${inDiscord.length}, Not in Discord: ${notInDiscord.length}`
    );

    // 4. Send the summary embed to the designated warning channel
    const embed = new EmbedBuilder()
      .setTitle("Raspy Discord Check")
      .setColor(notInDiscord.length > 0 ? "#ff4747" : "#47ff6f")
      .setTimestamp()
      .addFields(
        {
          name: `<:icon:1397922189558153348> Players in Discord (${inDiscord.length})`,
          value: `\`\`\`\n${
            inDiscord.join("\n") || "All players are in Discord."
          }\n\`\`\``,
          inline: false,
        },
        {
          name: `<:icon1:1397926547066978454> Players NOT in Discord (${notInDiscord.length})`,
          value: `\`\`\`\n${
            notInDiscord.join("\n") || "All players are in Discord."
          }\n\`\`\``,
          inline: false,
        }
      )
      .setFooter({ text: "Staff, please ask players not in Discord to join." });

    const content =
      notInDiscord.length > 0 && config.on_duty_role_id
        ? `<@&${config.on_duty_role_id}>`
        : "";
    await warningChannel.send({
      content: content || undefined,
      embeds: [embed],
    });
    logger.info(`Successfully sent check results to #${warningChannel.name}.`);

    // 5. **NEW:** If there are players not in Discord, immediately send them a PM.
    if (notInDiscord.length > 0) {
      logger.info(`Attempting to send PM to ${notInDiscord.length} player(s).`);
      const playersStr = notInDiscord.join(",");
      const command = `:pm ${playersStr} ⚠️ You are required to be in our comms server. Please join with code: ${config.discord_invite}`;

      try {
        await axios.post(
          `${BASE_ERLC_API_URL}/server/command`,
          { command },
          { headers }
        );
        logger.info(
          `<:icon:1397922189558153348> Successfully sent PM command for: ${playersStr}`
        );
      } catch (pmError) {
        logger.error(
          "<:icon1:1397926547066978454> Error during PM task API call."
        );
        if (pmError.response) {
          logger.error(`API Response Status: ${pmError.response.status}`);
          logger.error(
            `API Response Data: ${JSON.stringify(pmError.response.data)}`
          );
        } else {
          logger.error(`Full Error Object: ${pmError.message}`);
        }
      }
    }
  } catch (error) {
    logger.error(`Error during player check: ${error.message}`);
  } finally {
    logger.info("--- ERLC Player Check & PM Task finished ---");
  }
}

/**
 * Initializes the bot's scheduled tasks.
 * @param {Client} client
 */
function initialize(client, guildId) {
  logger.info("Initializing DCheck Manager (ERLC-only)...");

  if (!client.options.intents.has(GatewayIntentBits.GuildMembers)) {
    logger.error(
      "FATAL: The 'GuildMembers' intent is missing. The bot cannot see the full member list and will not work correctly."
    );
    logger.warn(
      "1. Enable the 'SERVER MEMBERS INTENT' in your bot's settings on the Discord Developer Portal."
    );
    logger.warn(
      "2. Add 'GatewayIntentBits.GuildMembers' to the intents array in your main bot file (e.g., index.js)."
    );
    return;
  }

  const scheduleTask = (taskFn, interval, taskName) => {
    (async function run() {
      try {
        await taskFn(client, guildId);
      } catch (e) {
        logger.error(
          `Unhandled error in scheduled task '${taskName}': ${e.message}`
        );
      } finally {
        setTimeout(run, interval);
      }
    })();
  };

  getGuildConfig(guildId).then((config) => {
    logger.info(
      "DEBUG: Loaded config for guild",
      guildId,
      JSON.stringify(config)
    );
    if (
      config &&
      typeof config.erlc_api_key === "string" &&
      config.erlc_api_key.trim() !== "" &&
      typeof config.warning_channel_id === "string" &&
      config.warning_channel_id.trim() !== ""
    ) {
      logger.info("ERLC configuration found. Scheduling unified task...");
      scheduleTask(
        runErlcCheckAndPmTask,
        CHECK_INTERVAL,
        "ERLC Check & PM Task"
      );
    } else {
      logger.warn("One or more guilds have not set up the bot.");
    }
  });
}

module.exports = { initialize, runErlcCheckAndPmTask };
