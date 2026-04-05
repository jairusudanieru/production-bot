const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits, ContainerBuilder, TextDisplayBuilder } = require("discord.js");

const FormatsHelper = require("../../helpers/formatsHelper.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Shows the bot latency and stats')
        .setDefaultMemberPermissions(PermissionFlagsBits.UseApplicationCommands),

    async execute(interaction) {
        const start = Date.now();
        const uptime = process.uptime();

        await interaction.deferReply({
            flags: MessageFlags.Ephemeral
        });

        const content = FormatsHelper.getFormattedMessage('formats:ping', {
            latency: Date.now() - start,
            apiPing: Math.round(interaction.client.ws.ping),
            hours: Math.floor(uptime / 3600),
            minutes: Math.floor((uptime % 3600) / 60),
            seconds: Math.floor(uptime % 60),
            memory: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
        });

        const container = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(content)
        );

        await interaction.editReply({
            components: [container],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
        });
    },
};