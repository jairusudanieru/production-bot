const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");

const DatabaseManager = require("../../managers/databaseManager.js");
const ProjectTaskManager = require("../../managers/projectTaskManager.js");
const ReminderManager = require("../../managers/reminderManager.js");

const { ulid } = require("ulid");

function generateProjectId() {
    return `project-${ulid()}`;
}

const LOCK_TIMEOUT = 60_000;
let commandInUse = false;
let lockTimer = null;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('assign-project')
        .setDescription('Assign a project')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => option
            .setName('title')
            .setDescription('Project Title')
            .setRequired(true))
        .addStringOption(option => option
            .setName('channel')
            .setDescription('Project Channel')
            .setRequired(true))
        .addStringOption(option => option
            .setName('account')
            .setDescription('Project Account')
            .setRequired(true))
        .addStringOption(option => option
            .setName('project_link')
            .setDescription('Project Files Link')
            .setRequired(true))
        .addStringOption(option => option
            .setName('trello_link')
            .setDescription('Project Trello Link')
            .setRequired(true))
        .addUserOption(option => option
            .setName('editor')
            .setDescription('Assigned Editor')
            .setRequired(true))
        .addStringOption(option => option
            .setName('deadline')
            .setDescription('Project Deadline')
            .setRequired(true))
        .addStringOption(option => option
            .setName('upload_time')
            .setDescription('Project Upload Time')
            .setRequired(true)),

    async execute(interaction) {
        if (commandInUse) {
            return interaction.reply({
                content: `This command is currently processing other task! Please try again later.`,
                flags: MessageFlags.Ephemeral
            });
        }

        commandInUse = true;

        lockTimer = setTimeout(() => {
            commandInUse = false;
        }, LOCK_TIMEOUT);

        await interaction.deferReply({
            flags: MessageFlags.Ephemeral
        });

        const taskData = {
            id: generateProjectId(),
            task: {
                title: interaction.options.getString('title'),
                channel: interaction.options.getString('channel'),
                account: interaction.options.getString('account'),
                link: interaction.options.getString('project_link'),
                trello: interaction.options.getString('trello_link'),
                deadline: interaction.options.getString('deadline'),
                uploadTime: interaction.options.getString('upload_time'),
                editorId: interaction.options.getUser('editor').id,
                status: 'Editing',
            }
        };

        try {
            const taskMessage = await ProjectTaskManager.sendProjectTask(interaction.channel, taskData);
            if (!taskMessage) {
                return interaction.editReply({
                    content: `Failed to send project task message!`
                });
            }

            const reminderMessage = await ReminderManager.addProject(interaction.client, taskData);
            if (!reminderMessage) {
                await interaction.editReply({
                    content: `Failed to add project to reminder message! rolling back task...`
                });
                await ProjectTaskManager.deleteProjectTask(taskMessage);
                return;
            }

            const projectData = {
                ...taskData,
                messageUrl: taskMessage.url,
                reminderUrl: reminderMessage.url,
                messageId: taskMessage.id
            };

            const addedToDatabase = DatabaseManager.set(projectData.id, projectData);
            if (!addedToDatabase) {
                await interaction.editReply({
                    content: `Failed to add project to database! rolling back task...`
                });
                await ProjectTaskManager.deleteProjectTask(taskMessage);
                await ReminderManager.deleteProject(interaction.client, reminderMessage.id, projectData.id);
                return;
            }

            await interaction.editReply({
                content: `Project task successfully sent!`
            });

        } catch (error) {
            console.error(`Assign project failed:`, error);

            await interaction.editReply({
                content: `Something went wrong! Please try again...`,
            });

        } finally {
            clearTimeout(lockTimer);
            commandInUse = false;
        }
    }
};