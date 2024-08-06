require('dotenv').config();
const { Client, GatewayIntentBits, Partials, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, PermissionsBitField } = require('discord.js');
const mongoose = require('mongoose');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;
const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => console.log('✅ Connected to MongoDB')).catch(console.error);

const inviteSchema = new mongoose.Schema({
    userId: String,
    invites: { type: Number, default: 0 },
    claimedRewards: { type: [String], default: [] },
});

const Invite = mongoose.model('Invite', inviteSchema);

const commands = [
    {
        name: 'setup-tickets',
        description: 'Setup the ticket system'
    }
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
    console.log('🌊 Wave Bot is online!');
    await createCommands();
    updateInviteCache();
});

let inviteCache = {};

async function updateInviteCache() {
    const guild = client.guilds.cache.get(guildId);
    const invites = await guild.invites.fetch();
    inviteCache = invites.reduce((acc, invite) => {
        acc[invite.code] = invite.uses;
        return acc;
    }, {});
}

client.on(Events.GuildMemberAdd, async member => {
    const cachedInvites = inviteCache;
    const currentInvites = await member.guild.invites.fetch();

    currentInvites.forEach(invite => {
        const cachedInvite = cachedInvites[invite.code];
        if (cachedInvite && cachedInvite < invite.uses) {
            addInvite(invite.inviter.id);
            inviteCache[invite.code] = invite.uses;
        }
    });
});

