const { Client, Intents, Collection } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const PREFIX = '!';

client.commands = new Collection();

client.once('ready', () => {
    console.log('Bot is online!');
});

const users = {};

client.on('messageCreate', async message => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'start') {
        if (!users[message.author.id]) {
            users[message.author.id] = {
                id: message.author.id,
                username: message.author.username,
                level: 1,
                experience: 0,
                health: 100,
                mana: 50,
                inventory: [],
            };
            message.channel.send(`Welcome to the RPG, ${message.author.username}! Your adventure begins now.`);
        } else {
            message.channel.send(`You have already started your adventure, ${message.author.username}!`);
        }
    }

    if (command === 'profile') {
        const user = users[message.author.id];
        if (user) {
            message.channel.send(`**${user.username}'s Profile**\nLevel: ${user.level}\nExperience: ${user.experience}\nHealth: ${user.health}\nMana: ${user.mana}\nInventory: ${user.inventory.join(', ') || 'Empty'}`);
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin.`);
        }
    }

    if (command === 'battle') {
        const user = users[message.author.id];
        if (user) {
            const outcome = Math.random() > 0.5 ? 'win' : 'lose';
            if (outcome === 'win') {
                user.experience += 10;
                user.health -= 10;
                message.channel.send(`${user.username} fought bravely and won! You gained 10 experience but lost 10 health.`);
            } else {
                user.health -= 20;
                message.channel.send(`${user.username} fought bravely but lost. You lost 20 health.`);
            }

            if (user.experience >= user.level * 20) {
                user.level += 1;
                user.experience = 0;
                user.health = 100;
                user.mana = 50;
                message.channel.send(`Congratulations, ${user.username}! You leveled up to level ${user.level}. Your health and mana have been restored.`);
            }

            if (user.health <= 0) {
                message.channel.send(`${user.username} has fallen in battle. Rest in peace, brave warrior.`);
                delete users[message.author.id];
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin.`);
        }
    }
});

client.login('held'); //enter api key
