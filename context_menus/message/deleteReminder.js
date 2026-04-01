const {
    PermissionFlagsBits,
    ContextMenuCommandBuilder,
    ApplicationCommandType,
    MessageFlags,
    ComponentType
} = require('discord.js');

const DatabaseManager = require("../../../managers/databaseManager.js");
const ModalManager = require("../../../managers/modalManager.js");

async function getReminderProjects(message) {
    const components = message.components ?? [];

    const projects = await Promise.all(
        components.map(async (container, index) => {
            const section = container.components?.find(c => c.data?.type === ComponentType.Section);
            if (!section?.accessory?.data?.custom_id) return null;
            
            const projectId = section.accessory.data.custom_id.split(':')[1];
            if (!projectId) return null;

            const project = await DatabaseManager.getProject(projectId);
            const dbTitle = project?.task?.title;
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

        try {
            const options = await getReminderProjects(reminderMessage);
            if (!options.length) {
                return interaction.reply({
                    content: 'No projects found in this message!',
                    flags: MessageFlags.Ephemeral
                });
            }

            const modal = await ModalManager.getReminderIndexModal(reminderMessage, options);
            await interaction.showModal(modal);

        } catch (error) {
            console.error('Delete reminder failed:', error);

            return interaction.reply({
                content: 'Something went wrong!',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};