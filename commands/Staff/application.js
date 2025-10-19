const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('application')
    .setDescription('Approve or deny a user\'s application.')
    .addSubcommand(sub =>
      sub
        .setName('approve')
        .setDescription('Approve an application.')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('The user to approve')
            .setRequired(true))
        .addStringOption(opt =>
          opt.setName('application')
            .setDescription('Application name')
            .setRequired(true))
        .addStringOption(opt =>
          opt.setName('reason')
            .setDescription('Reason for approval')
            .setRequired(false)))
    .addSubcommand(sub =>
      sub
        .setName('deny')
        .setDescription('Deny an application.')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('The user to deny')
            .setRequired(true))
        .addStringOption(opt =>
          opt.setName('application')
            .setDescription('Application name')
            .setRequired(true))
        .addStringOption(opt =>
          opt.setName('reason')
            .setDescription('Reason for denial')
            .setRequired(false))),
  
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('user');
    const applicationName = interaction.options.getString('application');
    const reason = interaction.options.getString('reason') || 'No reason provided.';
    const staffUser = interaction.user;

    const approvedEmoji = '<:9294passed:1427358973824336094>';
    const deniedEmoji = '<:3595failed:1427358984502775859>';

    const embed = new EmbedBuilder()
      .setTitle(`${sub === 'approve' ? approvedEmoji : deniedEmoji} ${applicationName} | Response (${sub.charAt(0).toUpperCase() + sub.slice(1)})`)
      .setDescription(
        `${targetUser}’s application was **${sub}d** by ${staffUser}\n\n` +
        `**Reason:**\n\`\`\`\n${reason}\n\`\`\``
      )
      .setColor(sub === 'approve' ? 0x57F287 : 0xED4245)
      .setFooter({ text: `Application: ${applicationName}` })
      .setTimestamp();  // ← use native timestamp

    await interaction.reply({
      content: `${targetUser}`,
      embeds: [embed],
    });
  },
};
