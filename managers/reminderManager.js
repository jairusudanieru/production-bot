const { MessageFlags, ContainerBuilder, TextDisplayBuilder, ButtonStyle, ButtonBuilder, SectionBuilder } = require("discord.js");

const DiscordHelper = require("../helpers/discordHelper.js");
const MessagesHelper = require("../helpers/messagesHelper.js");

async function getReminderChannel(client) {
    return DiscordHelper.getChannelById(client, process.env.REMINDER_CHANNEL_ID);
}

function toPHDateString(date) {
    return date.toLocaleDateString('en-CA', {
        timeZone: 'Asia/Manila'
    });
}

async function findReminderMessage(channel, botId) {
    const messages = await channel.messages.fetch({ limit: 5 });
    const message = messages.find(m => m.author.id === botId && m.components?.[0]?.components?.[0]?.content?.startsWith('# ASSIGNED PROJECTS'));
    if (!message) return null;

    const now = new Date();
    const isToday = toPHDateString(message.createdAt) === toPHDateString(now);
    const isFull = message.components?.length >= 10;

    if (!isToday || isFull) return null;
    return message;
}

function findProjectIndex(components, projectId) {
    return components.findIndex(container => {
        const section = container.components?.[0];
        const button = section?.accessory;
        const id = button?.data?.custom_id;
        return id?.endsWith(`:${projectId}`);
    });
}

function buildContainerHeader() {
    const date = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Manila',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    }).format(new Date()).toUpperCase();

    return new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder()
            .setContent(`# ASSIGNED PROJECTS - ${date}`)
        );
}

async function buildProjectSection(projectData) {
    const statusMap = {
        RevsReady: { buttonLabel: 'Status: Revs Ready', buttonStyle: ButtonStyle.Primary },
        Approved: { buttonLabel: 'Status: Approved', buttonStyle: ButtonStyle.Success },
    };

    const { buttonLabel, buttonStyle } = statusMap[projectData.task.status] ??
        { buttonLabel: 'Status: Editing', buttonStyle: ButtonStyle.Secondary };

    const content = await MessagesHelper.formatMessage('formats:daily_reminder', projectData);

    const projectDetails = new TextDisplayBuilder()
        .setContent(content)

    const statusButton = new ButtonBuilder()
        .setCustomId(`projectStatus:${projectData.id}`)
        .setLabel(buttonLabel)
        .setStyle(buttonStyle)

    return new ContainerBuilder()
        .addSectionComponents(new SectionBuilder()
            .addTextDisplayComponents(projectDetails)
            .setButtonAccessory(statusButton))
}

module.exports = {
    async addProject(client, projectData) {
        try {
            const reminderChannel = await getReminderChannel(client);
            if (!reminderChannel) return null;

            const containerHeader = buildContainerHeader();
            const projectSection = await buildProjectSection(projectData);

            const reminderMessage = await findReminderMessage(reminderChannel, client.user.id);
            if (!reminderMessage) {
                const newMessage = await reminderChannel.send({
                    components: [containerHeader, projectSection],
                    flags: MessageFlags.IsComponentsV2
                });

                return newMessage;
            }

            const components = reminderMessage.components;
            await reminderMessage.edit({ components: [...components, projectSection] });
            return reminderMessage;
        } catch (error) {
            console.error('Adding project to reminder failed:', error);
            return null;
        }
    },

    async editProject(client, projectData) {
        try {
            const reminderChannel = await getReminderChannel(client);
            if (!reminderChannel) return null;

            const reminderMessage = await DiscordHelper.getMessageByURL(client, projectData.reminderUrl);
            if (!reminderMessage) return null;

            const components = [...reminderMessage.components];
            const index = findProjectIndex(components, projectData.id);
            if (index <= 0) return null;

            const updatedSection = await buildProjectSection(projectData);
            components[index] = updatedSection.toJSON();

            await reminderMessage.edit({ components });
            return reminderMessage;
        } catch (error) {
            console.error('Editing project in reminder failed:', error);
            return null;
        }
    },

    async deleteProject(client, reminderId, projectId) {
        try {
            const reminderChannel = await getReminderChannel(client);
            if (!reminderChannel) return false;

            const reminderMessage = await DiscordHelper.getMessageById(reminderChannel, reminderId);
            if (!reminderMessage) return false;

            const components = [...reminderMessage.components];

            const index = findProjectIndex(components, projectId);
            if (index <= 0) return false;

            components.splice(index, 1);
            if (components.length === 1) {
                await reminderMessage.delete().catch(() => { });
                return true;
            }

            await reminderMessage.edit({ components });
            return true;
        } catch (error) {
            console.error('Deleting project from reminder failed:', error);
            return false;
        }
    }
}