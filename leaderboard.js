const { Client, GatewayIntentBits, Events, Collection, MessageActionRow, MessageButton, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageContent
] });

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, async () => {
    console.log('Ready!');

    const rest = new REST({ version: '10' }).setToken('ur api key'); //add key

    try {
        await rest.put(Routes.applicationCommands(client.user.id), {
            body: client.commands.map(command => command.data.toJSON()),
        });
        console.log('Successfully registered application commands.');
    } catch (error) {
        console.error(error);
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    if (message.content === '!leaderboard') {
        const leaderboard = 'Leaderboard is empty.';
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('refresh')
                    .setLabel('Refresh')
                    .setStyle('PRIMARY')
            );

        message.channel.send({ content: leaderboard, components: [row] });
    }
});

client.login('ur api key'); //add key

// commands/leaderboard.js

const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Show the message leaderboard'),
    async execute(interaction) {
        const leaderboard = 'Leaderboard is empty.';
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('refresh')
                    .setLabel('Refresh')
                    .setStyle('PRIMARY')
            );

        await interaction.reply({ content: leaderboard, components: [row] });
    },
};
