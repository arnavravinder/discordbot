const { Client, Intents, REST, Routes } = require('discord.js');
const translate = require('@vitalets/google-translate-api');
require('dotenv').config();

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const commands = [
    {
        name: 'translate',
        description: 'Translate text to English',
        options: [
            {
                name: 'text',
                type: 'STRING',
                description: 'Text to translate',
                required: true,
            },
            {
                name: 'language',
                type: 'STRING',
                description: 'Target language (default is English)',
                required: false,
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
    console.log('Translator Bot is online! 🌍');
    client.user.setActivity('Translating the world 🌐', { type: 'PLAYING' });
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'translate') {
        const textToTranslate = options.getString('text');
        const targetLanguage = options.getString('language') || 'en';

        try {
            const res = await translate(textToTranslate, { to: targetLanguage });
            await interaction.reply(`📝 Original: ${textToTranslate}\n🌐 Translated: ${res.text}`);
        } catch (error) {
            console.error(error);
            await interaction.reply('There was an error translating your text. 😢');
        }
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

    if (command === 'translate') {
        const textToTranslate = args.join(' ');
        if (!textToTranslate) {
            return message.reply('Please provide some text to translate. ✍️');
        }

        try {
            const res = await translate(textToTranslate, { to: 'en' });
            message.channel.send(`📝 Original: ${textToTranslate}\n🌐 Translated: ${res.text}`);
        } catch (error) {
            console.error(error);
            message.reply('There was an error translating your text. 😢');
        }
    } else if (command === 'setprefix') {
        if (!args.length) return message.reply('Please provide a new prefix. ✍️');
        prefix = args[0];
        message.reply(`Prefix successfully set to ${prefix}`);
    }
});

client.login(process.env.DISCORD_TOKEN);
