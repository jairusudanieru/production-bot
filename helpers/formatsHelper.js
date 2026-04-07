const { escapeMarkdown } = require("discord.js");
const formats = require("../configFiles/formats.json");

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
        messageUrl: projectData.messageUrl,
        projectFile: projectData.submission?.projectFile,
        exportedOutput: projectData.submission?.exportedOutput,
        swapOriginalEditorId: projectData.swap?.swapOriginalEditorId,
        swapReason: projectData.swap?.swapReason,
        swapEditorId: projectData.swap?.swapEditorId
    };
}

function getFormattedMessage(formatKey, replacements = {}) {
    const formatValue = formats[formatKey];
    if (!formatValue) throw new Error(`Missing format: ${formatKey}`);

    const format = Array.isArray(formatValue)
        ? formatValue.join('\n')
        : String(formatValue);

    return format.replace(/%(\w+)%/g, (_, key) => {
        return escapeMarkdown(String(replacements[key] ?? ''));
    });
}

function formatMessage(formatKey, projectData) {
    const replacements = mapProjectData(projectData);
    return getFormattedMessage(formatKey, replacements);
}

module.exports = {
    formatMessage,
    getFormattedMessage
};