module.exports = {
    async getChannelById(client, channelId) {
        try {
            const cached = await client.channels.cache.get(channelId);
            if (cached) return cached;

            return await client.channels.fetch(channelId);
        } catch (error) {
            console.error('Something went wrong getting the channel from id!', error);
            return null;
        }
    },

    async getMessageById(channel, messageId) {
        try {
            const cached = await channel.messages.cache.get(messageId);
            if (cached) return cached;

            return await channel.messages.fetch(messageId);
        } catch (error) {
            console.error('Something went wrong getting the message from id!', error);
            return null;
        }
    },

    async getMessageByURL(client, url) {
        try {
            const match = url.match(/channels\/(\d+)\/(\d+)\/(\d+)/);
            if (!match) return null;

            const [, , channelId, messageId] = match;

            const channel = await this.getChannelById(client, channelId);
            if (!channel || !channel.isTextBased()) return null;

            const message = await channel.messages.fetch(messageId);
            return message;
        } catch (error) {
            console.error('Something went wrong getting the message from url!', error);
            return null;
        }
    }
}