const { ActivityType, Events } = require("discord.js");

const DatabaseManager = require("../managers/databaseManager.js");

async function setPresence(client) {
    await client.user.setPresence({
        activities: [{
            type: ActivityType.Custom,
            name: 'custom',
            state: ' ',
        }],
        status: 'online'
    });
}

function startCleanupTask() {
    const runCleanup = () => {
        const deleted = DatabaseManager.cleanup(30);
        console.log(`\nCleaned up ${deleted} old projects.`);
    };

    runCleanup();

    setInterval(runCleanup, 1000 * 60 * 60 * 24);
}

module.exports = {
    name: Events.ClientReady,
    once: true,

    async execute(client) {
        await setPresence(client);
        
        console.log(`Ready! logged in as ${client.user.tag}`);

        startCleanupTask();
    },
};