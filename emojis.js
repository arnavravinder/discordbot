const { Client, Intents, REST, Routes } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
});

const commands = [
    {
        name: 'listemojis',
        description: 'List all custom emojis in the server'
    },
    {
        name: 'stealemoji',
        description: 'Steal an emoji and add it to the server',
        options: [
            {
                name: 'emoji',
                type: 'STRING',
                description: 'The emoji to steal (can be a URL or an existing emoji)',
                required: true
            },
            {
                name: 'name',
                type: 'STRING',
                description: 'The name for the new emoji',
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

client.once('ready', () => {
    console.log('Emoji Bot is online! 😃');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'listemojis') {
        const emojis = interaction.guild.emojis.cache.map(e => e.toString()).join(' ');
        if (emojis.length > 0) {
            interaction.reply(`Custom emojis in this server: ${emojis}`);
        } else {
            interaction.reply('There are no custom emojis in this server. 😢');
        }
    } else if (commandName === 'stealemoji') {
        const emoji = options.getString('emoji');
        const name = options.getString('name');

        if (emoji.startsWith('http') || emoji.startsWith('https')) {
            try {
                const newEmoji = await interaction.guild.emojis.create(emoji, name);
                interaction.reply(`Emoji ${newEmoji.toString()} has been added to the server as :${name}:`);
            } catch (error) {
                interaction.reply('Failed to add the emoji. Please ensure the URL is correct and try again. ❌');
            }
        } else {
            const emojiMatch = emoji.match(/<a?:(\w+):(\d+)>/);
            if (emojiMatch) {
                const emojiId = emojiMatch[2];
                const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.png`;
                try {
                    const newEmoji = await interaction.guild.emojis.create(emojiUrl, name);
                    interaction.reply(`Emoji ${newEmoji.toString()} has been added to the server as :${name}:`);
                } catch (error) {
                    interaction.reply('Failed to add the emoji. Please ensure the emoji is correct and try again. ❌');
                }
            } else {
                interaction.reply('Invalid emoji format. Please provide a URL or a valid emoji from another server. ❌');
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
