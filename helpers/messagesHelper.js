const { escapeMarkdown } = require("discord.js");

const FormatsManager = require("../managers/formatsManager.js");

function mapProjectData(projectData) {
    if (!projectData) throw new Error('[mapProjectData] Missing projectData');

    return {
        editorId: projectData.task?.editorId,
        title: projectData.task?.title,
        channel: projectData.task?.channel,
        account: projectData.task?.account,
        projectLink: projectData.task?.link,
        trelloLink: projectData.task?.trello,
        deadline: projectData.task?.deadline,
        uploadTime: projectData.task?.uploadTime,
        projectFile: projectData.submission?.projectFile,
        exportedOutput: projectData.submission?.exportedOutput,
        swapReason: projectData.swap?.swapReason,
        swapEditorId: projectData.swap?.swapEditorId
    };
}

async function getFormattedMessage(formatKey, replacements = {}) {
    const formatValue = await FormatsManager.get(formatKey);
    if (!formatValue) throw new Error(`[format] Missing format: ${formatKey}`);

    const format = Array.isArray(formatValue)
        ? formatValue.join('\n')
        : String(formatValue);

    return format.replace(/%(\w+)%/g, (_, key) => {
        return escapeMarkdown(String(replacements[key] ?? ''));
    });
}

async function formatMessage(formatKey, projectData) {
    const replacements = mapProjectData(projectData);
    return await getFormattedMessage(formatKey, replacements);
}

module.exports = {
    formatMessage,
    getFormattedMessage
}