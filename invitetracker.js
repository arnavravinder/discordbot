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
        const channel = member.guild.channels.cache.find(ch => ch.name === 'invite-logs');
        if (channel) {
            channel.send(`🎉 Welcome ${member.user.tag}! They joined using the invite link: https://discord.gg/${usedInvite.code}`);
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
});

client.login(process.env.BOT_TOKEN);
