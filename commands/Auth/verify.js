const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Start verification process to link your Roblox account.'),
  async execute(interaction, client) {
    // Compute host for verification server
    const host = process.env.VERIFY_HOST || `http://localhost:${process.env.VERIFY_PORT || 3000}`;

    // prefer global fetch (Node 18+). If not available, try dynamic import of node-fetch.
    let fetchFn = global.fetch;
    if (!fetchFn) {
      try {
        // dynamic import may fail if node-fetch is not installed; we'll catch below
        const nodeFetch = await import('node-fetch');
        fetchFn = nodeFetch.default || nodeFetch;
      } catch (e) {
        return client.errorReply(interaction, 'Fetch unavailable', 'Server-side fetch is not available. Please run on Node 18+ or install node-fetch.');
      }
    }

    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const apiUrl = `${host.replace(/\/$/, '')}/discord/callback`;
      const resp = await fetchFn(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordId: interaction.user.id }),
      });

      if (!resp.ok) {
        let errText = 'Failed to contact verification server.';
        try { const j = await resp.json(); if (j && j.error) errText = j.error; } catch (_) {}
        return client.errorReply(interaction, 'Verification failed', errText);
      }

      const j = await resp.json();
      const url = j.url || j.token ? `${host}/login?token=${j.token}` : null;
      if (!url) return client.errorReply(interaction, 'Verification failed', 'No verification URL returned by the server.');

      // Try to DM the user the verification link
      try {
        await interaction.user.send(`**Click this link to verify your Roblox account:** [oAuth 2.0 Verification](${url})\nThis link expires shortly and can only be used once.`);
        return client.successReply(interaction, 'Verification DM sent', 'I have DMed you a link to verify your Roblox account.');
      } catch (err) {
        // DM failed: show the link ephemeral so the user still has it
        return client.successReply(interaction, 'Verification link', `I couldn't DM you. Here is your verification link: [oAuth 2.0 Verification](${url})`);
      }
    } catch (err) {
      client.errorReply(interaction, 'Error', 'An unexpected error occurred while creating your verification link.');
    }
  },
};
