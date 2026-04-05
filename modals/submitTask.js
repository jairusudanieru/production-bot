const { MessageFlags, TextDisplayBuilder, ButtonBuilder, ContainerBuilder, ButtonStyle, ActionRowBuilder, SeparatorBuilder } = require("discord.js");

const DatabaseManager = require("../managers/databaseManager.js");
const DiscordHelper = require("../helpers/discordHelper.js");
const EditorsHelper = require("../helpers/editorsHelper.js");
const FormatsHelper = require("../helpers/formatsHelper.js");

async function getContainer(projectData) {
    const content = FormatsHelper.formatMessage('formats:submit_project', projectData);

    const testDisplay = new TextDisplayBuilder()
        .setContent(content);

    const editorButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`submitTask:${projectData.id}`)
            .setLabel('Edit Submission')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setLabel('Assigned Project')
            .setURL(projectData.messageUrl ?? 'https://discord.com')
            .setStyle(ButtonStyle.Link),
    );

    return new ContainerBuilder()
        .addTextDisplayComponents(testDisplay)
        .addSeparatorComponents(new SeparatorBuilder())
        .addActionRowComponents(editorButtons);
}

module.exports = {
    type: 'startsWith',
    customId: 'showSubmitTask:',

    async execute(interaction) {
        const [, projectId] = interaction.customId.split(':');
        const projectData = DatabaseManager.get(projectId);
        if (!projectData) {
            return interaction.reply({
                content: `Project not found! Project's data is not in the database.`,
                flags: MessageFlags.Ephemeral
            });
        }

        const projectFile = interaction.fields.getTextInputValue('projectFile');
        const exportedOutput = interaction.fields.getTextInputValue('exportedOutput');

        const updatedSubmission = {
            projectFile: projectFile?.trim() || projectData.submission?.projectFile || '',
            exportedOutput: exportedOutput?.trim() || projectData.submission?.exportedOutput || ''
        };

        const editorChannel = await EditorsHelper.getChannel(interaction.client, projectData.task?.editorId);
        if (!editorChannel) {
            return interaction.reply({
                content: `Can't find your channel! please send a report to <@846982740377075763>`,
                flags: MessageFlags.Ephemeral
            });
        }

        let submissionMessage = null;
        let submissionEdited = false;
        let originalComponents = null;

        if (projectData.submission?.messageUrl) {
            submissionMessage = await DiscordHelper.getMessageByURL(
                interaction.client,
                projectData.submission.messageUrl
            );

            if (submissionMessage) {
                originalComponents = submissionMessage.components;
            }
        }

        projectData.submission = updatedSubmission;
        const container = await getContainer(projectData);

        if (submissionMessage) {
            await submissionMessage.edit({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });

            submissionEdited = true;
        } else {
            submissionMessage = await editorChannel.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        projectData.submission = {
            ...projectData.submission,
            messageUrl: submissionMessage.url
        };

        const databaseUpdated = DatabaseManager.set(projectData.id, projectData);
        if (!databaseUpdated) {
            if (submissionEdited) {
                await submissionMessage.edit({
                    components: [originalComponents],
                    flags: MessageFlags.IsComponentsV2
                });
            }
            return interaction.reply({
                content: `Something went wrong adding submission to database! Please send them manually.`,
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.reply({
            content: `Project Submitted: ${submissionMessage.url}`,
            flags: MessageFlags.Ephemeral
        });
    },
};
