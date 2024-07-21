const { Client, Intents, REST, Routes } = require('discord.js');
const cron = require('node-cron');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
});

const commands = [
    {
        name: 'setbirthday',
        description: 'Set your birthday',
        options: [
            {
                name: 'date',
                type: 'STRING',
                description: 'Your birthday in YYYY-MM-DD format',
                required: true
            }
        ]
    },
    {
        name: 'upcomingbirthdays',
        description: 'List upcoming birthdays'
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

const birthdaysFile = './birthdays.json';
let birthdays = {};

if (fs.existsSync(birthdaysFile)) {
    const data = fs.readFileSync(birthdaysFile);
    birthdays = JSON.parse(data);
} else {
    fs.writeFileSync(birthdaysFile, JSON.stringify(birthdays));
}

client.once('ready', () => {
    console.log('Birthday Bot is online! 🎉');
    scheduleBirthdayChecks();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'setbirthday') {
        const date = options.getString('date');
        const userId = interaction.user.id;
        const userName = interaction.user.username;

        if (isValidDate(date)) {
            birthdays[userId] = { date, name: userName };
            fs.writeFileSync(birthdaysFile, JSON.stringify(birthdays, null, 2));
            interaction.reply(`Your birthday has been set to ${date} 🎂`);
        } else {
            interaction.reply('Invalid date format. Please use YYYY-MM-DD. 📅');
        }
    } else if (commandName === 'upcomingbirthdays') {
        const upcoming = getUpcomingBirthdays();
        if (upcoming.length > 0) {
            interaction.reply(`🎉 **Upcoming Birthdays:**\n${upcoming.join('\n')}`);
        } else {
            interaction.reply('No upcoming birthdays found. 📭');
        }
    }
});

function isValidDate(date) {
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
}

function getUpcomingBirthdays() {
    const today = new Date();
    const upcoming = [];

    for (const userId in birthdays) {
        const { date, name } = birthdays[userId];
        const birthday = new Date(date);
        birthday.setFullYear(today.getFullYear());

        if (birthday >= today && birthday <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
            const formattedDate = birthday.toISOString().split('T')[0];
            upcoming.push(`${name} - ${formattedDate}`);
        }
    }

    return upcoming;
}

function scheduleBirthdayChecks() {
    cron.schedule('0 0 * * *', () => {
        const today = new Date().toISOString().split('T')[0];
        const channel = client.channels.cache.get(process.env.BIRTHDAY_CHANNEL_ID);

        if (channel) {
            for (const userId in birthdays) {
                const { date, name } = birthdays[userId];
                if (date === today) {
                    channel.send(`🎉 Happy Birthday, ${name}! 🎂`);
                }
            }
        }
    });
}

client.login(process.env.DISCORD_TOKEN);
