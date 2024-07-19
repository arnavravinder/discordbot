const { Client, GatewayIntentBits, PermissionsBitField, Collection, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites
    ]
});

const inviteCache = new Map();

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.guilds.cache.forEach(async guild => {
        const invites = await guild.invites.fetch();
        invites.forEach(invite => {
            inviteCache.set(invite.code, invite.uses);
        });
    });
});

client.on('inviteCreate', invite => {
    inviteCache.set(invite.code, invite.uses);
});

client.on('inviteDelete', invite => {
    inviteCache.delete(invite.code);
});

client.on('guildMemberAdd', async member => {
    const oldInvites = new Map(inviteCache);
    const newInvites = await member.guild.invites.fetch();

    let usedInvite = null;
    newInvites.forEach(invite => {
        if (oldInvites.has(invite.code)) {
            if (invite.uses > oldInvites.get(invite.code)) {
                usedInvite = invite;
            }
        } else {
            inviteCache.set(invite.code, invite.uses);
        }
    });

    if (usedInvite) {
        const logChannelId = client.guildData ? client.guildData[member.guild.id].inviteLogChannel : null;
        if (logChannelId) {
            const channel = member.guild.channels.cache.get(logChannelId);
            if (channel) {
                channel.send(`🎉 Welcome ${member.user.tag}! They joined using the invite link: https://discord.gg/${usedInvite.code}`);
            }
        }
    }

    inviteCache.clear();
    newInvites.forEach(invite => {
        inviteCache.set(invite.code, invite.uses);
    });
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!invites')) {
        const user = message.mentions.users.first() || message.author;
        const member = message.guild.members.cache.get(user.id);
        const invites = await member.guild.invites.fetch();
        const userInvites = invites.filter(invite => invite.inviter && invite.inviter.id === user.id);

        let inviteList = '';
        userInvites.forEach(invite => {
            inviteList += `🔗 https://discord.gg/${invite.code} - Uses: ${invite.uses}\n`;
        });

        message.channel.send({ content: `Invites created by ${user.tag}:\n${inviteList || 'No invites found.'}` });
    }

    if (message.content.startsWith('!invitecount')) {
        const invites = await message.guild.invites.fetch();
        const inviteCounts = invites.reduce((acc, invite) => {
            if (!acc[invite.inviter.id]) {
                acc[invite.inviter.id] = 0;
            }
            acc[invite.inviter.id] += invite.uses;
            return acc;
        }, {});

        const inviteCountMessages = Object.keys(inviteCounts).map(id => {
            const user = client.users.cache.get(id);
            return `${user.tag}: ${inviteCounts[id]} invites 🎯`;
        }).join('\n');

        message.channel.send({ content: `Invite counts:\n${inviteCountMessages || 'No invite data available.'}` });
    }

    if (message.content.startsWith('!topinvites')) {
        const invites = await message.guild.invites.fetch();
        const inviteCounts = invites.reduce((acc, invite) => {
            if (!acc[invite.inviter.id]) {
                acc[invite.inviter.id] = 0;
            }
            acc[invite.inviter.id] += invite.uses;
            return acc;
        }, {});

        const topInvites = Object.entries(inviteCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([id, count]) => {
                const user = client.users.cache.get(id);
                return `${user.tag}: ${count} invites 🎯`;
            })
            .join('\n');

        message.channel.send({ content: `Top invite creators:\n${topInvites || 'No invite data available.'}` });
    }

    if (message.content.startsWith('!inviteinfo')) {
        const code = message.content.split(' ')[1];
        if (!code) {
            return message.channel.send('⚠️ You need to specify an invite code!');
        }

        const invites = await message.guild.invites.fetch();
        const invite = invites.find(invite => invite.code === code);

        if (invite) {
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`Invite Info: ${invite.code}`)
                .addFields(
                    { name: 'Inviter', value: invite.inviter ? invite.inviter.tag : 'Unknown', inline: true },
                    { name: 'Uses', value: `${invite.uses}`, inline: true },
                    { name: 'Expires At', value: invite.expiresAt ? invite.expiresAt.toDateString() : 'Never', inline: true },
                    { name: 'Channel', value: `<#${invite.channel.id}>`, inline: true }
                )
                .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() });

            message.channel.send({ embeds: [embed] });
        } else {
            message.channel.send('⚠️ Invalid invite code!');
        }
    }

    if (message.content.startsWith('!invitemessage')) {
        const channel = message.mentions.channels.first() || message.channel;
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Invite Information')
            .setDescription('This channel will display invite information and tracking updates.')
            .setFooter({ text: `Configured by ${message.author.username}`, iconURL: message.author.displayAvatarURL() });

        channel.send({ embeds: [embed] });
        message.channel.send(`📣 Invite message set for ${channel.name}!`);
    }

    if (message.content.startsWith('!setinvitelog')) {
        const channel = message.mentions.channels.first();
        if (!channel) {
            return message.channel.send('⚠️ You need to mention a channel to set as invite logs!');
        }

        client.guildData = client.guildData || {};
        client.guildData[message.guild.id] = client.guildData[message.guild.id] || {};
        client.guildData[message.guild.id].inviteLogChannel = channel.id;

        message.channel.send(`📣 Invite log channel set to ${channel.name}!`);
    }

    if (message.content.startsWith('!getinvitelog')) {
        const guildData = client.guildData ? client.guildData[message.guild.id] : {};
        const channelId = guildData.inviteLogChannel;
        const channel = channelId ? message.guild.channels.cache.get(channelId) : null;

        if (channel) {
            message.channel.send(`📣 Current invite log channel: ${channel}`);
        } else {
            message.channel.send('⚠️ No invite log channel set.');
        }
    }

    if (message.content.startsWith('!remindme')) {
        const args = message.content.split(' ').slice(1);
        const time = args.shift();
        const reminder = args.join(' ');

        if (!time || !reminder) {
            return message.channel.send('⚠️ You need to specify a time and a reminder message!');
        }

        const ms = require('ms');
        const reminderTime = ms(time);

        if (reminderTime) {
            setTimeout(() => {
                message.author.send(`🔔 Reminder: ${reminder}`);
            }, reminderTime);
            message.channel.send(`⏰ Reminder set for ${time}.`);
        } else {
            message.channel.send('⚠️ Invalid time format!');
        }
    }

    if (message.content.startsWith('!reactionrole')) {
        const args = message.content.split(' ').slice(1);
        const roleName = args.shift();
        const emoji = args.shift();
        const messageId = args.shift();

        const role = message.guild.roles.cache.find(role => role.name === roleName);
        const msg = await message.channel.messages.fetch(messageId);

        if (role && emoji && msg) {
            await msg.react(emoji);

            client.on('messageReactionAdd', (reaction, user) => {
                if (reaction.message.id === msg.id && !user.bot) {
                    const member = reaction.message.guild.members.cache.get(user.id);
                    if (member) {
                        member.roles.add(role);
                    }
                }
            });

            client.on('messageReactionRemove', (reaction, user) => {
                if (reaction.message.id === msg.id && !user.bot) {
                    const member = reaction.message.guild.members.cache.get(user.id);
                    if (member) {
                        member.roles.remove(role);
                    }
                }
            });

            message.channel.send(`✅ Reaction role setup complete! React to the message with ${emoji} to get the role ${roleName}.`);
        } else {
            message.channel.send('⚠️ Invalid role, emoji, or message ID!');
        }
    }

    if (message.content.startsWith('!mute')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.channel.send('⚠️ You do not have permission to use this command!');
        }

        const user = message.mentions.users.first();
        const reason = message.content.split(' ').slice(2).join(' ') || 'No reason provided';

        if (user) {
            const member = message.guild.members.cache.get(user.id);
            if (member) {
                const muteRole = message.guild.roles.cache.find(role => role.name === 'Muted');
                if (!muteRole) {
                    message.channel.send('⚠️ No "Muted" role found. Please create one.');
                    return;
                }

                member.roles.add(muteRole)
                    .then(() => {
                        message.channel.send(`🔇 ${user.tag} has been muted. Reason: ${reason}`);
                    })
                    .catch(err => {
                        console.error(err);
                        message.channel.send('❌ There was an error muting the user.');
                    });
            } else {
                message.channel.send('⚠️ User not found in the server.');
            }
        } else {
            message.channel.send('⚠️ You need to mention a user to mute.');
        }
    }

    if (message.content.startsWith('!unmute')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.channel.send('⚠️ You do not have permission to use this command!');
        }

        const user = message.mentions.users.first();

        if (user) {
            const member = message.guild.members.cache.get(user.id);
            if (member) {
                const muteRole = message.guild.roles.cache.find(role => role.name === 'Muted');
                if (!muteRole) {
                    message.channel.send('⚠️ No "Muted" role found.');
                    return;
                }

                member.roles.remove(muteRole)
                    .then(() => {
                        message.channel.send(`🔊 ${user.tag} has been unmuted.`);
                    })
                    .catch(err => {
                        console.error(err);
                        message.channel.send('❌ There was an error unmuting the user.');
                    });
            } else {
                message.channel.send('⚠️ User not found in the server.');
            }
        } else {
            message.channel.send('⚠️ You need to mention a user to unmute.');
        }
    }

    if (message.content.startsWith('!clear')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.channel.send('⚠️ You do not have permission to use this command!');
        }

        const amount = parseInt(message.content.split(' ')[1]);

        if (isNaN(amount) || amount <= 0 || amount > 100) {
            message.channel.send('⚠️ Please specify a number between 1 and 100.');
            return;
        }

        message.channel.bulkDelete(amount + 1)
            .then(() => {
                message.channel.send(`🗑️ Cleared ${amount} messages.`).then(msg => msg.delete({ timeout: 5000 }));
            })
            .catch(err => {
                console.error(err);
                message.channel.send('❌ There was an error clearing the messages.');
            });
    }

    if (message.content.startsWith('!userinfo')) {
        const user = message.mentions.users.first() || message.author;
        const member = message.guild.members.cache.get(user.id);

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`User Info: ${user.tag}`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: 'ID', value: user.id, inline: true },
                { name: 'Joined At', value: member ? member.joinedAt.toDateString() : 'N/A', inline: true },
                { name: 'Account Created', value: user.createdAt.toDateString(), inline: true },
                { name: 'Roles', value: member ? member.roles.cache.filter(role => role.name !== '@everyone').map(role => role.name).join(', ') : 'N/A' }
            )
            .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() });

        message.channel.send({ embeds: [embed] });
    }

    if (message.content.startsWith('!serverinfo')) {
        const guild = message.guild;

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Server Info: ${guild.name}`)
            .setThumbnail(guild.iconURL())
            .addFields(
                { name: 'Server ID', value: guild.id, inline: true },
                { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
                { name: 'Created On', value: guild.createdAt.toDateString(), inline: true },
                { name: 'Members', value: `${guild.memberCount}`, inline: true },
                { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
                { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true }
            )
            .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() });

        message.channel.send({ embeds: [embed] });
    }

    if (message.content.startsWith('!ping')) {
        message.channel.send('🏓 Pong!');
    }

    if (message.content.startsWith('!hello')) {
        message.channel.send('👋 Hello there!');
    }

    if (message.content.startsWith('!avatar')) {
        const user = message.mentions.users.first() || message.author;
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${user.tag}'s Avatar`)
            .setImage(user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() });

        message.channel.send({ embeds: [embed] });
    }

    if (message.content.startsWith('!announce')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.channel.send('⚠️ You do not have permission to use this command!');
        }

        const args = message.content.split(' ').slice(1);
        const announcement = args.join(' ');

        if (!announcement) {
            return message.channel.send('⚠️ You need to provide an announcement message!');
        }

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('📢 Announcement')
            .setDescription(announcement)
            .setFooter({ text: `Announced by ${message.author.username}`, iconURL: message.author.displayAvatarURL() });

        message.guild.channels.cache.filter(ch => ch.permissionsFor(message.guild.me).has(PermissionsBitField.Flags.SendMessages)).forEach(ch => {
            ch.send({ embeds: [embed] });
        });

        message.channel.send('📢 Announcement sent to all channels.');
    }

    if (message.content.startsWith('!kick')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.channel.send('⚠️ You do not have permission to use this command!');
        }

        const user = message.mentions.users.first();
        const reason = message.content.split(' ').slice(2).join(' ') || 'No reason provided';

        if (user) {
            const member = message.guild.members.cache.get(user.id);
            if (member) {
                member.kick(reason)
                    .then(() => {
                        message.channel.send(`🚪 ${user.tag} has been kicked. Reason: ${reason}`);
                    })
                    .catch(err => {
                        console.error(err);
                        message.channel.send('❌ There was an error kicking the user.');
                    });
            } else {
                message.channel.send('⚠️ User not found in the server.');
            }
        } else {
            message.channel.send('⚠️ You need to mention a user to kick.');
        }
    }

    if (message.content.startsWith('!ban')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.channel.send('⚠️ You do not have permission to use this command!');
        }

        const user = message.mentions.users.first();
        const reason = message.content.split(' ').slice(2).join(' ') || 'No reason provided';

        if (user) {
            const member = message.guild.members.cache.get(user.id);
            if (member) {
                member.ban({ reason })
                    .then(() => {
                        message.channel.send(`🚫 ${user.tag} has been banned. Reason: ${reason}`);
                    })
                    .catch(err => {
                        console.error(err);
                        message.channel.send('❌ There was an error banning the user.');
                    });
            } else {
                message.channel.send('⚠️ User not found in the server.');
            }
        } else {
            message.channel.send('⚠️ You need to mention a user to ban.');
        }
    }

    if (message.content.startsWith('!poll')) {
        const args = message.content.split(' ').slice(1);
        const question = args.join(' ');

        if (!question) {
            return message.channel.send('⚠️ You need to provide a question for the poll!');
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🗳️ Poll')
            .setDescription(question)
            .setFooter({ text: `Poll created by ${message.author.username}`, iconURL: message.author.displayAvatarURL() });

        message.channel.send({ embeds: [embed] }).then(sentMessage => {
            sentMessage.react('👍');
            sentMessage.react('👎');
        });
    }
});

client.login(process.env.TOKEN);
