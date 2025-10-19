const afkMap = require('../../utils/afkMap');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        const userId = message.author.id;

        // 1. Remove AFK if the author is AFK
        if (afkMap.has(userId)) {
            afkMap.delete(userId);
            try {
                await message.reply('👋 Welcome back! I removed your AFK status.');
            } catch (err) {
                console.error('AFK removal message failed:', err);
            }
        }

        // 2. Mention check
        for (const mention of message.mentions.users.values()) {
            if (afkMap.has(mention.id)) {
                const { reason, timestamp } = afkMap.get(mention.id);
                const timeAgo = `<t:${Math.floor(timestamp / 1000)}:R>`;
                try {
                    await message.reply(`📢 ${mention.tag} is AFK: **${reason}** (since ${timeAgo})`);
                } catch (err) {
                    console.error('AFK mention message failed:', err);
                }
            }
        }
    }
};
