const { PermissionsBitField, MessageFlags } = require("discord.js");

const DatabaseManager = require("../../managers/databaseManager.js");
const DiscordHelper = require("../../helpers/discordHelper.js");
const EditorsHelper = require("../../helpers/editorsHelper.js");
const ProjectTaskReminder = require("../../managers/projectTaskManager.js");
const ReminderManager = require("../../managers/reminderManager.js");

module.exports = {
    type: 'startsWith',
    customId: 'editorSwap',

    async execute(interaction) {
        await interaction.deferUpdate();
        const [id, projectId, swapEditorId] = interaction.customId.split(':');

        if (!interaction.user.id === swapEditorId) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.followUp({
                    content: `Only the requested editor can click this button!`,
                    flags: MessageFlags.Ephemeral
                });
            }

            return interaction.followUp({
                content: `Only editor can click this button, please recreate the project task instead!`,
                flags: MessageFlags.Ephemeral
            });
        }

        const result = id.slice(10);
        if (result === 'Decline') {
            await interaction.deleteReply();

            return interaction.followUp({
                content: 'Editor swap declined successfully!',
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            const projectData = DatabaseManager.get(projectId);
            if (!projectData) {
                return interaction.followUp({
                    content: `Project not found! Project's data is not in the database.`,
                });
            }

            const taskMessage = await DiscordHelper.getMessageByURL(interaction.client, projectData.messageUrl);
            if (!taskMessage) {
                return interaction.followUp({
                    content: `Project task message not found!`,
                    flags: MessageFlags.Ephemeral
                });
            }

            const editorChannel = await EditorsHelper.getChannel(interaction.client, projectData.task?.editorId);
            if (!editorChannel) {
                return interaction.followUp({
                    content: `Can't find requesing editor's channel!`
                });
            }

            const originalData = structuredClone(projectData);

            const newProjectData = {
                ...projectData,
                task: {
                    ...projectData?.task,
                    editorId: swapEditorId
                }
            };

            const messageEdited = await ProjectTaskReminder.editProjectTask(taskMessage, newProjectData);
            if (!messageEdited) {
                return interaction.followUp({
                    content: `Failed to update task message! No changes made...`
                });
            }

            const reminderUpdated = await ReminderManager.editProject(interaction.client, newProjectData);
            if (!reminderUpdated) {
                await ProjectTaskReminder.editProjectTask(taskMessage, originalData);
                return interaction.followUp({
                    content: `Failed to update reminder message! Rolling back changes...`
                });
            }

            const databaseUpdated = DatabaseManager.set(newProjectData.id, newProjectData);
            if (!databaseUpdated) {
                await ProjectTaskReminder.editProjectTask(taskMessage, originalData);
                await ReminderManager.editProject(interaction.client, originalData);
                return interaction.followUp({
                    content: `Failed to update task database! Rolling back changes...`
                });
            }

            await interaction.deleteReply();

            await interaction.followUp({
                content: 'Editor swap accepted successfully!',
                flags: MessageFlags.Ephemeral
            });

        } catch (error) {
            console.error(`Swap result failed:`, error);

            await interaction.followUp({
                content: `Something went wrong! Please try again...`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
};