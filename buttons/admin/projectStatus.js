const { PermissionsBitField, MessageFlags, TextDisplayBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, SectionBuilder } = require("discord.js");

const DatabaseManager = require("../../managers/databaseManager.js");
const ReminderManager = require("../../managers/reminderManager.js");

const STATUS_FLOW = {
    Editing: 'RevsReady',
    RevsReady: 'Approved',
};

async function getContainer(projectData) {
    const testDisplay = new TextDisplayBuilder()
        .setContent('Do you want to notify the editor?');

    const notifyButton = new ButtonBuilder()
        .setCustomId(`editorNotify${projectData.task.status}:${projectData.id}`)
        .setLabel('Yes')
        .setStyle(ButtonStyle.Secondary);

    return new ContainerBuilder().addSectionComponents(
        new SectionBuilder()
            .addTextDisplayComponents(testDisplay)
            .setButtonAccessory(notifyButton)
    );
}

module.exports = {
    type: 'startsWith',
    customId: 'projectStatus:',

    async execute(interaction) {
        await interaction.deferUpdate();

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.followUp({
                content: 'You do not have permission to use this button!',
                flags: MessageFlags.Ephemeral
            });
        }

        const [, projectId] = interaction.customId.split(':');
        const projectData = DatabaseManager.get(projectId);
        if (!projectData) {
            return interaction.followUp({
                content: `Project not found! Project's data is not in the database.`,
            });
        }

        const originalData = structuredClone(projectData);

        const currentStatus = projectData.task.status;
        const nextStatus = STATUS_FLOW[currentStatus] || 'Editing';
        projectData.task.status = nextStatus;

        const databaseUpdated = DatabaseManager.set(projectData.id, projectData);
        if (!databaseUpdated) {
            return interaction.followUp({
                content: `Failed to update project database! No changes made...`,
                flags: MessageFlags.Ephemeral
            });
        }

        const reminderMessageEdited = await ReminderManager.editProject(interaction.client, projectData);
        if (!reminderMessageEdited) {
            DatabaseManager.set(projectData.id, originalData);
            return interaction.followUp({
                content: `Can't update reminder message! Rolling back changes...`,
                flags: MessageFlags.Ephemeral
            });
        }

        if (nextStatus === 'Editing') return;

        const container = await getContainer(projectData);
        await interaction.followUp({
            components: [container],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        });
    }
};