const { REST, Routes } = require('discord.js');
const { readdirSync, statSync } = require('fs');
const { join, extname } = require('path');

module.exports = function (client) {
	client.handleCommands = async function () {
		client.commands.clear();
		client.commandArray = [];

		const commandsPath = join(__dirname, '../commands');

		const loadCommands = function (dir) {
			const files = readdirSync(dir);
			for (const file of files) {
				const fullPath = join(dir, file);
				const isDir = statSync(fullPath).isDirectory();

				if (isDir) {
					loadCommands(fullPath);
				} else if (extname(fullPath) === '.js') {
					const command = require(fullPath);
					if (command && command.data && command.execute) {
						client.commands.set(command.data.name, command);
						client.commandArray.push(command.data.toJSON());
						console.log(`The command '${command.data.name}' has been successfully reloaded!`);
					}
				}
			}
		};

		loadCommands(commandsPath);

		const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
		try {
			console.log(`Started refreshing app commands...`);
			await rest.put(
				Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
				{ body: client.commandArray }
			);
			console.log('Successfully reloaded app commands!\n');
		} catch (error) {
			console.error(error);
		}
	};
};
