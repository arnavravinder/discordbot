const { Client, Intents, REST, Routes } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const commands = [
    {
        name: 'serverstats',
        description: 'Displays server statistics',
    },
    {
        name: 'userstats',
        description: 'Displays user statistics',
        options: [
            {
                name: 'user',
                type: 'USER',
                description: 'User to get statistics for',
                required: true,
            },
        ],
    },
    {
        name: 'setprefix',
        description: 'Set a custom command prefix',
        options: [
            {
                name: 'prefix',
                type: 'STRING',
                description: 'New command prefix',
                required: true,
            },
        ],
    },
];

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

let prefix = '!';

client.once('ready', () => {
    console.log('Statistics Bot is online! 📊');
    client.user.setActivity('Gathering stats 📈', { type: 'WATCHING' });
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'serverstats') {
        const server = interaction.guild;
        const memberCount = server.memberCount;
        const channelCount = server.channels.cache.size;
        const roleCount = server.roles.cache.size;
        const emojiCount = server.emojis.cache.size;

        await interaction.reply(
            `📊 **Server Statistics**\n` +
            `👥 **Members:** ${memberCount}\n` +
            `📁 **Channels:** ${channelCount}\n` +
            `🎭 **Roles:** ${roleCount}\n` +
            `😃 **Emojis:** ${emojiCount}`
        );
    } else if (commandName === 'userstats') {
        const user = options.getUser('user');
        const member = interaction.guild.members.cache.get(user.id);
        const joinDate = member.joinedAt;
        const roles = member.roles.cache.map(role => role.name).join(', ');

        await interaction.reply(
            `📊 **User Statistics**\n` +
            `🧑 **User:** ${user.tag}\n` +
            `📅 **Joined:** ${joinDate}\n` +
            `🎭 **Roles:** ${roles}`
        );
    } else if (commandName === 'setprefix') {
        prefix = options.getString('prefix');
        await interaction.reply(`Prefix successfully set to ${prefix}`);
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'serverstats') {
        const server = message.guild;
        const memberCount = server.memberCount;
        const channelCount = server.channels.cache.size;
        const roleCount = server.roles.cache.size;
        const emojiCount = server.emojis.cache.size;

        message.channel.send(
            `📊 **Server Statistics**\n` +
            `👥 **Members:** ${memberCount}\n` +
            `📁 **Channels:** ${channelCount}\n` +
            `🎭 **Roles:** ${roleCount}\n` +
            `😃 **Emojis:** ${emojiCount}`
        );
    } else if (command === 'userstats') {
        if (!args.length) {
            return message.reply('Please mention a user to get statistics for.');
        }

        const user = message.mentions.users.first();
        const member = message.guild.members.cache.get(user.id);
        const joinDate = member.joinedAt;
        const roles = member.roles.cache.map(role => role.name).join(', ');

        message.channel.send(
            `📊 **User Statistics**\n` +
            `🧑 **User:** ${user.tag}\n` +
            `📅 **Joined:** ${joinDate}\n` +
            `🎭 **Roles:** ${roles}`
        );
    } else if (command === 'setprefix') {
        if (!args.length) return message.reply('Please provide a new prefix.');
        prefix = args[0];
        message.reply(`Prefix successfully set to ${prefix}`);
    }
});

client.login(process.env.DISCORD_TOKEN);
