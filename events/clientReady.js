const { ActivityType, Events } = require("discord.js");

module.exports = {
    name: Events.ClientReady,
    once: true,

    async execute(client) {
        await client.user.setPresence({
            activities: [{
                type: ActivityType.Custom,
                name: 'custom',
                state: ' ',
            }],
            status: 'online'
        });

        console.log(`Ready! logged in as ${client.user.tag}`)
    },
};