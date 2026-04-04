const editors = require("../configFiles/editors.json");

const DiscordHelper = require("./discordHelper.js");

function getEditor(editorId) {
    if (!editorId) return null;
    const editor = editors[editorId];
    return editor ? { id: editorId, ...editor } : null;
}

async function getChannel(client, editorId) {
    const editor = getEditor(editorId);
    if (!editor.channelId) return null;

    return DiscordHelper.getChannelById(client, editor.channelId);
}

module.exports = {
    getEditor,
    getChannel,
};