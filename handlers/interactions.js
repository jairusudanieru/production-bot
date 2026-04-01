const { readdirSync, statSync } = require('fs');
const { join } = require('path');

function getFiles(dir) {
	const entries = readdirSync(dir);
	const files = [];

	for (const entry of entries) {
		const fullPath = join(dir, entry);

		if (statSync(fullPath).isDirectory()) {
			files.push(...getFiles(fullPath));
		} else if (entry.endsWith('.js')) {
			files.push(fullPath);
		}
	}

	return files;
}

module.exports = function (client) {
	client.handleButtons = function () {
		const buttonsPath = join(__dirname, '../buttons');
		const buttonFiles = getFiles(buttonsPath);

		client.buttons = new Map();
		client.buttonPatterns = [];

		for (const file of buttonFiles) {
			const button = require(file);

			if (!button || !button.customId || !button.execute) continue;

			const ids = Array.isArray(button.customId)
				? button.customId
				: [button.customId];

			if (button.type) {
				client.buttonPatterns.push({
					type: button.type,
					customIds: ids,
					execute: button.execute
				});
			} else {
				for (const id of ids) {
					client.buttons.set(id, button);
				}
			}
		}
	};

	client.handleModals = function () {
		const modalsPath = join(__dirname, '../modals');
		const modalFiles = getFiles(modalsPath); // recursive like buttons

		client.modals = new Map();
		client.modalPatterns = [];

		for (const file of modalFiles) {
			const modal = require(file);
			if (!modal || !modal.customId || !modal.execute) continue;

			const ids = Array.isArray(modal.customId)
				? modal.customId
				: [modal.customId];

			if (modal.type) {
				client.modalPatterns.push({
					type: modal.type,
					customIds: ids,
					execute: modal.execute
				});
			} else {
				for (const id of ids) {
					client.modals.set(id, modal);
				}
			}
		}
	};
};