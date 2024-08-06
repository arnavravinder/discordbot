const { Client, Intents } = require('discord.js');
const axios = require('axios');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const OPENAI_API_KEY = ''; // ur api key

const PREFIX = '!';

client.once('ready', () => {
    console.log('🤖 Bot is online!');
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'generate') {
        const prompt = args.join(' ');
        if (!prompt) {
            message.channel.send('⚠️ Please provide a prompt for the image!');
            return;
        }

        try {
            const response = await axios.post(
                'https://api.openai.com/v1/images/generations',
                {
                    prompt: prompt,
                    n: 1,
                    size: '1024x1024'
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${OPENAI_API_KEY}`
                    }
                }
            );

            const imageUrl = response.data.data[0].url;
            message.channel.send(`🖼️ Here is your image: ${imageUrl}`);
        } catch (error) {
            console.error(error);
            message.channel.send('❌ There was an error generating the image.');
        }
    } else if (command === 'quote') {
        try {
            const response = await axios.get('https://api.quotable.io/random');
            const quote = response.data.content;
            const author = response.data.author;
            message.channel.send(`📜 "${quote}" - *${author}*`);
        } catch (error) {
            console.error(error);
            message.channel.send('❌ There was an error fetching the quote.');
        }
    } else if (command === 'weather') {
        const city = args.join(' ');
        if (!city) {
            message.channel.send('⚠️ Please provide a city name!');
            return;
        }

        try {
            const apiKey = ''; // ur weather api key
            const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
            const weather = response.data;
            const temp = weather.main.temp;
            const description = weather.weather[0].description;
            message.channel.send(`🌤️ The current weather in ${city} is ${temp}°C with ${description}.`);
        } catch (error) {
            console.error(error);
            message.channel.send('❌ There was an error fetching the weather.');
        }
    } else if (command === 'help') {
        message.channel.send('📜 **Available Commands:**\n`!generate <prompt>` - Generate an image from the prompt.\n`!quote` - Get a random inspirational quote.\n`!weather <city>` - Get the current weather for the specified city.\n`!help` - List all commands.');
    }
});

client.login('your-discord-bot-token'); // ur discord bot token
