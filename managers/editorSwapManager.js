const { ButtonBuilder, ActionRowBuilder, TextDisplayBuilder, ButtonStyle, ContainerBuilder, SeparatorBuilder, MessageFlags } = require("discord.js");

const FormatsHelper = require("../helpers/formatsHelper.js");

/**
 * @param {object} projectData
 * @param {boolean} disabled
 * @param {'accept' | 'decline' | null} clickedAction
 */
function getRequestContainer(projectData, disabled, clickedAction = null) {
    const content = FormatsHelper.formatMessage('formats:swap_editor', projectData);

    const swapDetails = new TextDisplayBuilder()
        .setContent(content);

    const acceptStyle = !disabled
        ? ButtonStyle.Success
        : clickedAction === 'accept'
            ? ButtonStyle.Success
            : ButtonStyle.Secondary;

    const declineStyle = !disabled
        ? ButtonStyle.Danger
        : clickedAction === 'decline'
            ? ButtonStyle.Danger
            : ButtonStyle.Secondary;

    const editorButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`editorSwapAccept:${projectData.id}:${projectData.swap?.swapEditorId}`)
            .setLabel('Accept')
            .setStyle(acceptStyle)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setLabel('Assigned Project')
            .setURL(projectData.messageUrl ?? 'https://discord.com')
            .setStyle(ButtonStyle.Link),
        new ButtonBuilder()
            .setCustomId(`editorSwapDecline:${projectData.id}:${projectData.swap?.swapEditorId}`)
            .setLabel('Decline')
            .setStyle(declineStyle)
            .setDisabled(disabled),
    );

    return new ContainerBuilder()
        .addTextDisplayComponents(swapDetails)
        .addSeparatorComponents(new SeparatorBuilder())
        .addActionRowComponents(editorButtons);
}

/**
 * @param {object} projectData
 * @param {boolean} disabled
 * @param {'approve' | 'reject' | null} clickedAction
 */
function getConfirmationContainer(projectData, disabled, clickedAction = null) {
    const content = FormatsHelper.formatMessage('formats:swap_confirm', projectData);

    const swapDetails = new TextDisplayBuilder()
        .setContent(content);

    const approveStyle = !disabled
        ? ButtonStyle.Success
        : clickedAction === 'approve'
            ? ButtonStyle.Success
            : ButtonStyle.Secondary;

    const rejectStyle = !disabled
        ? ButtonStyle.Danger
        : clickedAction === 'reject'
            ? ButtonStyle.Danger
            : ButtonStyle.Secondary;

    const editorButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`confirmSwapApprove:${projectData.id}:${projectData.swap?.swapEditorId}`)
            .setLabel('Approve')
            .setStyle(approveStyle)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setLabel('Assigned Project')
            .setURL(projectData.messageUrl ?? 'https://discord.com')
            .setStyle(ButtonStyle.Link),
        new ButtonBuilder()
            .setCustomId(`confirmSwapReject:${projectData.id}:${projectData.swap?.swapEditorId}`)
            .setLabel('Reject')
            .setStyle(rejectStyle)
            .setDisabled(disabled),
    );

    return new ContainerBuilder()
        .addTextDisplayComponents(swapDetails)
        .addSeparatorComponents(new SeparatorBuilder())
        .addActionRowComponents(editorButtons);
}


async function sendEditorRequest(channel, taskData) {
    try {
        if (!channel) return null;

        const requestContainer = getRequestContainer(taskData, false);

        return channel.send({
            components: [requestContainer],
            flags: MessageFlags.IsComponentsV2
        });

    } catch (error) {
        console.error(`Something went wrong sending request message!`, error);
        return null;
    }
}

/**
 * @param {'accept' | 'decline'} clickedAction
 */
async function editEditorRequest(message, taskData, clickedAction = null) {
    try {
        if (!message) return null;

        const requestContainer = getRequestContainer(taskData, true, clickedAction);

        return message.edit({
            components: [requestContainer],
            flags: MessageFlags.IsComponentsV2
        });

    } catch (error) {
        console.error(`Something went wrong editing project task message!`, error);
        return null;
    }
}

async function sendSwapConfirmation(message, taskData) {
    try {
        if (!message) return null;

        const confirmationContainer = getConfirmationContainer(taskData, false);

        return message.reply({
            components: [confirmationContainer],
            flags: MessageFlags.IsComponentsV2
        });

    } catch (error) {
        console.error(`Something went wrong sending confirmation message!`, error);
        return null;
    }
}

/**
 * @param {'approve' | 'reject'} clickedAction
 */
async function editSwapConfirmation(message, taskData, clickedAction = null) {
    try {
        if (!message) return null;

        const confirmationContainer = getConfirmationContainer(taskData, true, clickedAction);

        return message.edit({
            components: [confirmationContainer],
            flags: MessageFlags.IsComponentsV2
        });

    } catch (error) {
        console.error(`Something went wrong editing confirmation message!`, error);
        return null;
    }
}

module.exports = {
    sendEditorRequest,
    editEditorRequest,
    sendSwapConfirmation,
    editSwapConfirmation
};