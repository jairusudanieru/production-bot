const { PermissionFlagsBits, ContextMenuCommandBuilder, ApplicationCommandType, MessageFlags, ComponentType, ModalBuilder, LabelBuilder, StringSelectMenuBuilder } = require("discord.js");

const DatabaseManager = require("../../managers/databaseManager.js");

async function getReminderIndexModal(reminderMessage, options) {
    try {
        const modal = new ModalBuilder()
            .setCustomId(`deleteReminder:${reminderMessage.id}`)
            .setTitle('Delete Project in reminder');

        const selectMenu = new LabelBuilder()
            .setLabel('Select a Project to remove')
            .setStringSelectMenuComponent(
                new StringSelectMenuBuilder()
                    .setCustomId(`deleteReminder`)
                    .addOptions(options)
                    .setRequired(true)
                    .setMaxValues(1)
            );

        return modal.addLabelComponents(selectMenu);
    } catch (error) {
        console.error(`Create modal failed:`, error);
        return null;
    }
}

async function getReminderProjects(message) {
    const components = message.components ?? [];

    const projects = await Promise.all(
        components.slice(1).map(async (container, index) => {
            const section = container.components?.find(c => c.data?.type === ComponentType.Section);
            if (!section?.accessory?.data?.custom_id) return null;

            const projectId = section.accessory.data.custom_id.split(':')[1];
            if (!projectId) return null;

            const project = DatabaseManager.get(projectId);
            const dbTitle = project?.task?.title;

            // Fallback: parse title from message content format "... // Project Title\n..."
            const fallbackTitle = section.components?.[0]?.data?.content?.split('\n')[0]?.split('//')[1]?.trim();
            const title = dbTitle ?? fallbackTitle ?? 'Unknown | Deleted in DB';

            return {
                label: `Project ${index + 1}: ${title}`,
                value: projectId
            };
        })
    );

    return projects.filter(Boolean);
}

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('delete-reminder')
        .setType(ApplicationCommandType.Message)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const reminderMessage = interaction.targetMessage;

        const options = await getReminderProjects(reminderMessage);
        if (!options.length) {
            return interaction.reply({
                content: `No projects found in this message!`,
                flags: MessageFlags.Ephemeral
            });
        }

        const modal = await getReminderIndexModal(reminderMessage, options);
        await interaction.showModal(modal);
    }
};