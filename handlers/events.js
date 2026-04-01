const { readdirSync } = require('fs');
const { join } = require('path');

module.exports = function (client) {
	client.handleEvents = function () {
		const eventsPath = join(__dirname, '../events');
		const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

		for (const file of eventFiles) {
			const event = require(join(eventsPath, file));
			if (event.once) {
				client.once(event.name, (...args) => event.execute(...args, client));
			} else {
				client.on(event.name, (...args) => event.execute(...args, client));
			}
		}
	};
};
