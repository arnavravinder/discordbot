const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!kick')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.reply("You don't have permission to kick members!");
        }

        const member = message.mentions.members.first();
        if (member) {
            await member.kick();
            message.channel.send(`${member.user.tag} has been kicked!`);
        } else {
            message.channel.send('You need to mention a member to kick!');
        }
    }

    if (message.content.startsWith('!ban')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply("You don't have permission to ban members!");
        }

        const member = message.mentions.members.first();
        if (member) {
            await member.ban();
            message.channel.send(`${member.user.tag} has been banned!`);
        } else {
            message.channel.send('You need to mention a member to ban!');
        }
    }

    if (message.content.startsWith('!mute')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
            return message.reply("You don't have permission to mute members!");
        }

        const member = message.mentions.members.first();
        const muteRole = message.guild.roles.cache.find(role => role.name === 'Muted');
        if (!muteRole) {
            return message.channel.send('There is no "Muted" role on this server!');
        }

        if (member) {
            await member.roles.add(muteRole);
            message.channel.send(`${member.user.tag} has been muted!`);
        } else {
            message.channel.send('You need to mention a member to mute!');
        }
    }

    if (message.content.startsWith('!unmute')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
            return message.reply("You don't have permission to unmute members!");
        }

        const member = message.mentions.members.first();
        const muteRole = message.guild.roles.cache.find(role => role.name === 'Muted');

        if (member && muteRole) {
            await member.roles.remove(muteRole);
            message.channel.send(`${member.user.tag} has been unmuted!`);
        } else {
            message.channel.send('You need to mention a member to unmute!');
        }
    }

    if (message.content.startsWith('!purge')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply("You don't have permission to manage messages!");
        }

        const args = message.content.split(' ').slice(1);
        const amount = parseInt(args[0]);

        if (isNaN(amount) || amount <= 0 || amount > 100) {
            return message.channel.send('You need to specify a number between 1 and 100!');
        }

        await message.channel.bulkDelete(amount, true);
        message.channel.send(`Deleted ${amount} messages!`).then(msg => {
            setTimeout(() => msg.delete(), 5000);
        });
    }

    if (message.content.startsWith('!help')) {
        const helpMessage = `
        **Moderation Commands:**
        - !kick @user: Kicks the mentioned user.
        - !ban @user: Bans the mentioned user.
        - !mute @user: Mutes the mentioned user.
        - !unmute @user: Unmutes the mentioned user.
        - !purge number: Deletes the specified number of messages.
        `;
        message.channel.send(helpMessage);
    }
});

client.login(process.env.DISCORD_TOKEN);
const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, ChannelType } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
    ]
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!kick')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.reply("🚫 You don't have permission to kick members!");
        }

        const member = message.mentions.members.first();
        if (member) {
            await member.kick();
            message.channel.send(`✅ ${member.user.tag} has been kicked!`);
        } else {
            message.channel.send('⚠️ You need to mention a member to kick!');
        }
    }

    if (message.content.startsWith('!ban')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply("🚫 You don't have permission to ban members!");
        }

        const member = message.mentions.members.first();
        if (member) {
            await member.ban();
            message.channel.send(`✅ ${member.user.tag} has been banned!`);
        } else {
            message.channel.send('⚠️ You need to mention a member to ban!');
        }
    }

    if (message.content.startsWith('!mute')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
            return message.reply("🚫 You don't have permission to mute members!");
        }

        const member = message.mentions.members.first();
        const muteRole = message.guild.roles.cache.find(role => role.name === 'Muted');
        if (!muteRole) {
            return message.channel.send('⚠️ There is no "Muted" role on this server!');
        }

        if (member) {
            await member.roles.add(muteRole);
            message.channel.send(`🔇 ${member.user.tag} has been muted!`);
        } else {
            message.channel.send('⚠️ You need to mention a member to mute!');
        }
    }

    if (message.content.startsWith('!unmute')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
            return message.reply("🚫 You don't have permission to unmute members!");
        }

        const member = message.mentions.members.first();
        const muteRole = message.guild.roles.cache.find(role => role.name === 'Muted');

        if (member && muteRole) {
            await member.roles.remove(muteRole);
            message.channel.send(`🔊 ${member.user.tag} has been unmuted!`);
        } else {
            message.channel.send('⚠️ You need to mention a member to unmute!');
        }
    }

    if (message.content.startsWith('!purge')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply("🚫 You don't have permission to manage messages!");
        }

        const args = message.content.split(' ').slice(1);
        const amount = parseInt(args[0]);

        if (isNaN(amount) || amount <= 0 || amount > 100) {
            return message.channel.send('⚠️ You need to specify a number between 1 and 100!');
        }

        await message.channel.bulkDelete(amount, true);
        message.channel.send(`🗑️ Deleted ${amount} messages!`).then(msg => {
            setTimeout(() => msg.delete(), 5000);
        });
    }

