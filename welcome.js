const { Client, Intents, REST, Routes } = require('discord.js');
require('dotenv').config();

const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS, 
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
});

const commands = [
    {
        name: 'setwelcome',
        description: 'Set the welcome message',
        options: [
            {
                name: 'message',
                type: 'STRING',
                description: 'The welcome message',
                required: true
            }
        ]
    },
    {
        name: 'setrole',
        description: 'Set the default role for new members',
        options: [
            {
                name: 'role',
                type: 'ROLE',
                description: 'The default role',
                required: true
            }
        ]
    }
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

let welcomeMessage = 'Welcome to the server, {user}!';
let defaultRoleId = null;

client.once('ready', () => {
    console.log('Welcome Auto-role Bot is online! 👋');
});

client.on('guildMemberAdd', async member => {
    const channel = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
    if (channel) {
        const message = welcomeMessage.replace('{user}', `<@${member.id}>`);
        channel.send(message);
    }
    if (defaultRoleId) {
        const role = member.guild.roles.cache.get(defaultRoleId);
        if (role) {
            member.roles.add(role).catch(console.error);
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'setwelcome') {
        welcomeMessage = options.getString('message');
        interaction.reply(`Welcome message set to: ${welcomeMessage}`);
    } else if (commandName === 'setrole') {
        const role = options.getRole('role');
        defaultRoleId = role.id;
        interaction.reply(`Default role set to: ${role.name}`);
    }
});

client.login(process.env.DISCORD_TOKEN);
