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

async function addInvite(userId) {
    let invite = await Invite.findOne({ userId });
    if (!invite) {
        invite = new Invite({ userId });
    }
    invite.invites += 1;
    await invite.save();
    checkRewards(invite);
}

async function checkRewards(invite) {
    const rewards = {
        5: 'Spotify Premium 1 month',
        10: 'Prime Video 1 month',
        20: 'NordVPN 1 month',
        30: 'OpenAI credits $5'
    };
    const reward = rewards[invite.invites];
    if (reward && !invite.claimedRewards.includes(reward)) {
        const user = await client.users.fetch(invite.userId);
        user.send(`Congratulations! You have earned ${reward}!`);
        invite.claimedRewards.push(reward);
        await invite.save();
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'setup-tickets') {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('🎫 Create Ticket')
                    .setStyle(ButtonStyle.Primary),
            );

        await interaction.reply({ content: 'Click the button to create a ticket.', components: [row] });
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'create_ticket') {
        const channel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: 'GUILD_TEXT',
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel],
                },
            ],
        });

        const embed = new EmbedBuilder()
            .setTitle('Ticket')
            .setDescription('Support will be with you shortly.');

        const closeButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('❌ Close Ticket')
                    .setStyle(ButtonStyle.Danger),
            );

        await channel.send({ embeds: [embed], components: [closeButton] });
        await interaction.reply({ content: `Ticket created: ${channel}`, ephemeral: true });
    } else if (interaction.customId === 'close_ticket') {
        await interaction.channel.delete();
    }
});

async function createTicket(userId) {
    const channel = await client.guilds.cache.get(guildId).channels.create({
        name: `ticket-${userId}`,
        type: 'GUILD_TEXT',
        permissionOverwrites: [
            {
                id: guildId,
                deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
                id: userId,
                allow: [PermissionsBitField.Flags.ViewChannel],
            },
        ],
    });

    const embed = new EmbedBuilder()
        .setTitle('Ticket')
        .setDescription('Support will be with you shortly.');

    const closeButton = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('❌ Close Ticket')
                .setStyle(ButtonStyle.Danger),
        );

    await channel.send({ embeds: [embed], components: [closeButton] });
    return channel;
}

client.on('messageCreate', async message => {
    if (message.content.startsWith('!invites')) {
        const userId = message.author.id;
        const invite = await Invite.findOne({ userId });
        if (invite) {
            message.reply(`You have ${invite.invites} invites.`);
        } else {
            message.reply('You have no invites.');
        }
    }
});

client.login(token);
