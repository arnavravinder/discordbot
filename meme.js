const { Client, Intents, REST, Routes } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
});

const commands = [
    {
        name: 'meme',
        description: 'Fetches a random meme'
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
    console.log('Meme Bot is online! 🎉');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'meme') {
        const meme = await fetchMeme();
        if (meme) {
            interaction.reply({ content: meme.title, files: [meme.url] });
        } else {
            interaction.reply('Could not fetch a meme at this time. 😢');
        }
    }
});

async function fetchMeme() {
    try {
        const response = await axios.get('https://www.reddit.com/r/memes/random/.json');
        const [list] = response.data;
        const [post] = list.data.children;

        return {
            title: post.data.title,
            url: post.data.url
        };
    } catch (error) {
        console.error('Error fetching meme:', error);
        return null;
    }
}

client.login(process.env.DISCORD_TOKEN);
