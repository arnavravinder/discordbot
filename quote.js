const { Client, Intents, REST, Routes } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ]
});

const commands = [
    {
        name: 'addquote',
        description: 'Add a memorable quote',
        options: [
            {
                name: 'quote',
                type: 'STRING',
                description: 'The quote text',
                required: true
            },
            {
                name: 'author',
                type: 'STRING',
                description: 'The author of the quote',
                required: true
            }
        ]
    },
    {
        name: 'quote',
        description: 'Get a random quote'
    },
    {
        name: 'listquotes',
        description: 'List all quotes'
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

const quotesFile = './quotes.json';
let quotes = [];

if (fs.existsSync(quotesFile)) {
    const data = fs.readFileSync(quotesFile);
    quotes = JSON.parse(data);
} else {
    fs.writeFileSync(quotesFile, JSON.stringify(quotes));
}

client.once('ready', () => {
    console.log('Quote Bot is online! 📝');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'addquote') {
        const quoteText = options.getString('quote');
        const author = options.getString('author');
        const quote = { text: quoteText, author: author };

        quotes.push(quote);
        fs.writeFileSync(quotesFile, JSON.stringify(quotes, null, 2));

        interaction.reply(`Quote added! 📝 "${quoteText}" - ${author}`);
    } else if (commandName === 'quote') {
        if (quotes.length === 0) {
            interaction.reply('No quotes available. Add some first! 🗒️');
        } else {
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            interaction.reply(`📜 "${randomQuote.text}" - ${randomQuote.author}`);
        }
    } else if (commandName === 'listquotes') {
        if (quotes.length === 0) {
            interaction.reply('No quotes available. Add some first! 🗒️');
        } else {
            const allQuotes = quotes.map((quote, index) => `${index + 1}. "${quote.text}" - ${quote.author}`).join('\n');
            interaction.reply(`📜 **All Quotes:**\n${allQuotes}`);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
