const { PermissionsBitField, MessageFlags } = require("discord.js");

const DatabaseManager = require("../../managers/databaseManager.js");
const DiscordHelper = require("../../helpers/discordHelper.js");
const EditorsHelper = require("../../helpers/editorsHelper.js");
const EditorSwapManager = require("../../managers/editorSwapManager.js");

module.exports = {
    type: 'startsWith',
    customId: 'editorSwap',

    async execute(interaction) {
        await interaction.deferUpdate();
        const [id, projectId, swapEditorId] = interaction.customId.split(':');

        if (interaction.user.id !== swapEditorId) {
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

        const projectData = DatabaseManager.get(projectId);
        if (!projectData) {
            return interaction.followUp({
                content: `Project not found! Project's data is not in the database.`,
                flags: MessageFlags.Ephemeral
            });
        }

        const result = id.slice(10);
        if (result === 'Decline') {
            const message = await EditorSwapManager.editEditorRequest(interaction.message, projectData, 'decline');
            if (!message) {
                return interaction.followUp({
                    content: 'Failed to decline swap request!',
                    flags: MessageFlags.Ephemeral
                });
            }

            return interaction.followUp({
                content: 'Editor swap declined successfully!',
                flags: MessageFlags.Ephemeral
            });;
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
                content: `Can't find requesing editor's channel!`,
                flags: MessageFlags.Ephemeral
            });
        }

        const confirmMessage = await EditorSwapManager.sendSwapConfirmation(interaction.message, projectData);
        if (!confirmMessage) {
            return interaction.followUp({
                content: 'Failed to send confirm message!',
                flags: MessageFlags.Ephemeral
            });
        }

        const message = await EditorSwapManager.editEditorRequest(interaction.message, projectData, 'accept');
        if (!message) {
            return interaction.followUp({
                content: 'Failed to accept swap request!',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};