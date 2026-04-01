module.exports = {
    async getChannelById(client, channelId) {
        const cached = client.channels.cache.get(channelId);
        if (cached) return cached;

        return client.channels.fetch(channelId).catch(() => null);
    },

    async getMessageById(channel, messageId) {
        const cached = channel.messages.cache.get(messageId);
        if (cached) return cached;

        return channel.messages.fetch(messageId).catch(() => null);
    },

    async getMessageByURL(client, url) {
        const match = url.match(/channels\/(\d+)\/(\d+)\/(\d+)/);
        if (!match) return null;

        const [, , channelId, messageId] = match;

        const channel = await this.getChannelById(client, channelId);
        if (!channel?.isTextBased()) return null;

        return this.getMessageById(channel, messageId);
    }
}