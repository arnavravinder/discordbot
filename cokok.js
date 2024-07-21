const { Client, Intents, REST, Routes } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
});

const prefix = "!";

const commands = [
    {
        name: 'randomrecipe',
        description: 'Get a random recipe'
    },
    {
        name: 'searchrecipe',
        description: 'Search for a recipe by name',
        options: [
            {
                name: 'query',
                type: 'STRING',
                description: 'The name of the recipe to search for',
                required: true
            }
        ]
    },
    {
        name: 'cookingtip',
        description: 'Get a random cooking tip'
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
    console.log('Recipe Bot is online! 🍽️');
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'randomrecipe') {
        const recipe = await getRandomRecipe();
        if (recipe) {
            message.channel.send(`🍽️ **${recipe.title}**\n${recipe.sourceUrl}`);
        } else {
            message.channel.send('Could not fetch a recipe at this time. 😢');
        }
    } else if (command === 'searchrecipe') {
        const query = args.join(' ');
        const recipe = await searchRecipe(query);
        if (recipe) {
            message.channel.send(`🍽️ **${recipe.title}**\n${recipe.sourceUrl}`);
        } else {
            message.channel.send('Could not find a recipe matching your query. 😢');
        }
    } else if (command === 'cookingtip') {
        const tip = await getRandomCookingTip();
        if (tip) {
            message.channel.send(`👨‍🍳 **Cooking Tip:** ${tip}`);
        } else {
            message.channel.send('Could not fetch a cooking tip at this time. 😢');
        }
    }
});

async function getRandomRecipe() {
    try {
        const response = await axios.get(`https://api.spoonacular.com/recipes/random`, {
            params: {
                apiKey: process.env.SPOONACULAR_API_KEY
            }
        });
        return response.data.recipes[0];
    } catch (error) {
        console.error('Error fetching random recipe:', error);
        return null;
    }
}

async function searchRecipe(query) {
    try {
        const response = await axios.get(`https://api.spoonacular.com/recipes/complexSearch`, {
            params: {
                query,
                number: 1,
                apiKey: process.env.SPOONACULAR_API_KEY
            }
        });
        const results = response.data.results;
        if (results.length > 0) {
            const recipeId = results[0].id;
            const recipeResponse = await axios.get(`https://api.spoonacular.com/recipes/${recipeId}/information`, {
                params: {
                    apiKey: process.env.SPOONACULAR_API_KEY
                }
            });
            return recipeResponse.data;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error searching for recipe:', error);
        return null;
    }
}

async function getRandomCookingTip() {
    try {
        const tips = [
            "Always read the recipe all the way through before starting.",
            "Use fresh ingredients for better flavor.",
            "Keep your knives sharp.",
            "Clean as you go to keep your workspace tidy.",
            "Taste your food as you cook."
        ];
        const randomIndex = Math.floor(Math.random() * tips.length);
        return tips[randomIndex];
    } catch (error) {
        console.error('Error fetching cooking tip:', error);
        return null;
    }
}

client.login(process.env.DISCORD_TOKEN);
