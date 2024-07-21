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
        name: 'recommendbook',
        description: 'Get a book recommendation based on genre',
        options: [
            {
                name: 'genre',
                type: 'STRING',
                description: 'The genre of the book',
                required: true,
                choices: [
                    { name: 'Fiction', value: 'fiction' },
                    { name: 'Mystery', value: 'mystery' },
                    { name: 'Fantasy', value: 'fantasy' },
                    { name: 'Science Fiction', value: 'science fiction' },
                    { name: 'Non-Fiction', value: 'non-fiction' },
                    { name: 'Romance', value: 'romance' },
                    { name: 'Horror', value: 'horror' },
                    { name: 'Biography', value: 'biography' }
                ]
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
    console.log('Book Recommendation Bot is online! 📚');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'recommendbook') {
        const genre = options.getString('genre');
        const book = await fetchBookRecommendation(genre);
        if (book) {
            interaction.reply(`📚 **${book.title}** by ${book.authors}\n⭐ Rating: ${book.averageRating || 'N/A'}\n${book.description}`);
        } else {
            interaction.reply('Could not fetch a book recommendation at this time. 😢');
        }
    }
});

async function fetchBookRecommendation(genre) {
    try {
        const response = await axios.get(`https://www.googleapis.com/books/v1/volumes`, {
            params: {
                q: `subject:${genre}`,
                maxResults: 20,
                key: process.env.GOOGLE_BOOKS_API_KEY
            }
        });

        const books = response.data.items;
        if (books.length > 0) {
            const randomIndex = Math.floor(Math.random() * books.length);
            const book = books[randomIndex].volumeInfo;
            return {
                title: book.title,
                authors: book.authors ? book.authors.join(', ') : 'Unknown',
                averageRating: book.averageRating,
                description: book.description ? book.description.substring(0, 200) + '...' : 'No description available'
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching book recommendation:', error);
        return null;
    }
}

client.login(process.env.DISCORD_TOKEN);
