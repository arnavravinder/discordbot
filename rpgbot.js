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
const dungeons = ['Cave of Shadows', 'Forest of Doom', 'Castle of Despair'];

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
                pets: [],
            };
            message.channel.send(`Welcome to the RPG, ${message.author.username}! Your adventure begins now. 🏰`);
        } else {
            message.channel.send(`You have already started your adventure, ${message.author.username}! 🛡️`);
        }
    }

    if (command === 'profile') {
        const user = users[message.author.id];
        if (user) {
            message.channel.send(`**${user.username}'s Profile**\nLevel: ${user.level} 🏅\nExperience: ${user.experience} ⭐\nHealth: ${user.health} ❤️\nMana: ${user.mana} 🔮\nGold: ${user.gold} 💰\nInventory: ${user.inventory.join(', ') || 'Empty'}\nQuests Completed: ${user.questsCompleted} 🏆\nAllies: ${user.allies.join(', ') || 'None'}\nSkills: ${user.skills.join(', ') || 'None'}\nGuild: ${user.guild || 'None'}\nPets: ${user.pets.join(', ') || 'None'}`);
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
        message.channel.send(`🛒 **Welcome to the shop!**\n1. Health Potion (10 gold) - Type !buy health\n2. Mana Potion (10 gold) - Type !buy mana\n3. Sword (50 gold) - Type !buy sword\n4. Shield (50 gold) - Type !buy shield\n5. Spell Book (100 gold) - Type !buy spellbook\n6. Pet Egg (100 gold) - Type !buy petegg`);
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
            } else if (item === 'petegg') {
                if (user.gold >= 100) {
                    user.gold -= 100;
                    user.inventory.push('Pet Egg');
                    message.channel.send(`${user.username} bought a Pet Egg! 🥚`);
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
                } else if (item === 'petegg') {
                    const pet = ['Dragon', 'Phoenix', 'Unicorn'][Math.floor(Math.random() * 3)];
                    user.pets.push(pet);
                    user.inventory.splice(itemIndex, 1);
                    message.channel.send(`${user.username} hatched a ${pet} from the Pet Egg! 🐣`);
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

    if (command === 'dungeon') {
        const user = users[message.author.id];
        if (user) {
            const dungeon = dungeons[Math.floor(Math.random() * dungeons.length)];
            const dungeonOutcome = Math.random();
            if (dungeonOutcome < 0.5) {
                const goldFound = Math.floor(Math.random() * 50) + 25;
                user.gold += goldFound;
                message.channel.send(`${user.username} ventured into the ${dungeon} and found ${goldFound} gold! 🏰`);
            } else if (dungeonOutcome < 0.8) {
                const experienceGained = Math.floor(Math.random() * 50) + 25;
                user.experience += experienceGained;
                message.channel.send(`${user.username} ventured into the ${dungeon} and gained ${experienceGained} experience! ⭐`);
            } else {
                const healthLost = Math.floor(Math.random() * 30) + 20;
                user.health -= healthLost;
                if (user.health <= 0) {
                    message.channel.send(`${user.username} perished in the ${dungeon} and lost ${healthLost} health. 🪦`);
                    delete users[message.author.id];
                } else {
                    message.channel.send(`${user.username} ventured into the ${dungeon} and lost ${healthLost} health. ❤️`);
                }
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'event') {
        const user = users[message.author.id];
        if (user) {
            const eventOutcome = Math.random();
            if (eventOutcome < 0.3) {
                const goldFound = Math.floor(Math.random() * 30) + 15;
                user.gold += goldFound;
                message.channel.send(`${user.username} participated in an event and found ${goldFound} gold! 🎉`);
            } else if (eventOutcome < 0.6) {
                const experienceGained = Math.floor(Math.random() * 30) + 15;
                user.experience += experienceGained;
                message.channel.send(`${user.username} participated in an event and gained ${experienceGained} experience! ⭐`);
            } else if (eventOutcome < 0.9) {
                const itemFound = ['Magic Scroll', 'Enchanted Armor', 'Mystic Ring'][Math.floor(Math.random() * 3)];
                user.inventory.push(itemFound);
                message.channel.send(`${user.username} participated in an event and found a ${itemFound}! 🌟`);
            } else {
                const healthLost = Math.floor(Math.random() * 20) + 10;
                user.health -= healthLost;
                if (user.health <= 0) {
                    message.channel.send(`${user.username} got injured in the event and lost ${healthLost} health, leading to their demise. 🪦`);
                    delete users[message.author.id];
                } else {
                    message.channel.send(`${user.username} got injured in the event and lost ${healthLost} health. ❤️`);
                }
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'guildwar') {
        const user = users[message.author.id];
        const targetGuildName = args.join(' ');
        if (user && users[message.author.id].guild && guilds[targetGuildName]) {
            const userGuildName = users[message.author.id].guild;
            const userGuild = guilds[userGuildName];
            const targetGuild = guilds[targetGuildName];

            if (userGuildName !== targetGuildName) {
                const warOutcome = Math.random();
                if (warOutcome < 0.5) {
                    const goldWon = Math.floor(Math.random() * 100) + 50;
                    userGuild.members.forEach(memberId => {
                        users[memberId].gold += goldWon / userGuild.members.length;
                    });
                    message.channel.send(`${userGuild.name} won the war against ${targetGuild.name} and claimed ${goldWon} gold! ⚔️`);
                } else {
                    const goldLost = Math.floor(Math.random() * 100) + 50;
                    userGuild.members.forEach(memberId => {
                        users[memberId].gold -= goldLost / userGuild.members.length;
                        if (users[memberId].gold < 0) users[memberId].gold = 0;
                    });
                    message.channel.send(`${userGuild.name} lost the war against ${targetGuild.name} and lost ${goldLost} gold. 🛡️`);
                }
            } else {
                message.channel.send(`You cannot declare war on your own guild, ${user.username}. ❌`);
            }
        } else {
            message.channel.send(`Invalid guild war command or target, ${user.username}. 🛑`);
        }
    }

    if (command === 'craft') {
        const user = users[message.author.id];
        if (user) {
            const item1 = args[0];
            const item2 = args[1];
            const item1Index = user.inventory.indexOf(item1.charAt(0).toUpperCase() + item1.slice(1));
            const item2Index = user.inventory.indexOf(item2.charAt(0).toUpperCase() + item2.slice(1));
            if (item1Index !== -1 && item2Index !== -1) {
                const craftedItem = ['Magic Wand', 'Enchanted Sword', 'Mystic Shield'][Math.floor(Math.random() * 3)];
                user.inventory.splice(item1Index, 1);
                user.inventory.splice(item2Index, 1);
                user.inventory.push(craftedItem);
                message.channel.send(`${user.username} crafted a ${craftedItem} using ${item1} and ${item2}! 🛠️`);
            } else {
                message.channel.send(`You don't have the required items to craft, ${user.username}. ❌`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'tame') {
        const user = users[message.author.id];
        if (user) {
            const pet = ['Dragon', 'Phoenix', 'Unicorn'][Math.floor(Math.random() * 3)];
            const tameOutcome = Math.random();
            if (tameOutcome < 0.5) {
                user.pets.push(pet);
                message.channel.send(`${user.username} tamed a wild ${pet}! 🐾`);
            } else {
                message.channel.send(`${user.username} failed to tame the wild ${pet}. ❌`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'trainpet') {
        const user = users[message.author.id];
        if (user) {
            const pet = user.pets[Math.floor(Math.random() * user.pets.length)];
            if (pet) {
                const trainOutcome = Math.random();
                if (trainOutcome < 0.5) {
                    const skill = ['Flying', 'Breathing Fire', 'Healing'][Math.floor(Math.random() * 3)];
                    user.skills.push(`${pet} - ${skill}`);
                    message.channel.send(`${user.username} trained ${pet} and it learned ${skill}! 🐾`);
                } else {
                    message.channel.send(`${user.username} tried to train ${pet}, but it didn't learn anything. ❌`);
                }
            } else {
                message.channel.send(`You don't have any pets to train, ${user.username}. ❌`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'petbattle') {
        const user = users[message.author.id];
        const targetUser = args[0];
        if (user && users[targetUser]) {
            const userPet = user.pets[Math.floor(Math.random() * user.pets.length)];
            const targetPet = users[targetUser].pets[Math.floor(Math.random() * users[targetUser].pets.length)];
            if (userPet && targetPet) {
                const battleOutcome = Math.random();
                if (battleOutcome < 0.5) {
                    message.channel.send(`${user.username}'s ${userPet} defeated ${targetUser}'s ${targetPet} in a pet battle! 🏆`);
                } else {
                    message.channel.send(`${targetUser}'s ${targetPet} defeated ${user.username}'s ${userPet} in a pet battle! 🏆`);
                }
            } else {
                message.channel.send(`One of the users doesn't have a pet to battle with. ❌`);
            }
        } else {
            message.channel.send(`Invalid pet battle command or target, ${user.username}. 🛑`);
        }
    }

    if (command === 'feed') {
        const user = users[message.author.id];
        if (user) {
            const pet = user.pets[Math.floor(Math.random() * user.pets.length)];
            if (pet) {
                const food = args[0];
                if (['Meat', 'Fish', 'Fruit'].includes(food)) {
                    message.channel.send(`${user.username} fed ${pet} with ${food}. ${pet} is happy! 🐾`);
                } else {
                    message.channel.send(`Invalid food item, ${user.username}. ❌`);
                }
            } else {
                message.channel.send(`You don't have any pets to feed, ${user.username}. ❌`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'adventure') {
        const user = users[message.author.id];
        if (user) {
            const adventureOutcome = Math.random();
            if (adventureOutcome < 0.3) {
                const goldFound = Math.floor(Math.random() * 40) + 20;
                user.gold += goldFound;
                message.channel.send(`${user.username} went on an adventure and found ${goldFound} gold! 🏰`);
            } else if (adventureOutcome < 0.6) {
                const experienceGained = Math.floor(Math.random() * 40) + 20;
                user.experience += experienceGained;
                message.channel.send(`${user.username} went on an adventure and gained ${experienceGained} experience! ⭐`);
            } else if (adventureOutcome < 0.9) {
                const itemFound = ['Magic Potion', 'Golden Armor', 'Mystic Staff'][Math.floor(Math.random() * 3)];
                user.inventory.push(itemFound);
                message.channel.send(`${user.username} went on an adventure and found a ${itemFound}! 🌟`);
            } else {
                const healthLost = Math.floor(Math.random() * 30) + 20;
                user.health -= healthLost;
                if (user.health <= 0) {
                    message.channel.send(`${user.username} got injured on the adventure and lost ${healthLost} health, leading to their demise. 🪦`);
                    delete users[message.author.id];
                } else {
                    message.channel.send(`${user.username} got injured on the adventure and lost ${healthLost} health. ❤️`);
                }
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'party') {
        const user = users[message.author.id];
        if (user) {
            const partyMembers = args;
            if (partyMembers.length > 0) {
                user.party = partyMembers;
                message.channel.send(`${user.username} formed a party with ${partyMembers.join(', ')}! 🎉`);
            } else {
                message.channel.send(`Please specify the members you want to add to your party, ${user.username}. 🛑`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }
});

client.login('held'); //enter api key
