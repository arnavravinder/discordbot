const { Client, Intents, REST, Routes } = require('discord.js');
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
        name: 'addtodo',
        description: 'Add an item to your to-do list',
        options: [
            {
                name: 'item',
                type: 'STRING',
                description: 'The to-do item',
                required: true
            }
        ]
    },
    {
        name: 'viewtodos',
        description: 'View your to-do list'
    },
    {
        name: 'donetodo',
        description: 'Mark a to-do item as done',
        options: [
            {
                name: 'itemnumber',
                type: 'INTEGER',
                description: 'The number of the item to mark as done',
                required: true
            }
        ]
    },
    {
        name: 'deletetodo',
        description: 'Delete a to-do item',
        options: [
            {
                name: 'itemnumber',
                type: 'INTEGER',
                description: 'The number of the item to delete',
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

const todosFile = './todos.json';
let todos = {};

if (fs.existsSync(todosFile)) {
    const data = fs.readFileSync(todosFile);
    todos = JSON.parse(data);
} else {
    fs.writeFileSync(todosFile, JSON.stringify(todos));
}

client.once('ready', () => {
    console.log('To-Do List Bot is online! 📝');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'addtodo') {
        const item = options.getString('item');
        const userId = interaction.user.id;

        if (!todos[userId]) {
            todos[userId] = [];
        }

        todos[userId].push({ item, done: false });
        fs.writeFileSync(todosFile, JSON.stringify(todos, null, 2));

        interaction.reply(`Added to your to-do list: "${item}" 📝`);
    } else if (commandName === 'viewtodos') {
        const userId = interaction.user.id;
        const userTodos = todos[userId] || [];

        if (userTodos.length === 0) {
            interaction.reply('Your to-do list is empty. 📭');
        } else {
            const todoList = userTodos.map((todo, index) => `${index + 1}. ${todo.done ? '~~' : ''}${todo.item}${todo.done ? '~~' : ''}`).join('\n');
            interaction.reply(`📝 **Your To-Do List:**\n${todoList}`);
        }
    } else if (commandName === 'donetodo') {
        const itemNumber = options.getInteger('itemnumber');
        const userId = interaction.user.id;
        const userTodos = todos[userId] || [];

        if (itemNumber < 1 || itemNumber > userTodos.length) {
            interaction.reply('Invalid item number. ❌');
        } else {
            userTodos[itemNumber - 1].done = true;
            fs.writeFileSync(todosFile, JSON.stringify(todos, null, 2));
            interaction.reply(`Marked item ${itemNumber} as done. ✅`);
        }
    } else if (commandName === 'deletetodo') {
        const itemNumber = options.getInteger('itemnumber');
        const userId = interaction.user.id;
        const userTodos = todos[userId] || [];

        if (itemNumber < 1 || itemNumber > userTodos.length) {
            interaction.reply('Invalid item number. ❌');
        } else {
            userTodos.splice(itemNumber - 1, 1);
            fs.writeFileSync(todosFile, JSON.stringify(todos, null, 2));
            interaction.reply(`Deleted item ${itemNumber} from your to-do list. 🗑️`);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
