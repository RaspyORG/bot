const { EmbedBuilder } = require("discord.js");
const botName = process.env.BOT_NAME || 'Raspy';

function correctEmbed(title, description) {
  return new EmbedBuilder()
    .setColor("#1FA048")
    .setTitle(`<:1397922189558153348:1426910253999587430> ${title}`)
    .setDescription(description)
    .setTimestamp()
    .setFooter({ text: `/help | ${botName}` });
}

function incorrectEmbed(title, description) {
  return new EmbedBuilder()
    .setColor("#EA2748")
    .setTitle(`<:1397926547066978454:1426910271049568376> ${title}`)
    .setDescription(description)
    .setTimestamp()
    .setFooter({ text: `/help | ${botName}` });
}

module.exports = {
  correctEmbed,
  incorrectEmbed,
};
