const { SlashCommandBuilder, PermissionFlagsBits, ActivityType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('presence')
    .setDescription('Set the bot presence (status and activity)')
    .addStringOption(opt =>
      opt.setName('status')
        .setDescription('Visible status for the bot')
        .setRequired(true)
        .addChoices(
          { name: 'Online', value: 'online' },
          { name: 'Idle', value: 'idle' },
          { name: 'Do Not Disturb', value: 'dnd' },
          { name: 'Invisible', value: 'invisible' }
        ))
    .addStringOption(opt =>
      opt.setName('activity_type')
        .setDescription('Type of activity')
        .setRequired(true)
        .addChoices(
          { name: 'Playing', value: 'PLAYING' },
          { name: 'Watching', value: 'WATCHING' },
          { name: 'Listening', value: 'LISTENING' },
          { name: 'Competing', value: 'COMPETING' }
        ))
    .addStringOption(opt =>
      opt.setName('activity')
        .setDescription('Activity text')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    // Permission check: owner (via utils/dev.js) or ManageGuild
    const isOwner = require('../../utils/dev')(interaction.user.id);
    const member = interaction.member;
    const canManage = member && (member.permissions && member.permissions.has && member.permissions.has(PermissionFlagsBits.ManageGuild));
    if (!isOwner && !canManage) {
      return client.errorReply(interaction, 'Permission denied', 'You must be the bot owner or have Manage Guild permission to change presence.');
    }

    const status = interaction.options.getString('status');
    const activityTypeRaw = interaction.options.getString('activity_type');
    const activityText = interaction.options.getString('activity');

    // Map choice string to ActivityType
    const typeMap = {
      'PLAYING': ActivityType.Playing,
      'WATCHING': ActivityType.Watching,
      'LISTENING': ActivityType.Listening,
      'COMPETING': ActivityType.Competing,
    };

    const activityType = typeMap[activityTypeRaw] || ActivityType.Playing;

    try {
      // Set presence
      if (client.user) {
        await client.user.setPresence({ activities: [{ name: activityText, type: activityType }], status });
        return client.successReply(interaction, 'Presence updated', `Status set to **${status}** and activity **${activityText}** (${activityTypeRaw}).`, { ephemeral: true });
      } else {
        return client.errorReply(interaction, 'Client not ready', 'Bot client is not ready to set presence yet.');
      }
    } catch (err) {
      client.errorReply(interaction, 'Failed', `Failed to set presence: ${err.message || err}`);
    }
  }
};
