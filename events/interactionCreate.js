const { Events, MessageFlags } = require("discord.js");

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction, client) {
        try {
            // Commands
            if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
                const command = client.commands.get(interaction.commandName);
                if (!command) return;

                await command.execute(interaction, client);
            }

            // Buttons
            else if (interaction.isButton()) {
                const button = client.buttons?.get(interaction.customId);
                if (button) {
                    await button.execute(interaction, client);
                    return;
                }

                let executed = false;
                for (const pattern of client.buttonPatterns || []) {
                    for (const id of pattern.customIds) {
                        const startsWith = pattern.type === 'startsWith' && interaction.customId.startsWith(id);
                        const contains = pattern.type === 'contains' && interaction.customId.includes(id);

                        if (startsWith || contains) {
                            await pattern.execute(interaction, client);
                            executed = true;
                            break;
                        }
                    }
                    if (executed) break;
                }

                if (!executed) {
                    await interaction.reply({
                        content: `Sorry, this button doesn't have any function yet!`,
                        flags: MessageFlags.Ephemeral
                    });
                }
            }

            // Select Menus
            else if (interaction.isStringSelectMenu()) {
                const menu = client.selectMenus?.get(interaction.customId);
                if (!menu) {
                    return interaction.reply({
                        content: `Sorry, this select menu doesn't have any function yet!`,
                        flags: MessageFlags.Ephemeral
                    });
                }

                await menu.execute(interaction, client);
            }

            // Modals
            else if (interaction.isModalSubmit()) {
                const modal = client.modals?.get(interaction.customId);

                if (modal) {
                    await modal.execute(interaction, client);
                    return;
                }

                let executed = false;
                for (const pattern of client.modalPatterns || []) {
                    for (const id of pattern.customIds) {
                        const startsWith = pattern.type === 'startsWith' && interaction.customId.startsWith(id);
                        const contains = pattern.type === 'contains' && interaction.customId.includes(id);

                        if (startsWith || contains) {
                            await pattern.execute(interaction, client);
                            executed = true;
                            break;
                        }
                    }
                    if (executed) break;
                }

                if (!executed) {
                    await interaction.reply({
                        content: `Sorry, this modal doesn't have any function yet!`,
                        flags: MessageFlags.Ephemeral
                    });
                }
            }
            
        } catch (error) {
            console.error(error);

            const errorPayload = {
                content: `Something went wrong, please report this to <@${process.env.DEVELOPER_ID}>`,
                flags: MessageFlags.Ephemeral
            };

            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorPayload);
                } else {
                    await interaction.reply(errorPayload);
                }
            } catch (fallbackError) {
                console.error('Failed to send error message to user:', fallbackError);
            }
        }
    },
};