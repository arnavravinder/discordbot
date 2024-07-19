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

    if (message.content.startsWith('!help')) {
        const helpMessage = `
        **Moderation Commands:**
        - !kick @user: Kicks the mentioned user. 🚫
        - !ban @user: Bans the mentioned user. 🚫
        - !mute @user: Mutes the mentioned user. 🔇
        - !unmute @user: Unmutes the mentioned user. 🔊
        - !purge number: Deletes the specified number of messages. 🗑️
        
        **Info Commands:**
        - !userinfo @user: Shows information about the mentioned user. 🧑
        - !serverinfo: Shows information about the server. 🏠
        - !roles: Lists all roles in the server. 🎭
        `;
        message.channel.send(helpMessage);
    }

    if (message.content.startsWith('!userinfo')) {
        const user = message.mentions.users.first() || message.author;
        const member = message.guild.members.cache.get(user.id);

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${user.username}'s Info`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: 'Username', value: user.username, inline: true },
                { name: 'ID', value: user.id, inline: true },
                { name: 'Joined Server', value: member.joinedAt.toDateString(), inline: true },
                { name: 'Account Created', value: user.createdAt.toDateString(), inline: true }
            )
            .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() });

        message.channel.send({ embeds: [embed] });
    }

    if (message.content.startsWith('!serverinfo')) {
        const guild = message.guild;

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${guild.name} Info`)
            .setThumbnail(guild.iconURL())
            .addFields(
                { name: 'Server Name', value: guild.name, inline: true },
                { name: 'Server ID', value: guild.id, inline: true },
                { name: 'Members', value: `${guild.memberCount}`, inline: true },
                { name: 'Created At', value: guild.createdAt.toDateString(), inline: true }
            )
            .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() });

        message.channel.send({ embeds: [embed] });
    }

    if (message.content.startsWith('!roles')) {
        const roles = message.guild.roles.cache.map(role => role.toString()).join(', ');

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Server Roles')
            .setDescription(roles || 'No roles available');

        message.channel.send({ embeds: [embed] });
    }

    if (message.content.startsWith('!play')) {
        if (!message.member.voice.channel) {
            return message.channel.send('🚫 You need to join a voice channel first!');
        }

        const connection = await message.member.voice.channel.join();
        const dispatcher = connection.play('path/to/your/audio/file.mp3');

        dispatcher.on('start', () => {
            message.channel.send('🎶 Now playing!');
        });

        dispatcher.on('finish', () => {
            message.member.voice.channel.leave();
            message.channel.send('⏹️ Finished playing!');
        });

        dispatcher.on('error', error => {
            console.error(error);
            message.channel.send('❌ Error occurred while playing the audio.');
        });
    }

    if (message.content.startsWith('!stop')) {
        if (message.member.voice.channel) {
            message.member.voice.channel.leave();
            message.channel.send('⏹️ Stopped and left the voice channel!');
        } else {
            message.channel.send('🚫 You need to join a voice channel first!');
        }
    }

    if (message.content.startsWith('!avatar')) {
        const user = message.mentions.users.first() || message.author;
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${user.username}'s Avatar`)
            .setImage(user.displayAvatarURL({ size: 2048 }));

        message.channel.send({ embeds: [embed] });
    }

    if (message.content.startsWith('!weather')) {
        const args = message.content.split(' ').slice(1);
        const location = args.join(' ');

        if (!location) {
            return message.channel.send('⚠️ Please provide a location!');
        }

// todo link api
        const weatherResponse = `The weather in ${location} is sunny with a temperature of 25°C.`;

        message.channel.send(weatherResponse);
    }
});

client.login(process.env.DISCORD_TOKEN);
