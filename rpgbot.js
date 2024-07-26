const { Client, Intents, Collection } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const PREFIX = '!';

client.commands = new Collection();

client.once('ready', () => {
    console.log('Bot is online! 💪');
});

const users = {};
const guilds = {};
const enemies = ['Goblin', 'Orc', 'Troll', 'Dragon'];

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
                questsCompleted: 0,
                allies: [],
                skills: [],
                guild: null,
            };
            message.channel.send(`Welcome to the RPG, ${message.author.username}! Your adventure begins now. 🏰`);
        } else {
            message.channel.send(`You have already started your adventure, ${message.author.username}! 🛡️`);
        }
    }

    if (command === 'profile') {
        const user = users[message.author.id];
        if (user) {
            message.channel.send(`**${user.username}'s Profile**\nLevel: ${user.level} 🏅\nExperience: ${user.experience} ⭐\nHealth: ${user.health} ❤️\nMana: ${user.mana} 🔮\nGold: ${user.gold} 💰\nInventory: ${user.inventory.join(', ') || 'Empty'}\nQuests Completed: ${user.questsCompleted} 🏆\nAllies: ${user.allies.join(', ') || 'None'}\nSkills: ${user.skills.join(', ') || 'None'}\nGuild: ${user.guild || 'None'}`);
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'battle') {
        const user = users[message.author.id];
        if (user) {
            const enemy = enemies[Math.floor(Math.random() * enemies.length)];
            const outcome = Math.random() > 0.5 ? 'win' : 'lose';
            if (outcome === 'win') {
                user.experience += 10;
                user.health -= 10;
                user.gold += 5;
                message.channel.send(`${user.username} fought bravely and defeated a ${enemy}! 🏆 You gained 10 experience, 5 gold, but lost 10 health.`);
            } else {
                user.health -= 20;
                message.channel.send(`${user.username} fought bravely against a ${enemy} but lost. 😢 You lost 20 health.`);
            }

            if (user.experience >= user.level * 20) {
                user.level += 1;
                user.experience = 0;
                user.health = 100;
                user.mana = 50;
                message.channel.send(`Congratulations, ${user.username}! 🎉 You leveled up to level ${user.level}. Your health and mana have been restored.`);
            }

            if (user.health <= 0) {
                message.channel.send(`${user.username} has fallen in battle against a ${enemy}. 🪦 Rest in peace, brave warrior.`);
                delete users[message.author.id];
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'shop') {
        message.channel.send(`🛒 **Welcome to the shop!**\n1. Health Potion (10 gold) - Type !buy health\n2. Mana Potion (10 gold) - Type !buy mana\n3. Sword (50 gold) - Type !buy sword\n4. Shield (50 gold) - Type !buy shield\n5. Spell Book (100 gold) - Type !buy spellbook`);
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
            } else if (item === 'shield') {
                if (user.gold >= 50) {
                    user.gold -= 50;
                    user.inventory.push('Shield');
                    message.channel.send(`${user.username} bought a Shield! 🛡️`);
                } else {
                    message.channel.send(`You don't have enough gold, ${user.username}. 💸`);
                }
            } else if (item === 'spellbook') {
                if (user.gold >= 100) {
                    user.gold -= 100;
                    user.inventory.push('Spell Book');
                    message.channel.send(`${user.username} bought a Spell Book! 📖`);
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
                user.questsCompleted += 1;
                message.channel.send(`${user.username} went on a quest and found ${goldFound} gold! 💰`);
            } else if (questOutcome < 0.6) {
                const experienceGained = Math.floor(Math.random() * 20) + 10;
                user.experience += experienceGained;
                user.questsCompleted += 1;
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

    if (command === 'ally') {
        const user = users[message.author.id];
        if (user) {
            const allyName = args.join(' ');
            if (allyName) {
                user.allies.push(allyName);
                message.channel.send(`${user.username} has formed an alliance with ${allyName}! 👫`);
            } else {
                message.channel.send(`Please specify the name of your ally, ${user.username}. 🛑`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'learn') {
        const user = users[message.author.id];
        if (user) {
            const skill = args.join(' ');
            if (skill) {
                user.skills.push(skill);
                message.channel.send(`${user.username} has learned a new skill: ${skill}! 📚`);
            } else {
                message.channel.send(`Please specify the skill you want to learn, ${user.username}. 🛑`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'trade') {
        const user = users[message.author.id];
        if (user) {
            const [targetUser, item] = args;
            if (users[targetUser] && item) {
                const itemIndex = user.inventory.indexOf(item.charAt(0).toUpperCase() + item.slice(1));
                if (itemIndex !== -1) {
                    user.inventory.splice(itemIndex, 1);
                    users[targetUser].inventory.push(item.charAt(0).toUpperCase() + item.slice(1));
                    message.channel.send(`${user.username} traded ${item} with ${targetUser}. 🤝`);
                } else {
                    message.channel.send(`You don't have that item, ${user.username}. ❌`);
                }
            } else {
                message.channel.send(`Invalid trade parameters, ${user.username}. 🛑`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'explore') {
        const user = users[message.author.id];
        if (user) {
            const explorationOutcome = Math.random();
            if (explorationOutcome < 0.4) {
                const itemFound = ['Gemstone', 'Ancient Relic', 'Magic Herb'][Math.floor(Math.random() * 3)];
                user.inventory.push(itemFound);
                message.channel.send(`${user.username} explored the land and found a ${itemFound}! 🌟`);
            } else if (explorationOutcome < 0.7) {
                const experienceGained = Math.floor(Math.random() * 10) + 5;
                user.experience += experienceGained;
                message.channel.send(`${user.username} explored the land and gained ${experienceGained} experience! ⭐`);
            } else {
                const healthLost = Math.floor(Math.random() * 10) + 5;
                user.health -= healthLost;
                if (user.health <= 0) {
                    message.channel.send(`${user.username} got lost during exploration and lost ${healthLost} health, leading to their demise. 🪦`);
                    delete users[message.author.id];
                } else {
                    message.channel.send(`${user.username} got lost during exploration and lost ${healthLost} health. ❤️`);
                }
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'train') {
        const user = users[message.author.id];
        if (user) {
            const trainingOutcome = Math.random();
            if (trainingOutcome < 0.5) {
                const skill = ['Swordsmanship', 'Magic', 'Archery'][Math.floor(Math.random() * 3)];
                user.skills.push(skill);
                message.channel.send(`${user.username} trained hard and learned ${skill}! 🏋️‍♂️`);
            } else {
                const healthLost = Math.floor(Math.random() * 10) + 5;
                user.health -= healthLost;
                if (user.health <= 0) {
                    message.channel.send(`${user.username} overtrained and lost ${healthLost} health, leading to their demise. 🪦`);
                    delete users[message.author.id];
                } else {
                    message.channel.send(`${user.username} overtrained and lost ${healthLost} health. ❤️`);
                }
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'stats') {
        const totalUsers = Object.keys(users).length;
        const totalQuests = Object.values(users).reduce((acc, user) => acc + user.questsCompleted, 0);
        const totalGold = Object.values(users).reduce((acc, user) => acc + user.gold, 0);
        const totalLevels = Object.values(users).reduce((acc, user) => acc + user.level, 0);
        message.channel.send(`**Game Stats**\nTotal Players: ${totalUsers}\nTotal Quests Completed: ${totalQuests}\nTotal Gold: ${totalGold}\nTotal Levels Gained: ${totalLevels}`);
    }

    if (command === 'resurrect') {
        const user = users[message.author.id];
        if (user) {
            if (user.health <= 0) {
                user.health = 50;
                message.channel.send(`${user.username} has been resurrected with 50 health! 💀`);
            } else {
                message.channel.send(`${user.username} is already alive! ❌`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'attack') {
        const user = users[message.author.id];
        const targetUser = args[0];
        if (user && users[targetUser]) {
            const attackOutcome = Math.random();
            if (attackOutcome < 0.5) {
                const damage = Math.floor(Math.random() * 20) + 10;
                users[targetUser].health -= damage;
                message.channel.send(`${user.username} attacked ${targetUser} and dealt ${damage} damage! ⚔️`);
                if (users[targetUser].health <= 0) {
                    message.channel.send(`${targetUser} has been defeated by ${user.username}! 🪦`);
                    delete users[targetUser];
                }
            } else {
                message.channel.send(`${user.username}'s attack on ${targetUser} missed! ❌`);
            }
        } else {
            message.channel.send(`Invalid attack command or target, ${user.username}. 🛑`);
        }
    }

    if (command === 'defend') {
        const user = users[message.author.id];
        if (user) {
            const defendOutcome = Math.random();
            if (defendOutcome < 0.5) {
                const defenseBoost = Math.floor(Math.random() * 10) + 5;
                user.health += defenseBoost;
                if (user.health > 100) user.health = 100;
                message.channel.send(`${user.username} defended successfully and gained ${defenseBoost} health! 🛡️`);
            } else {
                const healthLost = Math.floor(Math.random() * 10) + 5;
                user.health -= healthLost;
                if (user.health <= 0) {
                    message.channel.send(`${user.username} failed to defend and lost ${healthLost} health, leading to their demise. 🪦`);
                    delete users[message.author.id];
                } else {
                    message.channel.send(`${user.username} failed to defend and lost ${healthLost} health. ❤️`);
                }
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'spy') {
        const user = users[message.author.id];
        const targetUser = args[0];
        if (user && users[targetUser]) {
            const spyOutcome = Math.random();
            if (spyOutcome < 0.5) {
                message.channel.send(`${user.username} spied on ${targetUser} and saw their profile:\nLevel: ${users[targetUser].level}\nHealth: ${users[targetUser].health}\nMana: ${users[targetUser].mana}\nGold: ${users[targetUser].gold}\nInventory: ${users[targetUser].inventory.join(', ') || 'Empty'}\nSkills: ${users[targetUser].skills.join(', ') || 'None'}`);
            } else {
                message.channel.send(`${user.username} failed to spy on ${targetUser}. ❌`);
            }
        } else {
            message.channel.send(`Invalid spy command or target, ${user.username}. 🛑`);
        }
    }

    if (command === 'guild') {
        const subCommand = args.shift().toLowerCase();
        if (subCommand === 'create') {
            const guildName = args.join(' ');
            if (guildName && !guilds[guildName]) {
                guilds[guildName] = {
                    name: guildName,
                    leader: message.author.id,
                    members: [message.author.id],
                };
                users[message.author.id].guild = guildName;
                message.channel.send(`${message.author.username} created the guild "${guildName}"! 🏰`);
            } else {
                message.channel.send(`Invalid guild name or guild already exists. ❌`);
            }
        } else if (subCommand === 'join') {
            const guildName = args.join(' ');
            if (guildName && guilds[guildName] && !users[message.author.id].guild) {
                guilds[guildName].members.push(message.author.id);
                users[message.author.id].guild = guildName;
                message.channel.send(`${message.author.username} joined the guild "${guildName}"! 🏰`);
            } else {
                message.channel.send(`Invalid guild name or you're already in a guild. ❌`);
            }
        } else if (subCommand === 'leave') {
            const guildName = users[message.author.id].guild;
            if (guildName) {
                const guild = guilds[guildName];
                guild.members = guild.members.filter(id => id !== message.author.id);
                users[message.author.id].guild = null;
                if (guild.leader === message.author.id) {
                    if (guild.members.length > 0) {
                        guild.leader = guild.members[0];
                        message.channel.send(`${message.author.username} left the guild "${guildName}". The new leader is <@${guild.leader}>. 🏰`);
                    } else {
                        delete guilds[guildName];
                        message.channel.send(`${message.author.username} left the guild "${guildName}", which has been disbanded. 🏰`);
                    }
                } else {
                    message.channel.send(`${message.author.username} left the guild "${guildName}". 🏰`);
                }
            } else {
                message.channel.send(`You're not in a guild. ❌`);
            }
        } else if (subCommand === 'list') {
            let guildList = '**🏰 Guilds 🏰**\n';
            for (const guildName in guilds) {
                const guild = guilds[guildName];
                guildList += `${guild.name} - Leader: <@${guild.leader}> - Members: ${guild.members.length}\n`;
            }
            message.channel.send(guildList);
        } else {
            message.channel.send(`Invalid guild command. ❌`);
        }
    }
});

client.login('held'); //enter api key
