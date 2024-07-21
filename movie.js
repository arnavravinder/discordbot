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
        name: 'recommendmovie',
        description: 'Get a movie recommendation based on genre',
        options: [
            {
                name: 'genre',
                type: 'STRING',
                description: 'The genre of movie',
                required: true,
                choices: [
                    { name: 'Action', value: '28' },
                    { name: 'Comedy', value: '35' },
                    { name: 'Drama', value: '18' },
                    { name: 'Fantasy', value: '14' },
                    { name: 'Horror', value: '27' },
                    { name: 'Romance', value: '10749' },
                    { name: 'Sci-Fi', value: '878' },
                    { name: 'Thriller', value: '53' }
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
    console.log('Movie Recommendation Bot is online! 🎬');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'recommendmovie') {
        const genre = options.getString('genre');
        const movie = await fetchMovieRecommendation(genre);
        if (movie) {
            interaction.reply(`🎬 **${movie.title}**\n⭐ ${movie.vote_average}/10\n${movie.overview}`);
        } else {
            interaction.reply('Could not fetch a movie recommendation at this time. 😢');
        }
    }
});

async function fetchMovieRecommendation(genre) {
    try {
        const response = await axios.get(`https://api.themoviedb.org/3/discover/movie`, {
            params: {
                api_key: process.env.TMDB_API_KEY,
                with_genres: genre,
                sort_by: 'popularity.desc'
            }
        });

        const movies = response.data.results;
        if (movies.length > 0) {
            const randomIndex = Math.floor(Math.random() * movies.length);
            return movies[randomIndex];
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching movie recommendation:', error);
        return null;
    }
}

client.login(process.env.DISCORD_TOKEN);
