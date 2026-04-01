const { MessageFlags } = require('discord.js');

const DatabaseManager = require("../managers/databaseManager.js");
const DiscordHelper = require("../helpers/discordHelper.js");
const ReminderManager = require("../managers/reminderManager.js");
const ProjectTaskManager = require("../managers/projectTaskManager.js");

function getProjectId(interaction) {
    try {
        return interaction.fields.getStringSelectValues(`deleteReminder`)[0];
    } catch (error) {
        console.log('Something went wrong getting project index!', error);
        return null;
    }
}

module.exports = {
    type: 'startsWith',
    customId: 'deleteReminder:',

    async execute(interaction) {
        await interaction.deferReply({
            flags: MessageFlags.Ephemeral
        });
    
        const [, reminderId] = interaction.customId.split(':');
        const projectId = await getProjectId(interaction);

        const projectExist = DatabaseManager.get(projectId);
        if (projectExist) {
            const reminderMessage = await DiscordHelper.getMessageByURL(interaction.client, projectExist.messageUrl);
            await ProjectTaskManager.deleteProjectTask(reminderMessage);

            const deletedFromDatabase = DatabaseManager.delete(projectId);
            if (!deletedFromDatabase) {
                return interaction.editReply({
                    content: `Failed to remove project data from the database!`
                });
            }
        }
    
        const deletedFromReminder = await ReminderManager.deleteProject(interaction.client, reminderId, projectId);
        if (!deletedFromReminder) {
            return interaction.editReply({
                content: `Failed to remove project from the reminder message!`
            });
        }
    
        return interaction.editReply({
            content: projectId ? `Removed: ${projectId}` : `Removed project from reminder (no database record found).`
        });
    }
};