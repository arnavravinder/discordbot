const { Client, GatewayIntentBits, Events, Collection, MessageActionRow, MessageButton, REST, Routes, CommandInteractionOptionResolver, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./leaderboard.db');

const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences
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

    db.run('CREATE TABLE IF NOT EXISTS command_usage (userId TEXT PRIMARY KEY, commandName TEXT, usageCount INTEGER)', err => {
        if (err) console.error(err.message);
    });

    db.run('CREATE TABLE IF NOT EXISTS roles (roleId TEXT PRIMARY KEY, roleName TEXT)', err => {
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
        await trackCommandUsage(interaction.user.id, interaction.commandName);
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

async function trackCommandUsage(userId, commandName) {
    db.run('INSERT INTO command_usage (userId, commandName, usageCount) VALUES (?, ?, 1) ON CONFLICT(userId, commandName) DO UPDATE SET usageCount = usageCount + 1', [userId, commandName], err => {
        if (err) console.error(err.message);
    });
}

async function getCommandUsageStats(userId) {
    return new Promise((resolve, reject) => {
        db.all('SELECT commandName, usageCount FROM command_usage WHERE userId = ?', [userId], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows.length ? rows.map(row => `${row.commandName}: ${row.usageCount} uses`).join('\n') : 'No command usage stats available.');
        });
    });
}

const leaderboardCommand = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Show the message leaderboard')
        .setCooldown(10),
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
        .setDescription('Reset the leaderboard')
        .setCooldown(30),
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

const statsCommand = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Show overall bot statistics'),
    async execute(interaction) {
        const totalMessages = await getTotalMessages();
        await interaction.reply(`Total messages sent: ${totalMessages}`);
    },
};

async function getTotalMessages() {
    return new Promise((resolve, reject) => {
        db.get('SELECT SUM(messageCount) AS totalMessages FROM leaderboard', [], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row.totalMessages || 0);
        });
    });
}

const userStatsCommand = {
    data: new SlashCommandBuilder()
        .setName('userstats')
        .setDescription('Show message count for a specific user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to check')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const messageCount = await getUserMessageCount(user.id);
        await interaction.reply(`<@${user.id}> has ${messageCount} messages.`);
    },
};

const usageStatsCommand = {
    data: new SlashCommandBuilder()
        .setName('usagestats')
        .setDescription('Show command usage statistics for a specific user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to check')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const usageStats = await getCommandUsageStats(user.id);
        await interaction.reply(usageStats);
    },
};

const roleCommand = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Manage roles in the server')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a role to a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to add role to')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to add')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role from a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to remove role from')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to remove')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all roles in the server')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const member = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');

        if (subcommand === 'add') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                return interaction.reply({ content: 'You do not have permission to manage roles.', ephemeral: true });
            }
            if (role.position >= interaction.guild.me.roles.highest.position) {
                return interaction.reply({ content: 'I cannot manage this role.', ephemeral: true });
            }
            await member.roles.add(role);
            await interaction.reply(`Role ${role.name} added to ${member.user.tag}.`);
        } else if (subcommand === 'remove') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                return interaction.reply({ content: 'You do not have permission to manage roles.', ephemeral: true });
            }
            if (role.position >= interaction.guild.me.roles.highest.position) {
                return interaction.reply({ content: 'I cannot manage this role.', ephemeral: true });
            }
            await member.roles.remove(role);
            await interaction.reply(`Role ${role.name} removed from ${member.user.tag}.`);
        } else if (subcommand === 'list') {
            const roles = interaction.guild.roles.cache.map(r => r.name).join('\n');
            await interaction.reply(`Roles in this server:\n${roles}`);
        }
    },
};

client.commands.set(leaderboardCommand.data.name, leaderboardCommand);
client.commands.set(resetCommand.data.name, resetCommand);
client.commands.set(helpCommand.data.name, helpCommand);
client.commands.set(topCommand.data.name, topCommand);
client.commands.set(statsCommand.data.name, statsCommand);
client.commands.set(userStatsCommand.data.name, userStatsCommand);
client.commands.set(usageStatsCommand.data.name, usageStatsCommand);
client.commands.set(roleCommand.data.name, roleCommand);

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

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isButton()) {
        if (interaction.customId === 'refresh') {
            const leaderboard = await getLeaderboard();
            await interaction.update({ content: leaderboard });
        }
    }
});

client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (reaction.message.author.bot) return;

    if (reaction.emoji.name === '👍') {
        db.run('INSERT INTO reactions (userId, messageId, reactionType) VALUES (?, ?, ?) ON CONFLICT(userId, messageId) DO UPDATE SET reactionType = reactionType', [user.id, reaction.message.id, 'thumbs_up'], err => {
            if (err) console.error(err.message);
        });
    } else if (reaction.emoji.name === '👎') {
        db.run('INSERT INTO reactions (userId, messageId, reactionType) VALUES (?, ?, ?) ON CONFLICT(userId, messageId) DO UPDATE SET reactionType = reactionType', [user.id, reaction.message.id, 'thumbs_down'], err => {
            if (err) console.error(err.message);
        });
    }
});

client.on(Events.MessageReactionRemove, async (reaction, user) => {
    if (reaction.message.author.bot) return;

    if (reaction.emoji.name === '👍' || reaction.emoji.name === '👎') {
        db.run('DELETE FROM reactions WHERE userId = ? AND messageId = ?', [user.id, reaction.message.id], err => {
            if (err) console.error(err.message);
        });
    }
});

client.login('ur api key'); //add key
