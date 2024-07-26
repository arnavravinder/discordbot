const { Client, GatewayIntentBits, Events, Collection, MessageActionRow, MessageButton, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./leaderboard.db');

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

    db.run('CREATE TABLE IF NOT EXISTS leaderboard (userId TEXT PRIMARY KEY, messageCount INTEGER)', err => {
        if (err) console.error(err.message);
    });

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

    db.run('INSERT INTO leaderboard (userId, messageCount) VALUES (?, 1) ON CONFLICT(userId) DO UPDATE SET messageCount = messageCount + 1', [message.author.id], err => {
        if (err) console.error(err.message);
    });

    if (message.content === '!leaderboard') {
        const leaderboard = await getLeaderboard();
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

async function getLeaderboard() {
    return new Promise((resolve, reject) => {
        db.all('SELECT userId, messageCount FROM leaderboard ORDER BY messageCount DESC LIMIT 10', [], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows.map(row => `<@${row.userId}>: ${row.messageCount} messages`).join('\n'));
        });
    });
}

const { SlashCommandBuilder } = require('@discordjs/builders');

const leaderboardCommand = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Show the message leaderboard'),
    async execute(interaction) {
        const leaderboard = await getLeaderboard();
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

const resetCommand = {
    data: new SlashCommandBuilder()
        .setName('reset')
        .setDescription('Reset the leaderboard'),
    async execute(interaction) {
        db.run('DELETE FROM leaderboard', err => {
            if (err) console.error(err.message);
        });
        await interaction.reply('Leaderboard has been reset.');
    },
};

const helpCommand = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get a list of available commands'),
    async execute(interaction) {
        const commandsList = [
            '/leaderboard - Show the message leaderboard',
            '/reset - Reset the leaderboard',
            '/help - Get a list of available commands'
        ].join('\n');

        await interaction.reply(`Available commands:\n${commandsList}`);
    },
};

const topCommand = {
    data: new SlashCommandBuilder()
        .setName('top')
        .setDescription('Show the top messages for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to check')
                .setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const messageCount = await getUserMessageCount(user.id);
        await interaction.reply(`<@${user.id}> has ${messageCount} messages.`);
    },
};

async function getUserMessageCount(userId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT messageCount FROM leaderboard WHERE userId = ?', [userId], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row ? row.messageCount : 0);
        });
    });
}

client.commands.set(leaderboardCommand.data.name, leaderboardCommand);
client.commands.set(resetCommand.data.name, resetCommand);
client.commands.set(helpCommand.data.name, helpCommand);
client.commands.set(topCommand.data.name, topCommand);
