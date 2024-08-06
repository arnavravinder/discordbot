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
