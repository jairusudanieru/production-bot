const { MessageFlags } = require("discord.js");

const DatabaseManager = require("../managers/databaseManager.js");
const EditorsHelper = require("../helpers/editorsHelper.js");
const EditorSwapManager = require("../managers/editorSwapManager.js");

module.exports = {
    type: 'startsWith',
    customId: 'swapRequest:',
    async execute(interaction) {
        const [, projectId] = interaction.customId.split(':');
        const projectData = DatabaseManager.get(projectId);
        if (!projectData) {
            return interaction.reply({
                content: `Project not found! Project's data is not in the database.`,
                flags: MessageFlags.Ephemeral
            });
        }

        const updatedProjectData = {
            swapOriginalEditorId: interaction.user.id,
            swapEditorId: interaction.fields.getSelectedUsers('swapEditor')?.first().id || '',
            swapReason: interaction.fields.getTextInputValue('swapReason') || '',
        };

        const requestedEditorChannel = await EditorsHelper.getChannel(interaction.client, updatedProjectData.swapEditorId);
        if (!requestedEditorChannel) {
            return interaction.reply({
                content: `Can't find the selected editor!`,
                flags: MessageFlags.Ephemeral
            });
        }

        const newProjectData = {
            ...projectData,
            swap: {
                ...updatedProjectData
            }
        };

        const databaseUpdated = DatabaseManager.set(projectId, newProjectData);
        if (!databaseUpdated) {
            return interaction.reply({
                content: 'Failed to save swap data!',
                flags: MessageFlags.Ephemeral
            });
        }

        const request = await EditorSwapManager.sendEditorRequest(requestedEditorChannel, newProjectData);
        if (!request) {
            return interaction.reply({
                content: `Failed to send the request message!`,
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.reply({
            content: `Request Submitted! ${request.url}`,
            flags: MessageFlags.Ephemeral
        });
    },
};
