const { MessageFlags, ButtonBuilder, ActionRowBuilder, TextDisplayBuilder, ButtonStyle, ContainerBuilder, SeparatorBuilder } = require("discord.js");

const DatabaseManager = require("../managers/databaseManager.js");
const EditorsHelper = require("../helpers/editorsHelper.js");
const FormatsHelper = require("../helpers/formatsHelper.js");

async function getContainer(projectData) {
    const content = FormatsHelper.formatMessage('formats:swap_editor', projectData);

    const swapDetails = new TextDisplayBuilder()
        .setContent(content);

    const editorButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`editorSwapAccept:${projectData.id}:${projectData.swap?.swapEditorId}`)
            .setLabel('Accept')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setLabel('Assigned Project')
            .setURL(projectData.messageUrl ?? 'https://discord.com')
            .setStyle(ButtonStyle.Link),
        new ButtonBuilder()
            .setCustomId(`editorSwapDecline:${projectData.id}:${projectData.swap?.swapEditorId}`)
            .setLabel('Decline')
            .setStyle(ButtonStyle.Danger),
    );

    return new ContainerBuilder()
        .addTextDisplayComponents(swapDetails)
        .addSeparatorComponents(new SeparatorBuilder())
        .addActionRowComponents(editorButtons);
}

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

        const container = await getContainer(newProjectData);
        const request = await requestedEditorChannel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });

        await interaction.reply({
            content: `Request Submitted! ${request.url}`,
            flags: MessageFlags.Ephemeral
        });
    },
};
