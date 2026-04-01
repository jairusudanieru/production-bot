const { 
	Events, 
	MessageFlags 
} = require("discord.js");

module.exports = {
	name: Events.InteractionCreate,

	async execute(interaction, client) {
		try {
			if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
				const command = client.commands.get(interaction.commandName);
				if (!command) return;

				await command.execute(interaction, client);
			}

			// Buttons
			else if (interaction.isButton()) {
				console.log(interaction.customId)
				const button = client.buttons?.get(interaction.customId);
				if (button) {
					return button.execute(interaction, client);
				}

				for (const pattern of client.buttonPatterns) {
					for (const id of pattern.customIds) {

						const startsWith = pattern.type === 'startsWith' && interaction.customId.startsWith(id);
						const contains = pattern.type === 'contains' && interaction.customId.includes(id);

						if (startsWith || contains) {
							return pattern.execute(interaction, client);
						}
					}
				}

				return interaction.reply({
					content: 'Sorry, this button doesn\'t have any function yet!',
					flags: MessageFlags.Ephemeral
				});
			}

			// Select Menus
			else if (interaction.isStringSelectMenu()) {
				const menu = client.selectMenus?.get(interaction.customId);
				if (!menu) return interaction.reply({
					content: 'Sorry, this select menu doesn\'t have any function yet!',
					flags: MessageFlags.Ephemeral
				});

				await menu.execute(interaction, client);
			}

			// Modals
			else if (interaction.isModalSubmit()) {
				console.log(interaction.customId)
				const modal = client.modals?.get(interaction.customId);

				if (modal) {
					return modal.execute(interaction, client);
				}

				for (const pattern of client.modalPatterns) {
					for (const id of pattern.customIds) {

						const startsWith = pattern.type === 'startsWith' && interaction.customId.startsWith(id);
						const contains = pattern.type === 'contains' && interaction.customId.includes(id);

						if (startsWith || contains) {
							return pattern.execute(interaction, client);
						}
					}
				}

				return interaction.reply({
					content: 'Sorry, this modal doesn\'t have any function yet!',
					flags: MessageFlags.Ephemeral
				});
			}
		} catch (error) {
			console.error(error);

			// Send user-friendly error message if interaction is still valid
			if (interaction.replied || interaction.deferred) {
				await interaction.editReply({
					content: 'Tell <@846982740377075763> there\'s an error with my code!',
					flags: MessageFlags.Ephemeral
				});
			} else {
				await interaction.channel.send({
					content: 'Tell <@846982740377075763> there\'s an error with my code!',
				});
			}
		}
	},
};
