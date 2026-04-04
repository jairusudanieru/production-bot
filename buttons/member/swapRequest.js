const { MessageFlags, TextInputStyle, TextInputBuilder, LabelBuilder, ModalBuilder, UserSelectMenuBuilder } = require("discord.js");

const DatabaseManager = require("../../managers/databaseManager.js");

async function getSwapRequestModal(projectData) {
    try {
        const modal = new ModalBuilder()
            .setCustomId(`swapRequest:${projectData.id}`)
            .setTitle('Editor Swap Request');

        const editor = new LabelBuilder()
            .setLabel('Requested Editor')
            .setUserSelectMenuComponent(
                new UserSelectMenuBuilder()
                    .setCustomId('swapEditor')
                    .setPlaceholder('Select editor')
                    .setRequired(true)
                    .setMaxValues(1)
            );

        const reason = new LabelBuilder()
            .setLabel('Reason for Swap Request')
            .setTextInputComponent(
                new TextInputBuilder()
                    .setCustomId('swapReason')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Provide reason')
                    .setRequired(true)
            );

        return modal.addLabelComponents(editor, reason);
    } catch (error) {
        console.error(`Something went wrong creating swap request modal!`, error);
        return null;
    }
}

module.exports = {
    type: 'startsWith',
    customId: 'swapRequest:',

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
                    content: `Only the assigned editor can request swap for this project!`,
                    flags: MessageFlags.Ephemeral
                });
            }

            const modal = await getSwapRequestModal(projectData);
            await interaction.showModal(modal);

        } catch (error) {
            console.error(`Show swap request modal failed:`, error);

            return interaction.reply({
                content: `Something went wrong! Please try again...`,
                flags: MessageFlags.Ephemeral
            });
        }
    },
};