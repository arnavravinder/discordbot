const { Client, Intents, REST, Routes } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
});

const commands = [
    {
        name: 'createpoll',
        description: 'Create a poll',
        options: [
            {
                name: 'question',
                type: 'STRING',
                description: 'The poll question',
                required: true
            },
            {
                name: 'option1',
                type: 'STRING',
                description: 'First option',
                required: true
            },
            {
                name: 'option2',
                type: 'STRING',
                description: 'Second option',
                required: true
            },
            {
                name: 'option3',
                type: 'STRING',
                description: 'Third option',
                required: false
            },
            {
                name: 'option4',
                type: 'STRING',
                description: 'Fourth option',
                required: false
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
    console.log('Poll Bot is online! 🗳️');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'createpoll') {
        const question = options.getString('question');
        const option1 = options.getString('option1');
        const option2 = options.getString('option2');
        const option3 = options.getString('option3');
        const option4 = options.getString('option4');

        let pollMessage = `📊 **${question}**\n\n1️⃣ ${option1}\n2️⃣ ${option2}`;
        if (option3) pollMessage += `\n3️⃣ ${option3}`;
        if (option4) pollMessage += `\n4️⃣ ${option4}`;

        const poll = await interaction.reply({ content: pollMessage, fetchReply: true });

        poll.react('1️⃣');
        poll.react('2️⃣');
        if (option3) poll.react('3️⃣');
        if (option4) poll.react('4️⃣');
    }
});

client.login(process.env.DISCORD_TOKEN);
