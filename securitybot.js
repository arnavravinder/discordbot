const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, MessageActionRow, MessageButton } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageTyping,
    ]
});

const prefix = '!';
const adminRole = 'Admin';
const forbiddenWords = ['badword1', 'badword2'];
const mutedRoleName = 'Muted';

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('guildMemberAdd', member => {
    const role = member.guild.roles.cache.find(r => r.name === 'Member');
    if (role) {
        member.roles.add(role).catch(console.error);
    }
    const channel = member.guild.systemChannel || member.guild.channels.cache.find(ch => ch.type === 'text');
    if (channel) {
        channel.send(`Welcome ${member}!`);
    }
    logAction(member.guild, 'Member Join', `User ${member.user.tag} has joined the server.`);
});

client.on('guildMemberRemove', member => {
    logAction(member.guild, 'Member Leave', `User ${member.user.tag} has left the server.`);
});

client.on('messageCreate', message => {
    if (message.author.bot) return;

    const contentLower = message.content.toLowerCase();
    for (const word of forbiddenWords) {
        if (contentLower.includes(word)) {
            message.delete().catch(console.error);
            message.channel.send(`${message.author}, your message was removed because it contained inappropriate language.`);
            break;
        }
    }

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'kick') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.reply('⚠️ **You do not have permission to use this command!**');
        }

        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ **You need to mention a user to kick!**');

        const member = message.guild.members.cache.get(user.id);
        if (member) {
            member.kick().then(() => {
                message.reply(`👢 **Successfully kicked ${user.tag}.**`);
                logAction(message.guild, 'Kick', `${user.tag} was kicked by ${message.author.tag}`);
            }).catch(err => {
                message.reply('❌ **Unable to kick the member.**');
                console.error(err);
            });
        } else {
            message.reply('⚠️ **User is not in the guild.**');
        }
    }

    if (command === 'ban') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply('⚠️ **You do not have permission to use this command!**');
        }

        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ **You need to mention a user to ban!**');

        const member = message.guild.members.cache.get(user.id);
        if (member) {
            member.ban().then(() => {
                message.reply(`🚫 **Successfully banned ${user.tag}.**`);
                logAction(message.guild, 'Ban', `${user.tag} was banned by ${message.author.tag}`);
            }).catch(err => {
                message.reply('❌ **Unable to ban the member.**');
                console.error(err);
            });
        } else {
            message.reply('⚠️ **User is not in the guild.**');
        }
    }

    if (command === 'mute') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
            return message.reply('⚠️ **You do not have permission to use this command!**');
        }

        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ **You need to mention a user to mute!**');

        const member = message.guild.members.cache.get(user.id);
        if (member) {
            const muteRole = message.guild.roles.cache.find(r => r.name === mutedRoleName);
            if (!muteRole) return message.reply('⚠️ **Mute role not found!**');

            member.roles.add(muteRole).then(() => {
                message.reply(`🔇 **Successfully muted ${user.tag}.**`);
                logAction(message.guild, 'Mute', `${user.tag} was muted by ${message.author.tag}`);
            }).catch(err => {
                message.reply('❌ **Unable to mute the member.**');
                console.error(err);
            });
        } else {
            message.reply('⚠️ **User is not in the guild.**');
        }
    }

    if (command === 'unmute') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
            return message.reply('⚠️ **You do not have permission to use this command!**');
        }

        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ **You need to mention a user to unmute!**');

        const member = message.guild.members.cache.get(user.id);
        if (member) {
            const muteRole = message.guild.roles.cache.find(r => r.name === mutedRoleName);
            if (!muteRole) return message.reply('⚠️ **Mute role not found!**');

            member.roles.remove(muteRole).then(() => {
                message.reply(`🔊 **Successfully unmuted ${user.tag}.**`);
                logAction(message.guild, 'Unmute', `${user.tag} was unmuted by ${message.author.tag}`);
            }).catch(err => {
                message.reply('❌ **Unable to unmute the member.**');
                console.error(err);
            });
        } else {
            message.reply('⚠️ **User is not in the guild.**');
        }
    }
});

client.on('messageDelete', message => {
    logAction(message.guild, 'Message Delete', `Message by ${message.author.tag} was deleted: "${message.content}"`);
});

client.on('messageUpdate', (oldMessage, newMessage) => {
    if (oldMessage.content !== newMessage.content) {
        logAction(oldMessage.guild, 'Message Edit', `Message edited by ${oldMessage.author.tag}: "${oldMessage.content}" → "${newMessage.content}"`);
    }
});

client.on('guildBanAdd', (guild, user) => {
    logAction(guild, 'Guild Ban Add', `${user.tag} was banned from the guild.`);
});

client.on('guildBanRemove', (guild, user) => {
    logAction(guild, 'Guild Ban Remove', `${user.tag} was unbanned from the guild.`);
});

client.on('guildMemberUpdate', (oldMember, newMember) => {
    const changes = [];
    if (oldMember.nickname !== newMember.nickname) {
        changes.push(`Nickname changed from "${oldMember.nickname}" to "${newMember.nickname}"`);
    }
    if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
        changes.push(`Roles updated`);
    }
    if (changes.length > 0) {
        logAction(newMember.guild, 'Member Update', `User ${newMember.user.tag}: ${changes.join(', ')}`);
    }
});

client.on('messageReactionAdd', (reaction, user) => {
    if (reaction.message.author.bot) return;

    const emoji = reaction.emoji.name;
    logAction(reaction.message.guild, 'Reaction Added', `${user.tag} reacted with ${emoji} to a message.`);
});

client.on('messageReactionRemove', (reaction, user) => {
    if (reaction.message.author.bot) return;

    const emoji = reaction.emoji.name;
    logAction(reaction.message.guild, 'Reaction Removed', `${user.tag} removed their ${emoji} reaction from a message.`);
});

client.on('presenceUpdate', (oldPresence, newPresence) => {
    const user = newPresence.user;
    const oldStatus = oldPresence.status;
    const newStatus = newPresence.status;

    if (oldStatus !== newStatus) {
        logAction(newPresence.guild, 'Presence Update', `User ${user.tag} changed status from ${oldStatus} to ${newStatus}`);
    }
});

client.on('guildScheduledEventCreate', event => {
    logAction(event.guild, 'Scheduled Event Create', `Scheduled event "${event.name}" created.`);
});

client.on('guildScheduledEventUpdate', (oldEvent, newEvent) => {
    logAction(newEvent.guild, 'Scheduled Event Update', `Scheduled event "${oldEvent.name}" updated to "${newEvent.name}".`);
});

client.on('guildScheduledEventDelete', event => {
    logAction(event.guild, 'Scheduled Event Delete', `Scheduled event "${event.name}" deleted.`);
});

client.on('voiceStateUpdate', (oldState, newState) => {
    const user = newState.member.user;
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    if (oldChannel !== newChannel) {
        if (oldChannel) {
            logAction(newState.guild, 'Voice Channel Leave', `${user.tag} left voice channel ${oldChannel.name}`);
        }
        if (newChannel) {
            logAction(newState.guild, 'Voice Channel Join', `${user.tag} joined voice channel ${newChannel.name}`);
        }
    }
});

client.on('error', error => {
    console.error('An error occurred:', error);
});

function logAction(guild, actionType, details) {
    const logChannel = guild.channels.cache.find(channel => channel.name === 'logs');
    if (logChannel) {
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle(`🔒 Security Log: ${actionType}`)
            .setDescription(details)
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(console.error);
    }
}

client.login(process.env.TOKEN);
