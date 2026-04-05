const { MessageFlags, ContainerBuilder, TextDisplayBuilder } = require("discord.js");

const DatabaseManager = require("../../managers/databaseManager.js");
const EditorsHelper = require("../../helpers/editorsHelper.js");
const FormatsHelper = require("../../helpers/formatsHelper.js");

module.exports = {
    type: 'startsWith',
    customId: 'editorNotify',

    async execute(interaction) {
        await interaction.deferUpdate();

        const [id, projectId] = interaction.customId.split(':');

        const projectData = DatabaseManager.get(projectId);
        if (!projectData) {
            return interaction.followUp({
                content: `Project not found! Project's data is not in the database.`,
                flags: MessageFlags.Ephemeral
            });
        }

        const editorChannel = await EditorsHelper.getChannel(interaction.client, projectData.task.editorId);
        if (!editorChannel) {
            return interaction.followUp({
                content: `Editor channel not found! Can't send the notification.`,
                flags: MessageFlags.Ephemeral
            });
        }

        let content;

        const status = id.slice(12);
        switch (status) {
            case 'RevsReady': 
                content = FormatsHelper.formatMessage('formats:notify_revsready', projectData);
                break;
            case 'Approved': 
                content = FormatsHelper.formatMessage('formats:notify_approved', projectData);
                break;
            default:
                return interaction.followUp({
                    content: `Unknown status! Cannot notify the editor.`,
                    flags: MessageFlags.Ephemeral
                });
        }

        const textDisplay = new TextDisplayBuilder().setContent(content);
        const container = new ContainerBuilder().addTextDisplayComponents(textDisplay);

        await editorChannel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });

        await interaction.deleteReply();

        await interaction.followUp({
            content: `Editor successfully notified!`,
            flags: MessageFlags.Ephemeral
        });
    }
};