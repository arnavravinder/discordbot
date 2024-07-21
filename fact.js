const { Client, Intents, REST, Routes } = require('discord.js');
const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();

const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS, 
        Intents.FLAGS.GUILD_MESSAGES
    ]
});

const commands = [
    {
        name: 'fact',
        description: 'Get a random fact'
    },
    {
        name: 'setfacttime',
        description: 'Set the time for the daily fact',
        options: [
            {
                name: 'time',
                type: 'STRING',
                description: 'Time in HH:MM format (24-hour)',
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

let factTime = '09:00'; // Default time

client.once('ready', () => {
    console.log('Daily Fact Bot is online! 📚');
    scheduleDailyFact(factTime);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'fact') {
        const fact = await getRandomFact();
        interaction.reply(`📘 **Random Fact:** ${fact}`);
    } else if (commandName === 'setfacttime') {
        factTime = options.getString('time');
        interaction.reply(`Daily fact time set to ${factTime} ⏰`);
        scheduleDailyFact(factTime);
    }
});

async function getRandomFact() {
    try {
        const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
        return response.data.text;
    } catch (error) {
        console.error('Error fetching fact:', error);
        return 'Could not fetch a fact at this time.';
    }
}

function scheduleDailyFact(time) {
    const [hour, minute] = time.split(':').map(num => parseInt(num, 10));
    const cronTime = `${minute} ${hour} * * *`;

    cron.schedule(cronTime, async () => {
        const channel = await client.channels.fetch(process.env.CHANNEL_ID);
        const fact = await getRandomFact();
        channel.send(`📘 **Daily Fact:** ${fact}`);
    }, {
        scheduled: true,
        timezone: "Etc/UTC"
    });

    console.log(`Scheduled daily fact at ${time}`);
}

client.login(process.env.DISCORD_TOKEN);
