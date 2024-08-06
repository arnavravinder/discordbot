require('dotenv').config();
const { Client, GatewayIntentBits, Partials, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, PermissionsBitField } = require('discord.js');
const mongoose = require('mongoose');
const axios = require('axios');
const ytdl = require('ytdl-core');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;
const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => console.log('✅ Connected to MongoDB')).catch(console.error);

const userSchema = new mongoose.Schema({
    userId: String,
    balance: { type: Number, default: 0 },
    dailyStreak: { type: Number, default: 0 },
    lastDaily: { type: Date, default: null },
});

const User = mongoose.model('User', userSchema);

client.commands = new Collection();

const commands = [
    {
        name: 'ping',
        description: 'Replies with Pong!',
    },
    {
        name: 'server',
        description: 'Provides server info',
    },
    {
        name: 'user',
        description: 'Provides user info',
    },
    {
        name: 'balance',
        description: 'Check your balance',
    },
    {
        name: 'daily',
        description: 'Claim your daily reward',
    },
    {
        name: 'deposit',
        description: 'Deposit money into your bank',
        options: [
            {
                name: 'amount',
                type: 'INTEGER',
                description: 'Amount to deposit',
                required: true,
            }
        ],
    },
    {
        name: 'withdraw',
        description: 'Withdraw money from your bank',
        options: [
            {
                name: 'amount',
                type: 'INTEGER',
                description: 'Amount to withdraw',
                required: true,
            }
        ],
    },
    {
        name: 'joke',
        description: 'Get a random joke',
    },
    {
        name: 'meme',
        description: 'Get a random meme',
    },
    {
        name: 'trivia',
        description: 'Get a trivia question',
    },
    {
        name: 'ban',
        description: 'Ban a user',
        options: [
            {
                name: 'user',
                type: 'USER',
                description: 'The user to ban',
                required: true,
            }
        ],
    },
    {
        name: 'kick',
        description: 'Kick a user',
        options: [
            {
                name: 'user',
                type: 'USER',
                description: 'The user to kick',
                required: true,
            }
        ],
    },
    {
        name: 'mute',
        description: 'Mute a user',
        options: [
            {
                name: 'user',
                type: 'USER',
                description: 'The user to mute',
                required: true,
            }
        ],
    },
    {
        name: 'unmute',
        description: 'Unmute a user',
        options: [
            {
                name: 'user',
                type: 'USER',
                description: 'The user to unmute',
                required: true,
            }
        ],
    },
    {
        name: 'play',
        description: 'Play a song from YouTube',
        options: [
            {
                name: 'url',
                type: 'STRING',
                description: 'The YouTube URL',
                required: true,
            }
        ],
    },
    {
        name: 'stop',
        description: 'Stop playing music',
    },
    {
        name: 'setup-reaction-roles',
        description: 'Setup reaction roles',
    },
    {
        name: 'remind',
        description: 'Set a reminder',
        options: [
            {
                name: 'time',
                type: 'STRING',
                description: 'The time for the reminder (e.g., 10m, 1h)',
                required: true,
            },
            {
                name: 'message',
                type: 'STRING',
                description: 'The reminder message',
                required: true,
            }
        ],
    },
];

const rest = new REST({ version: '10' }).setToken(token);

async function createCommands() {
    try {
        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );
        console.log('✅ Successfully registered application commands.');
    } catch (error) {
        console.error(error);
    }
}

client.once('ready', async () => {
    console.log('🤖 Bot is online!');
    await createCommands();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'ping') {
        await interaction.reply('Pong!');
    } else if (commandName === 'server') {
        const serverEmbed = new EmbedBuilder()
            .setTitle('Server Info')
            .addFields(
                { name: 'Name', value: interaction.guild.name },
                { name: 'Total Members', value: interaction.guild.memberCount.toString() },
            )
            .setColor(0x00ff00);
        await interaction.reply({ embeds: [serverEmbed] });
    } else if (commandName === 'user') {
        const userEmbed = new EmbedBuilder()
            .setTitle('User Info')
            .addFields(
                { name: 'Username', value: interaction.user.tag },
                { name: 'ID', value: interaction.user.id },
            )
            .setColor(0x00ff00);
        await interaction.reply({ embeds: [userEmbed] });
    } else if (commandName === 'balance') {
        const user = await User.findOne({ userId: interaction.user.id });
        if (user) {
            await interaction.reply(`Your balance is ${user.balance} coins.`);
        } else {
            await interaction.reply('You do not have an account yet. Use `/daily` to create one.');
        }
    } else if (commandName === 'daily') {
        const now = new Date();
        const user = await User.findOne({ userId: interaction.user.id });

        if (user) {
            const lastDaily = new Date(user.lastDaily);
            const diffTime = Math.abs(now - lastDaily);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 1) {
                user.balance += 100;
                user.dailyStreak += 1;
                user.lastDaily = now;
                await user.save();
                await interaction.reply(`You have claimed your daily reward of 100 coins. Your current balance is ${user.balance} coins.`);
            } else {
                await interaction.reply('You have already claimed your daily reward. Please try again later.');
            }
        } else {
            const newUser = new User({
                userId: interaction.user.id,
                balance: 100,
                dailyStreak: 1,
                lastDaily: now
            });
            await newUser.save();
            await interaction.reply('You have claimed your daily reward of 100 coins. Your current balance is 100 coins.');
        }
    } else if (commandName === 'deposit') {
        const amount = interaction.options.getInteger('amount');
        const user = await User.findOne({ userId: interaction.user.id });

        if (user && amount > 0 && user.balance >= amount) {
            user.balance -= amount;
            await user.save();
            await interaction.reply(`You have deposited ${amount} coins. Your current balance is ${user.balance} coins.`);
        } else {
            await interaction.reply('Invalid amount or insufficient balance.');
        }
    } else if (commandName === 'withdraw') {
        const amount = interaction.options.getInteger('amount');
        const user = await User.findOne({ userId: interaction.user.id });

        if (user && amount > 0) {
            user.balance += amount;
            await user.save();
            await interaction.reply(`You have withdrawn ${amount} coins. Your current balance is ${user.balance} coins.`);
        } else {
            await interaction.reply('Invalid amount.');
        }
    } else if (commandName === 'joke') {
        const response = await axios.get('https://official-joke-api.appspot.com/random_joke');
        await interaction.reply(`${response.data.setup} - ${response.data.punchline}`);
    } else if (commandName === 'meme') {
        const response = await axios.get('https://meme-api.herokuapp.com/gimme');
        const memeEmbed = new EmbedBuilder()
            .setTitle(response.data.title)
            .setImage(response.data.url)
            .setColor(0x00ff00);
        await interaction.reply({ embeds: [memeEmbed] });
    } else if (commandName === 'trivia') {
        const response = await axios.get('https://opentdb.com/api.php?amount=1');
        const trivia = response.data.results[0];
        con