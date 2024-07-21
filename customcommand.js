const { Client, Intents, REST, Routes } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
});

const commands = [
    {
        name: 'createcommand',
        description: 'Create a custom command',
        options: [
            {
                name: 'name',
                type: 'STRING',
                description: 'The name of the custom command',
                required: true
            },
            {
                name: 'response',
                type: 'STRING',
                description: 'The response of the custom command',
                required: true
            }
        ]
    },
    {
        name: 'listcommands',
        description: 'List all custom commands'
    },
    {
        name: 'deletecommand',
        description: 'Delete a custom command',
        options: [
            {
                name: 'name',
                type: 'STRING',
                description: 'The name of the custom command to delete',
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

const commandsFile = './custom_commands.json';
let customCommands = {};

if (fs.existsSync(commandsFile)) {
    const data = fs.readFileSync(commandsFile);
    customCommands = JSON.parse(data);
} else {
    fs.writeFileSync(commandsFile, JSON.stringify(customCommands));
}

client.once('ready', () => {
    console.log('Custom Commands Bot is online! 📜');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'createcommand') {
        const name = options.getString('name').toLowerCase();
        const response = options.getString('response');

        customCommands[name] = response;
        fs.writeFileSync(commandsFile, JSON.stringify(customCommands, null, 2));

        interaction.reply(`Custom command \`${name}\` has been created with response: "${response}" 📜`);
    } else if (commandName === 'listcommands') {
        const commandList = Object.keys(customCommands).map(name => `\`${name}\``).join(', ');
        interaction.reply(`📜 **Custom Commands:**\n${commandList || 'No custom commands found.'}`);
    } else if (commandName === 'deletecommand') {
        const name = options.getString('name').toLowerCase();

        if (customCommands[name]) {
            delete customCommands[name];
            fs.writeFileSync(commandsFile, JSON.stringify(customCommands, null, 2));
            interaction.reply(`Custom command \`${name}\` has been deleted. 🗑️`);
        } else {
            interaction.reply(`No custom command found with the name \`${name}\`. ❌`);
        }
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const content = message.content.toLowerCase();
    if (customCommands[content]) {
        message.channel.send(customCommands[content]);
    }
});

client.login(process.env.DISCORD_TOKEN);
