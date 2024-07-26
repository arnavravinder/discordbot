const { Client, Intents, Collection } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const PREFIX = '!';

client.commands = new Collection();

client.once('ready', () => {
    console.log('Bot is online! 💪');
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
                gold: 50,
            };
            message.channel.send(`Welcome to the RPG, ${message.author.username}! Your adventure begins now. 🏰`);
        } else {
            message.channel.send(`You have already started your adventure, ${message.author.username}! 🛡️`);
        }
    }

    if (command === 'profile') {
        const user = users[message.author.id];
        if (user) {
            message.channel.send(`**${user.username}'s Profile**\nLevel: ${user.level} 🏅\nExperience: ${user.experience} ⭐\nHealth: ${user.health} ❤️\nMana: ${user.mana} 🔮\nGold: ${user.gold} 💰\nInventory: ${user.inventory.join(', ') || 'Empty'}`);
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'battle') {
        const user = users[message.author.id];
        if (user) {
            const outcome = Math.random() > 0.5 ? 'win' : 'lose';
            if (outcome === 'win') {
                user.experience += 10;
                user.health -= 10;
                user.gold += 5;
                message.channel.send(`${user.username} fought bravely and won! 🏆 You gained 10 experience, 5 gold, but lost 10 health.`);
            } else {
                user.health -= 20;
                message.channel.send(`${user.username} fought bravely but lost. 😢 You lost 20 health.`);
            }

            if (user.experience >= user.level * 20) {
                user.level += 1;
                user.experience = 0;
                user.health = 100;
                user.mana = 50;
                message.channel.send(`Congratulations, ${user.username}! 🎉 You leveled up to level ${user.level}. Your health and mana have been restored.`);
            }

            if (user.health <= 0) {
                message.channel.send(`${user.username} has fallen in battle. 🪦 Rest in peace, brave warrior.`);
                delete users[message.author.id];
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'shop') {
        message.channel.send(`🛒 **Welcome to the shop!**\n1. Health Potion (10 gold) - Type !buy health\n2. Mana Potion (10 gold) - Type !buy mana\n3. Sword (50 gold) - Type !buy sword`);
    }

    if (command === 'buy') {
        const user = users[message.author.id];
        if (user) {
            const item = args[0];
            if (item === 'health') {
                if (user.gold >= 10) {
                    user.gold -= 10;
                    user.inventory.push('Health Potion');
                    message.channel.send(`${user.username} bought a Health Potion! 💊`);
                } else {
                    message.channel.send(`You don't have enough gold, ${user.username}. 💸`);
                }
            } else if (item === 'mana') {
                if (user.gold >= 10) {
                    user.gold -= 10;
                    user.inventory.push('Mana Potion');
                    message.channel.send(`${user.username} bought a Mana Potion! 💊`);
                } else {
                    message.channel.send(`You don't have enough gold, ${user.username}. 💸`);
                }
            } else if (item === 'sword') {
                if (user.gold >= 50) {
                    user.gold -= 50;
                    user.inventory.push('Sword');
                    message.channel.send(`${user.username} bought a Sword! ⚔️`);
                } else {
                    message.channel.send(`You don't have enough gold, ${user.username}. 💸`);
                }
            } else {
                message.channel.send(`Invalid item, ${user.username}. 🛑`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'use') {
        const user = users[message.author.id];
        if (user) {
            const item = args[0];
            const itemIndex = user.inventory.indexOf(item.charAt(0).toUpperCase() + item.slice(1));
            if (itemIndex !== -1) {
                if (item === 'health') {
                    user.health += 20;
                    if (user.health > 100) user.health = 100;
                    user.inventory.splice(itemIndex, 1);
                    message.channel.send(`${user.username} used a Health Potion! 💊 Health is now ${user.health}.`);
                } else if (item === 'mana') {
                    user.mana += 20;
                    if (user.mana > 50) user.mana = 50;
                    user.inventory.splice(itemIndex, 1);
                    message.channel.send(`${user.username} used a Mana Potion! 💊 Mana is now ${user.mana}.`);
                } else {
                    message.channel.send(`Invalid item usage, ${user.username}. 🛑`);
                }
            } else {
                message.channel.send(`You don't have that item, ${user.username}. ❌`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'leaderboard') {
        const sortedUsers = Object.values(users).sort((a, b) => b.level - a.level || b.experience - a.experience);
        let leaderboard = '**🏆 Leaderboard 🏆**\n';
        sortedUsers.slice(0, 10).forEach((user, index) => {
            leaderboard += `${index + 1}. ${user.username} - Level ${user.level} (${user.experience} XP) - ${user.gold} gold\n`;
        });
        message.channel.send(leaderboard);
    }

    if (command === 'quest') {
        const user = users[message.author.id];
        if (user) {
            const questOutcome = Math.random();
            if (questOutcome < 0.3) {
                const goldFound = Math.floor(Math.random() * 20) + 10;
                user.gold += goldFound;
                message.channel.send(`${user.username} went on a quest and found ${goldFound} gold! 💰`);
            } else if (questOutcome < 0.6) {
                const experienceGained = Math.floor(Math.random() * 20) + 10;
                user.experience += experienceGained;
                message.channel.send(`${user.username} went on a quest and gained ${experienceGained} experience! ⭐`);
            } else {
                const healthLost = Math.floor(Math.random() * 20) + 10;
                user.health -= healthLost;
                if (user.health <= 0) {
                    message.channel.send(`${user.username} went on a quest and lost ${healthLost} health, leading to their demise. 🪦`);
                    delete users[message.author.id];
                } else {
                    message.channel.send(`${user.username} went on a quest and lost ${healthLost} health. ❤️`);
                }
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'heal') {
        const user = users[message.author.id];
        if (user) {
            if (user.gold >= 20) {
                user.gold -= 20;
                user.health = 100;
                message.channel.send(`${user.username} has been fully healed for 20 gold. ❤️`);
            } else {
                message.channel.send(`You don't have enough gold to heal, ${user.username}. 💸`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }
});

client.login('held'); //enter api key
