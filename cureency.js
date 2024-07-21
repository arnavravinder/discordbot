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
        name: 'convertcurrency',
        description: 'Convert currency values',
        options: [
            {
                name: 'amount',
                type: 'NUMBER',
                description: 'The amount of money to convert',
                required: true
            },
            {
                name: 'from',
                type: 'STRING',
                description: 'The currency code to convert from (e.g., USD)',
                required: true
            },
            {
                name: 'to',
                type: 'STRING',
                description: 'The currency code to convert to (e.g., EUR)',
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
    console.log('Currency Converter Bot is online! 💱');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'convertcurrency') {
        const amount = options.getNumber('amount');
        const from = options.getString('from').toUpperCase();
        const to = options.getString('to').toUpperCase();

        const result = await convertCurrency(amount, from, to);
        if (result) {
            interaction.reply(`💱 ${amount} ${from} is approximately ${result.toFixed(2)} ${to}`);
        } else {
            interaction.reply('Failed to convert currency. Please check the currency codes and try again. ❌');
        }
    }
});

async function convertCurrency(amount, from, to) {
    try {
        const response = await axios.get(`https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/latest/${from}`);
        const rates = response.data.conversion_rates;
        const rate = rates[to];

        if (rate) {
            return amount * rate;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error converting currency:', error);
        return null;
    }
}

client.login(process.env.DISCORD_TOKEN);
