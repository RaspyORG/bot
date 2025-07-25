const { EmbedBuilder } = require("discord.js");

function correctEmbed(title, description) {
  return new EmbedBuilder()
    .setColor("#1FA048")
    .setTitle(`<:icon:1397922189558153348> ${title}`)
    .setDescription(description)
    .setTimestamp()
    .setFooter({ text: "/help | Raspy" });
}

function incorrectEmbed(title, description) {
  return new EmbedBuilder()
    .setColor("#EA2748")
    .setTitle(`<:icon1:1397926547066978454> ${title}`)
    .setDescription(description)
    .setTimestamp()
    .setFooter({ text: "/help | Raspy" });
}

module.exports = {
  correctEmbed,
  incorrectEmbed,
};
