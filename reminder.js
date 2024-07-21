const { Client, Intents, REST, Routes } = require('discord.js');
const cron = require('node-cron');
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
        name: 'remindme',
        description: 'Set a reminder',
        options: [
            {
                name: 'time',
                type: 'STRING',
                description: 'Time in cron format (e.g., "0 9 * * *" for 9 AM daily)',
                required: true
            },
            {
                name: 'message',
                type: 'STRING',
                description: 'The reminder message',
                required: true
            }
        ]
    },
    {
        name: 'listreminders',
        description: 'List all active reminders'
    },
    {
        name: 'cancelreminder',
        description: 'Cancel a reminder',
        options: [
            {
                name: 'id',
                type: 'STRING',
                description: 'The ID of the reminder to cancel',
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

let reminders = {};

client.once('ready', () => {
    console.log('Reminder Bot is online! ⏰');
    client.user.setActivity('Setting reminders! 🕰️', { type: 'WATCHING' });
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'remindme') {
        const time = options.getString('time');
        const message = options.getString('message');
        const reminderId = Date.now().toString();

        reminders[reminderId] = cron.schedule(time, () => {
            const channel = client.channels.cache.get(process.env.REMINDER_CHANNEL_ID);
            if (channel) {
                channel.send(`🔔 **Reminder:** ${message}`);
            }
        });

        interaction.reply(`Reminder set! ⏰ ID: \`${reminderId}\` at \`${time}\` with message: "${message}"`);
    } else if (commandName === 'listreminders') {
        const reminderList = Object.keys(reminders).map(id => `ID: \`${id}\` - ${reminders[id].getStatus()}`).join('\n');
        interaction.reply(reminderList || 'No active reminders. 📭');
    } else if (commandName === 'cancelreminder') {
        const id = options.getString('id');
        if (reminders[id]) {
            reminders[id].stop();
            delete reminders[id];
            interaction.reply(`Reminder with ID \`${id}\` has been canceled. ❌`);
        } else {
            interaction.reply(`No reminder found with ID \`${id}\`. 🤔`);
        }
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!reminders')) {
        const reminderList = Object.keys(reminders).map(id => `ID: \`${id}\` - ${reminders[id].getStatus()}`).join('\n');
        message.channel.send(reminderList || 'No active reminders. 📭');
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;

    const message = reaction.message;
    if (reaction.emoji.name === '⏰') {
        const args = message.content.split(' ');
        if (args[0] === '!remindme') {
            const time = args[1];
            const reminderMessage = args.slice(2).join(' ');
            const reminderId = Date.now().toString();

            reminders[reminderId] = cron.schedule(time, () => {
                const channel = client.channels.cache.get(process.env.REMINDER_CHANNEL_ID);
                if (channel) {
                    channel.send(`🔔 **Reminder:** ${reminderMessage}`);
                }
            });

            message.channel.send(`Reminder set! ⏰ ID: \`${reminderId}\` at \`${time}\` with message: "${reminderMessage}"`);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
