const { MessageFlags, ButtonStyle, ButtonBuilder, ActionRowBuilder, ContainerBuilder, TextDisplayBuilder } = require("discord.js");

const MessagesHelper = require("../helpers/messagesHelper.js");

async function getProjectContainer(taskData) {
    const content = await MessagesHelper.formatMessage('formats:assign_project', taskData);

    const textDisplay = new TextDisplayBuilder()
        .setContent(content);

    const editorButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`showSwapRequestModal:${taskData.id}`)
            .setLabel('Request for Editor Swap')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`submitTask:${taskData.id}`)
            .setLabel('Submit Project Files')
            .setStyle(ButtonStyle.Secondary)
    );

    return new ContainerBuilder()
        .addTextDisplayComponents(textDisplay)
        .addActionRowComponents(editorButtons)
}

module.exports = {
    async sendProjectTask(channel, taskData) {
        try {
            if (!channel) return null;

            const taskContainer = await getProjectContainer(taskData);

            return channel.send({
                components: [taskContainer],
                flags: MessageFlags.IsComponentsV2
            });
        } catch (error) {
            console.error('Something went wrong sending project task message!', error);
            return null;
        }
    },

    async editProjectTask(message, taskData) {
        try {
            if (!message) return null;

            const taskContainer = await getProjectContainer(taskData);

            return message.edit({
                components: [taskContainer],
                flags: MessageFlags.IsComponentsV2
            });
        } catch (error) {
            console.error('Something went wrong editing project task message!', error);
            return null;
        }
    },

    async deleteProjectTask(message) {
        try {
            if (!message) return false;

            await message.delete();
            return true;
        } catch (error) {
            console.error('Something went wrong editing project task message!', error);
            return false;
        }
    }
};