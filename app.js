const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, ChannelType, Collection } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
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

        **Fun Commands:**
        - !coinflip: Flips a coin. 🪙
        - !rps: Play Rock, Paper, Scissors. ✊✋🖐️
        - !weather [location]: Provides a weather report for the specified location. 🌤️

        **Misc Commands:**
        - !avatar @user: Displays the avatar of the mentioned user. 🖼️
        - !play [file]: Plays an audio file in the voice channel. 🎵
        - !stop: Stops the audio and leaves the voice channel. ⏹️
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

//todo update
        const weatherResponse = `The weather in ${location} is sunny with a temperature of 25°C.`;

        message.channel.send(weatherResponse);
    }

    if (message.content.startsWith('!coinflip')) {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        message.channel.send(`🪙 Coin flipped! It landed on ${result}.`);
    }

    if (message.content.startsWith('!rps')) {
        const userChoice = message.content.split(' ')[1]?.toLowerCase();
        const choices = ['rock', 'paper', 'scissors'];
        const botChoice = choices[Math.floor(Math.random() * choices.length)];

        if (!choices.includes(userChoice)) {
            return message.channel.send('⚠️ Please choose Rock, Paper, or Scissors.');
        }

        let result;
        if (userChoice === botChoice) {
            result = 'It\'s a tie!';
        } else if (
            (userChoice === 'rock' && botChoice === 'scissors') ||
            (userChoice === 'paper' && botChoice === 'rock') ||
            (userChoice === 'scissors' && botChoice === 'paper')
        ) {
            result = 'You win!';
        } else {
            result = 'You lose!';
        }

        message.channel.send(`🤖 Bot chose ${botChoice}. ${result}`);
    }

    if (message.content.startsWith('!remind')) {
        const args = message.content.split(' ').slice(1);
        const time = args.shift();
        const reminder = args.join(' ');

        const ms = parseInt(time);
        if (isNaN(ms)) {
            return message.channel.send('⚠️ Please provide a valid time in milliseconds.');
        }

        setTimeout(() => {
            message.author.send(`🔔 Reminder: ${reminder}`);
        }, ms);

        message.channel.send(`⏲️ I will remind you in ${ms / 1000} seconds.`);
    }

    if (message.content.startsWith('!reactionrole')) {
        const args = message.content.split(' ').slice(1);
        const roleName = args.shift();
        const emoji = args.shift();

        const role = message.guild.roles.cache.find(r => r.name === roleName);
        if (!role) {
            return message.channel.send('⚠️ Role not found!');
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('React to get a role!')
            .setDescription(`React with ${emoji} to get the ${roleName} role.`);

        const msg = await message.channel.send({ embeds: [embed] });
        msg.react(emoji);

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
    }

    if (message.content.startsWith('!quote')) {
        const quotes = [
            "The best way to predict the future is to invent it. – Alan Kay",
            "Life is what happens when you’re busy making other plans. – John Lennon",
            "Get your facts first, then you can distort them as you please. – Mark Twain"
        ];

        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        message.channel.send(`💬 Quote: ${randomQuote}`);
    }

    if (message.content.startsWith('!poll')) {
        const args = message.content.split(' ').slice(1);
        const question = args.join(' ');

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Poll')
            .setDescription(question)
            .setFooter({ text: 'React with 👍 or 👎' });

        const msg = await message.channel.send({ embeds: [embed] });
        await msg.react('👍');
        await msg.react('👎');
    }

    if (message.content.startsWith('!invite')) {
        const inviteLink = 'https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot';
        message.channel.send(`🔗 [Click here to invite me to your server!](${inviteLink})`);
    }

    if (message.content.startsWith('!server')) {
        const serverInfo = `
        **Server Information:**
        - Server Name: ${message.guild.name}
        - Total Members: ${message.guild.memberCount}
        - Creation Date: ${message.guild.createdAt.toDateString()}
        - Region: ${message.guild.region}
        `;

        message.channel.send(serverInfo);
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
                { name: 'Account Created', value: user.createdAt.toDateString(), inline: true },
                { name: 'Status', value: user.presence ? user.presence.status : 'Offline', inline: true }
            )
            .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() });

        message.channel.send({ embeds: [embed] });
    }

    if (message.content.startsWith('!emojis')) {
        const emojis = message.guild.emojis.cache.map(e => e.toString()).join(' ');
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Server Emojis')
            .setDescription(emojis || 'No emojis available');

        message.channel.send({ embeds: [embed] });
    }

    if (message.content.startsWith('!roleinfo')) {
        const role = message.mentions.roles.first();
        if (!role) {
            return message.channel.send('⚠️ Please mention a role.');
        }

