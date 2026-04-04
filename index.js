const { Client, GatewayIntentBits, Collection, Partials } = require("discord.js");
require("dotenv").config({ quiet: true });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction
  ],
});

client.commands = new Collection();
client.components = new Collection();
client.buttons = new Collection();

require('./handlers/events')(client);
require('./handlers/commands')(client);
require('./handlers/interactions')(client);

async function start() {
  await client.handleCommands();
  client.handleEvents();
  client.handleButtons();
  client.handleModals();

  await client.login(process.env.TOKEN);
}

start();