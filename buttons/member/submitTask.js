const { MessageFlags, ModalBuilder, LabelBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");

const DatabaseManager = require("../../managers/databaseManager.js");

async function getSubmissionModal(projectData) {
    try {
        const modal = new ModalBuilder()
            .setCustomId(`showSubmitTask:${projectData.id}`)
            .setTitle('Submit Project');

        const projectFile = new LabelBuilder()
            .setLabel('Project File')
            .setTextInputComponent(
                new TextInputBuilder()
                    .setCustomId('projectFile')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('https://drive.google.com')
                    .setRequired(false)
            );

        const exportedOutput = new LabelBuilder()
            .setLabel('Exported Output')
            .setTextInputComponent(
                new TextInputBuilder()
                    .setCustomId('exportedOutput')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('https://drive.google.com')
                    .setRequired(false)
            );

        return modal.addLabelComponents(projectFile, exportedOutput);
    } catch (error) {
        console.error(`Something went wrong creating submit modal!`, error);
        return null;
    }
}

module.exports = {
    type: 'startsWith',
    customId: 'submitTask:',

    async execute(interaction) {
        const [, projectId] = interaction.customId.split(':');

        try {
            const projectData = DatabaseManager.get(projectId);
            if (!projectData) {
                return interaction.reply({
                    content: `Project not found! Project's data is not in the database.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            if (interaction.user.id !== projectData.task?.editorId) {
                return interaction.reply({
                    content: `Only the assigned editor can submit files for this project!`,
                    flags: MessageFlags.Ephemeral
                });
            }

            const modal = await getSubmissionModal(projectData);
            await interaction.showModal(modal);

        } catch (error) {
            console.error(`Show submit modal failed:`, error);

            return interaction.reply({
                content: `Something went wrong! Please try again...`,
                flags: MessageFlags.Ephemeral
            });
        }
    },
};