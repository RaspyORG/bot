const { EmbedBuilder } = require("discord.js");

function correctEmbed(title, description) {
  return new EmbedBuilder()
    .setColor("#1FA048")
    .setTitle(`<:1397922189558153348:1426910253999587430> ${title}`)
    .setDescription(description)
    .setTimestamp()
    .setFooter({ text: "/help | MDOT" });
}

function incorrectEmbed(title, description) {
  return new EmbedBuilder()
    .setColor("#EA2748")
    .setTitle(`<:1397926547066978454:1426910271049568376> ${title}`)
    .setDescription(description)
    .setTimestamp()
    .setFooter({ text: "/help | MDOT" });
}

module.exports = {
  correctEmbed,
  incorrectEmbed,
};
