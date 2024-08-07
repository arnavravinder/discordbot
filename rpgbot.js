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
                party: [],
                attributes: {
                    strength: 10,
                    agility: 10,
                    intelligence: 10
                },
                titles: [],
                achievements: []
            };
            message.channel.send(`Welcome to the RPG, ${message.author.username}! Your adventure begins now. 🏰`);
        } else {
            message.channel.send(`You have already started your adventure, ${message.author.username}! 🛡️`);
        }
    }

    if (command === 'profile') {
        const user = users[message.author.id];
        if (user) {
            message.channel.send(`**${user.username}'s Profile**\nLevel: ${user.level} 🏅\nExperience: ${user.experience} ⭐\nHealth: ${user.health} ❤️\nMana: ${user.mana} 🔮\nGold: ${user.gold} 💰\nInventory: ${user.inventory.join(', ') || 'Empty'}\nQuests Completed: ${user.questsCompleted} 🏆\nAllies: ${user.allies.join(', ') || 'None'}\nSkills: ${user.skills.join(', ') || 'None'}\nGuild: ${user.guild || 'None'}\nPets: ${user.pets.join(', ') || 'None'}\nParty: ${user.party.join(', ') || 'None'}\nStrength: ${user.attributes.strength} 💪\nAgility: ${user.attributes.agility} 🏃‍♂️\nIntelligence: ${user.attributes.intelligence} 🧠\nTitles: ${user.titles.join(', ') || 'None'}\nAchievements: ${user.achievements.join(', ') || 'None'}`);
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

    if (command === 'donate') {
        const user = users[message.author.id];
        const [amount, targetUser] = args;
        if (user && users[targetUser]) {
            const goldAmount = parseInt(amount, 10);
            if (user.gold >= goldAmount) {
                user.gold -= goldAmount;
                users[targetUser].gold += goldAmount;
                message.channel.send(`${user.username} donated ${goldAmount} gold to ${targetUser}. 💸`);
            } else {
                message.channel.send(`You don't have enough gold to donate, ${user.username}. ❌`);
            }
        } else {
            message.channel.send(`Invalid donate command or target, ${user.username}. 🛑`);
        }
    }

    if (command === 'steal') {
        const user = users[message.author.id];
        const targetUser = args[0];
        if (user && users[targetUser]) {
            const stealOutcome = Math.random();
            if (stealOutcome < 0.5) {
                const goldStolen = Math.floor(Math.random() * 20) + 10;
                if (users[targetUser].gold >= goldStolen) {
                    users[targetUser].gold -= goldStolen;
                    user.gold += goldStolen;
                    message.channel.send(`${user.username} successfully stole ${goldStolen} gold from ${targetUser}. 💸`);
                } else {
                    message.channel.send(`${targetUser} doesn't have enough gold to steal, ${user.username}. ❌`);
                }
            } else {
                const healthLost = Math.floor(Math.random() * 10) + 5;
                user.health -= healthLost;
                if (user.health <= 0) {
                    message.channel.send(`${user.username} failed to steal and lost ${healthLost} health, leading to their demise. 🪦`);
                    delete users[message.author.id];
                } else {
                    message.channel.send(`${user.username} failed to steal and lost ${healthLost} health. ❤️`);
                }
            }
        } else {
            message.channel.send(`Invalid steal command or target, ${user.username}. 🛑`);
        }
    }

    if (command === 'duel') {
        const user = users[message.author.id];
        const targetUser = args[0];
        if (user && users[targetUser]) {
            const duelOutcome = Math.random();
            if (duelOutcome < 0.5) {
                const goldWon = Math.floor(Math.random() * 50) + 25;
                if (users[targetUser].gold >= goldWon) {
                    users[targetUser].gold -= goldWon;
                    user.gold += goldWon;
                    message.channel.send(`${user.username} won the duel against ${targetUser} and claimed ${goldWon} gold! ⚔️`);
                } else {
                    message.channel.send(`${targetUser} doesn't have enough gold to duel, ${user.username}. ❌`);
                }
            } else {
                const healthLost = Math.floor(Math.random() * 10) + 5;
                user.health -= healthLost;
                if (user.health <= 0) {
                    message.channel.send(`${user.username} lost the duel and lost ${healthLost} health, leading to their demise. 🪦`);
                    delete users[message.author.id];
                } else {
                    message.channel.send(`${user.username} lost the duel and lost ${healthLost} health. ❤️`);
                }
            }
        } else {
            message.channel.send(`Invalid duel command or target, ${user.username}. 🛑`);
        }
    }

    if (command === 'gamble') {
        const user = users[message.author.id];
        const amount = parseInt(args[0], 10);
        if (user) {
            if (user.gold >= amount) {
                const gambleOutcome = Math.random();
                if (gambleOutcome < 0.5) {
                    user.gold += amount;
                    message.channel.send(`${user.username} won the gamble and doubled their bet, gaining ${amount} gold! 💰`);
                } else {
                    user.gold -= amount;
                    message.channel.send(`${user.username} lost the gamble and lost ${amount} gold. 💸`);
                }
            } else {
                message.channel.send(`You don't have enough gold to gamble, ${user.username}. ❌`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'tournament') {
        const user = users[message.author.id];
        if (user) {
            const tournamentOutcome = Math.random();
            if (tournamentOutcome < 0.3) {
                const goldWon = Math.floor(Math.random() * 100) + 50;
                user.gold += goldWon;
                message.channel.send(`${user.username} won the tournament and gained ${goldWon} gold! 🏆`);
            } else if (tournamentOutcome < 0.6) {
                const experienceGained = Math.floor(Math.random() * 50) + 25;
                user.experience += experienceGained;
                message.channel.send(`${user.username} participated in the tournament and gained ${experienceGained} experience! ⭐`);
            } else if (tournamentOutcome < 0.9) {
                const itemWon = ['Championship Sword', 'Champion Armor', 'Champion Ring'][Math.floor(Math.random() * 3)];
                user.inventory.push(itemWon);
                message.channel.send(`${user.username} participated in the tournament and won a ${itemWon}! 🌟`);
            } else {
                const healthLost = Math.floor(Math.random() * 20) + 10;
                user.health -= healthLost;
                if (user.health <= 0) {
                    message.channel.send(`${user.username} got injured in the tournament and lost ${healthLost} health, leading to their demise. 🪦`);
                    delete users[message.author.id];
                } else {
                    message.channel.send(`${user.username} got injured in the tournament and lost ${healthLost} health. ❤️`);
                }
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'message') {
        const user = users[message.author.id];
        if (user) {
            const [targetUserId, ...messageContent] = args;
            if (users[targetUserId]) {
                message.channel.send(`Message from ${user.username} to ${users[targetUserId].username}: ${messageContent.join(' ')}`);
            } else {
                message.channel.send(`Invalid user to message, ${user.username}. ❌`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'gather') {
        const user = users[message.author.id];
        if (user) {
            const gatheringOutcome = Math.random();
            if (gatheringOutcome < 0.4) {
                const resourceFound = ['Wood', 'Stone', 'Herbs'][Math.floor(Math.random() * 3)];
                user.inventory.push(resourceFound);
                message.channel.send(`${user.username} gathered ${resourceFound} from the environment! 🌿`);
            } else {
                const healthLost = Math.floor(Math.random() * 10) + 5;
                user.health -= healthLost;
                if (user.health <= 0) {
                    message.channel.send(`${user.username} got injured while gathering and lost ${healthLost} health, leading to their demise. 🪦`);
                    delete users[message.author.id];
                } else {
                    message.channel.send(`${user.username} got injured while gathering and lost ${healthLost} health. ❤️`);
                }
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'fortify') {
        const user = users[message.author.id];
        if (user) {
            const fortifyOutcome = Math.random();
            if (fortifyOutcome < 0.5) {
                const defenseBoost = Math.floor(Math.random() * 20) + 10;
                user.health += defenseBoost;
                if (user.health > 100) user.health = 100;
                message.channel.send(`${user.username} fortified their defenses and gained ${defenseBoost} health! 🛡️`);
            } else {
                const healthLost = Math.floor(Math.random() * 10) + 5;
                user.health -= healthLost;
                if (user.health <= 0) {
                    message.channel.send(`${user.username} failed to fortify and lost ${healthLost} health, leading to their demise. 🪦`);
                    delete users[message.author.id];
                } else {
                    message.channel.send(`${user.username} failed to fortify and lost ${healthLost} health. ❤️`);
                }
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'enchant') {
        const user = users[message.author.id];
        if (user) {
            const item = args.join(' ');
            const itemIndex = user.inventory.indexOf(item.charAt(0).toUpperCase() + item.slice(1));
            if (itemIndex !== -1) {
                const enchantment = ['Flame', 'Ice', 'Lightning'][Math.floor(Math.random() * 3)];
                user.inventory[itemIndex] = `${enchantment} ${item}`;
                message.channel.send(`${user.username} enchanted their ${item} with ${enchantment}! 🔮`);
            } else {
                message.channel.send(`You don't have that item to enchant, ${user.username}. ❌`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'disenchant') {
        const user = users[message.author.id];
        if (user) {
            const item = args.join(' ');
            const itemIndex = user.inventory.indexOf(item.charAt(0).toUpperCase() + item.slice(1));
            if (itemIndex !== -1 && user.inventory[itemIndex].includes(' ')) {
                user.inventory[itemIndex] = user.inventory[itemIndex].split(' ').slice(1).join(' ');
                message.channel.send(`${user.username} disenchanted their ${item}. 🔮`);
            } else {
                message.channel.send(`You don't have that enchanted item to disenchant, ${user.username}. ❌`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'rescue') {
        const user = users[message.author.id];
        const targetUser = args[0];
        if (user && users[targetUser]) {
            const rescueOutcome = Math.random();
            if (rescueOutcome < 0.5) {
                const healthGained = Math.floor(Math.random() * 20) + 10;
                users[targetUser].health += healthGained;
                if (users[targetUser].health > 100) users[targetUser].health = 100;
                message.channel.send(`${user.username} rescued ${targetUser} and restored ${healthGained} health! ❤️`);
            } else {
                const healthLost = Math.floor(Math.random() * 10) + 5;
                user.health -= healthLost;
                if (user.health <= 0) {
                    message.channel.send(`${user.username} failed to rescue and lost ${healthLost} health, leading to their demise. 🪦`);
                    delete users[message.author.id];
                } else {
                    message.channel.send(`${user.username} failed to rescue and lost ${healthLost} health. ❤️`);
                }
            }
        } else {
            message.channel.send(`Invalid rescue command or target, ${user.username}. 🛑`);
        }
    }

    if (command === 'research') {
        const user = users[message.author.id];
        if (user) {
            const researchOutcome = Math.random();
            if (researchOutcome < 0.5) {
                const newSkill = ['Alchemy', 'Herbology', 'Runes'][Math.floor(Math.random() * 3)];
                user.skills.push(newSkill);
                message.channel.send(`${user.username} researched and learned ${newSkill}! 📚`);
            } else {
                const healthLost = Math.floor(Math.random() * 10) + 5;
                user.health -= healthLost;
                if (user.health <= 0) {
                    message.channel.send(`${user.username} got injured while researching and lost ${healthLost} health, leading to their demise. 🪦`);
                    delete users[message.author.id];
                } else {
                    message.channel.send(`${user.username} got injured while researching and lost ${healthLost} health. ❤️`);
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

    if (command === 'sacrifice') {
        const user = users[message.author.id];
        if (user) {
            const healthLost = Math.floor(Math.random() * 20) + 10;
            user.health -= healthLost;
            if (user.health <= 0) {
                message.channel.send(`${user.username} sacrificed their health (${healthLost} lost) and died. 🪦`);
                delete users[message.author.id];
            } else {
                const experienceGained = Math.floor(Math.random() * 30) + 20;
                user.experience += experienceGained;
                message.channel.send(`${user.username} sacrificed their health (${healthLost} lost) and gained ${experienceGained} experience! 🩸`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'brew') {
        const user = users[message.author.id];
        if (user) {
            const brewOutcome = Math.random();
            if (brewOutcome < 0.5) {
                const potion = ['Healing Potion', 'Mana Potion', 'Strength Potion'][Math.floor(Math.random() * 3)];
                user.inventory.push(potion);
                message.channel.send(`${user.username} brewed a ${potion}! 🧪`);
            } else {
                const healthLost = Math.floor(Math.random() * 10) + 5;
                user.health -= healthLost;
                if (user.health <= 0) {
                    message.channel.send(`${user.username} failed to brew a potion and lost ${healthLost} health, leading to their demise. 🪦`);
                    delete users[message.author.id];
                } else {
                    message.channel.send(`${user.username} failed to brew a potion and lost ${healthLost} health. ❤️`);
                }
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'enchantarmor') {
        const user = users[message.author.id];
        if (user) {
            const armor = args.join(' ');
            const itemIndex = user.inventory.indexOf(armor.charAt(0).toUpperCase() + armor.slice(1));
            if (itemIndex !== -1) {
                const enchantment = ['Fire Resistance', 'Ice Resistance', 'Lightning Resistance'][Math.floor(Math.random() * 3)];
                user.inventory[itemIndex] = `${enchantment} ${armor}`;
                message.channel.send(`${user.username} enchanted their ${armor} with ${enchantment}! 🛡️`);
            } else {
                message.channel.send(`You don't have that armor to enchant, ${user.username}. ❌`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'disenchantarmor') {
        const user = users[message.author.id];
        if (user) {
            const armor = args.join(' ');
            const itemIndex = user.inventory.indexOf(armor.charAt(0).toUpperCase() + armor.slice(1));
            if (itemIndex !== -1 && user.inventory[itemIndex].includes(' ')) {
                user.inventory[itemIndex] = user.inventory[itemIndex].split(' ').slice(1).join(' ');
                message.channel.send(`${user.username} disenchanted their ${armor}. 🛡️`);
            } else {
                message.channel.send(`You don't have that enchanted armor to disenchant, ${user.username}. ❌`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'upgrade') {
        const user = users[message.author.id];
        if (user) {
            const attribute = args[0];
            const points = parseInt(args[1], 10);
            if (attribute && points) {
                if (attribute === 'strength') {
                    user.attributes.strength += points;
                } else if (attribute === 'agility') {
                    user.attributes.agility += points;
                } else if (attribute === 'intelligence') {
                    user.attributes.intelligence += points;
                } else {
                    message.channel.send(`Invalid attribute, ${user.username}. ❌`);
                    return;
                }
                message.channel.send(`${user.username} upgraded their ${attribute} by ${points} points! 💪`);
            } else {
                message.channel.send(`Please specify the attribute and points to upgrade, ${user.username}. 🛑`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'title') {
        const user = users[message.author.id];
        if (user) {
            const title = args.join(' ');
            if (title) {
                user.titles.push(title);
                message.channel.send(`${user.username} has earned the title: ${title}! 🏅`);
            } else {
                message.channel.send(`Please specify the title you want to add, ${user.username}. 🛑`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'achieve') {
        const user = users[message.author.id];
        if (user) {
            const achievement = args.join(' ');
            if (achievement) {
                user.achievements.push(achievement);
                message.channel.send(`${user.username} has earned the achievement: ${achievement}! 🎖️`);
            } else {
                message.channel.send(`Please specify the achievement you want to add, ${user.username}. 🛑`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'forge') {
        const user = users[message.author.id];
        if (user) {
            const [item1, item2] = args;
            const item1Index = user.inventory.indexOf(item1.charAt(0).toUpperCase() + item1.slice(1));
            const item2Index = user.inventory.indexOf(item2.charAt(0).toUpperCase() + item2.slice(1));
            if (item1Index !== -1 && item2Index !== -1) {
                const forgedItem = ['Dragon Blade', 'Phoenix Armor', 'Unicorn Shield'][Math.floor(Math.random() * 3)];
                user.inventory.splice(item1Index, 1);
                user.inventory.splice(item2Index, 1);
                user.inventory.push(forgedItem);
                message.channel.send(`${user.username} forged a ${forgedItem} using ${item1} and ${item2}! 🔨`);
            } else {
                message.channel.send(`You don't have the required items to forge, ${user.username}. ❌`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'upgrade') {
        const user = users[message.author.id];
        if (user) {
            const attribute = args[0];
            const points = parseInt(args[1], 10);
            if (attribute && points) {
                if (attribute === 'strength') {
                    user.attributes.strength += points;
                } else if (attribute === 'agility') {
                    user.attributes.agility += points;
                } else if (attribute === 'intelligence') {
                    user.attributes.intelligence += points;
                } else {
                    message.channel.send(`Invalid attribute, ${user.username}. ❌`);
                    return;
                }
                message.channel.send(`${user.username} upgraded their ${attribute} by ${points} points! 💪`);
            } else {
                message.channel.send(`Please specify the attribute and points to upgrade, ${user.username}. 🛑`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'exchange') {
        const user = users[message.author.id];
        if (user) {
            const [item, gold] = args;
            const itemIndex = user.inventory.indexOf(item.charAt(0).toUpperCase() + item.slice(1));
            const goldAmount = parseInt(gold, 10);
            if (itemIndex !== -1 && goldAmount) {
                user.inventory.splice(itemIndex, 1);
                user.gold += goldAmount;
                message.channel.send(`${user.username} exchanged ${item} for ${goldAmount} gold! 💰`);
            } else {
                message.channel.send(`Invalid item or gold amount, ${user.username}. ❌`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }

    if (command === 'alchemize') {
        const user = users[message.author.id];
        if (user) {
            const [item1, item2] = args;
            const item1Index = user.inventory.indexOf(item1.charAt(0).toUpperCase() + item1.slice(1));
            const item2Index = user.inventory.indexOf(item2.charAt(0).toUpperCase() + item2.slice(1));
            if (item1Index !== -1 && item2Index !== -1) {
                const alchemizedItem = ['Elixir of Life', 'Potion of Strength', 'Essence of Magic'][Math.floor(Math.random() * 3)];
                user.inventory.splice(item1Index, 1);
                user.inventory.splice(item2Index, 1);
                user.inventory.push(alchemizedItem);
                message.channel.send(`${user.username} alchemized a ${alchemizedItem} using ${item1} and ${item2}! 🧪`);
            } else {
                message.channel.send(`You don't have the required items to alchemize, ${user.username}. ❌`);
            }
        } else {
            message.channel.send(`You need to start your adventure first, ${message.author.username}! Type !start to begin. 🗡️`);
        }
    }
});

client.login('held'); //enter api key
