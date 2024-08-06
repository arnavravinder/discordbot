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
    invitedUsers: { type: [String], default: [] },
    questions: { type: Map, of: String }
});

const Invite = mongoose.model('Invite', inviteSchema);

const commands = [
    {
        name: 'setup-tickets',
        description: 'Setup the ticket system'
    },
    {
        name: 'invites',
        description: 'Show your invite count'
    },
    {
        name: 'leaderboard',
        description: 'Show the invite leaderboard'
    },
    {
        name: 'help',
        description: 'Show help information'
    },
    {
        name: 'setup-reaction-roles',
        description: 'Setup reaction roles'
    },
    {
        name: 'reset-invites',
        description: 'Reset invite count for a user'
    },
    {
        name: 'list-tickets',
        description: 'List all tickets'
    },
    {
        name: 'assign-role',
        description: 'Assign a role to a user',
        options: [
            {
                name: 'user',
                type: 'USER',
                description: 'The user to assign a role to',
                required: true
            },
            {
                name: 'role',
                type: 'ROLE',
                description: 'The role to assign',
                required: true
            }
        ]
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

    let found = false;

    currentInvites.forEach(invite => {
        const cachedInvite = cachedInvites[invite.code];
        if (cachedInvite && cachedInvite < invite.uses) {
            addInvite(invite.inviter.id, member.id);
            inviteCache[invite.code] = invite.uses;
            found = true;
        }
    });

    if (!found) {
        askUserWhoInvited(member);
    }
    askQuestions(member);
});

async function addInvite(userId, newMemberId) {
    let invite = await Invite.findOne({ userId });
    if (!invite) {
        invite = new Invite({ userId });
    }
    invite.invites += 1;
    invite.invitedUsers.push(newMemberId);
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

async function askUserWhoInvited(member) {
    try {
        const user = await client.users.fetch(member.id);
        const dm = await user.send('Welcome! Can you please tell us who invited you to the server?');
        const filter = m => m.author.id === user.id;
        const collected = await dm.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
        const inviter = collected.first().content;
        const inviterUser = await client.users.fetch(inviter);
        if (inviterUser) {
            addInvite(inviterUser.id, member.id);
            user.send(`Thank you! We have recorded that ${inviterUser.tag} invited you.`);
        } else {
            user.send(`Sorry, we couldn't find the user you mentioned.`);
        }
    } catch (error) {
        console.error(`Failed to ask ${member.id} who invited them: ${error.message}`);
    }
}

async function askQuestions(member) {
    try {
        const user = await client.users.fetch(member.id);
        const questions = [
            'What is your favorite color?',
            'What is your hobby?',
            'What do you expect from this server?'
        ];
        const answers = new Map();

        for (const question of questions) {
            const dm = await user.send(question);
            const filter = m => m.author.id === user.id;
            const collected = await dm.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
            const answer = collected.first().content;
            answers.set(question, answer);
        }

        let invite = await Invite.findOne({ userId: member.id });
        if (!invite) {
            invite = new Invite({ userId: member.id });
        }
        invite.questions = answers;
        await invite.save();
        user.send('Thank you for answering the questions!');
    } catch (error) {
        console.error(`Failed to ask questions to ${member.id}: ${error.message}`);
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
    } else if (commandName === 'invites') {
        const userId = interaction.user.id;
        const invite = await Invite.findOne({ userId });
        if (invite) {
            interaction.reply(`You have ${invite.invites} invites.`);
        } else {
            interaction.reply('You have no invites.');
        }
    } else if (commandName === 'leaderboard') {
        const topInviters = await Invite.find().sort({ invites: -1 }).limit(10);
        const embed = new EmbedBuilder()
            .setTitle('Invite Leaderboard')
            .setDescription(topInviters.map((inv, i) => `${i + 1}. <@${inv.userId}> - ${inv.invites} invites`).join('\n'));
        interaction.reply({ embeds: [embed] });
    } else if (commandName === 'help') {
        const embed = new EmbedBuilder()
            .setTitle('Wave Bot Help')
            .setDescription('Here are the available commands:\n\n`/setup-tickets` - Setup the ticket system\n`/invites` - Show your invite count\n`/leaderboard` - Show the invite leaderboard\n`/help` - Show help information\n`/setup-reaction-roles` - Setup reaction roles');
        interaction.reply({ embeds: [embed] });
    } else if (commandName === 'setup-reaction-roles') {
        const embed = new EmbedBuilder()
            .setTitle('Reaction Roles')
            .setDescription('React to get your roles!');

        const message = await interaction.reply({ embeds: [embed], fetchReply: true });

        await message.react('🟢');
        await message.react('🔵');
    } else if (commandName === 'reset-invites') {
        const user = interaction.options.getUser('user');
        let invite = await Invite.findOne({ userId: user.id });
        if (invite) {
            invite.invites = 0;
            invite.claimedRewards = [];
            await invite.save();
            interaction.reply(`Reset invites for ${user.tag}.`);
        } else {
            interaction.reply(`${user.tag} has no invites to reset.`);
        }
    } else if (commandName === 'list-tickets') {
        const channels = interaction.guild.channels.cache.filter(channel => channel.name.startsWith('ticket-'));
        if (channels.size > 0) {
            interaction.reply(`Open tickets:\n${channels.map(channel => channel.name).join('\n')}`);
        } else {
            interaction.reply('There are no open tickets.');
        }
    } else if (commandName === 'assign-role') {
        const user = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');
        const member = interaction.guild.members.cache.get(user.id);
        await member.roles.add(role);
        interaction.reply(`Assigned role ${role.name} to ${user.tag}.`);
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;

    const { message, emoji } = reaction;
    const member = message.guild.members.cache.get(user.id);

    if (emoji.name === '🟢') {
        const role = message.guild.roles.cache.find(role => role.name === 'GreenRole');
        await member.roles.add(role);
    } else if (emoji.name === '🔵') {
        const role = message.guild.roles.cache.find(role => role.name === 'BlueRole');
        await member.roles.add(role);
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;

    const { message, emoji } = reaction;
    const member = message.guild.members.cache.get(user.id);

    if (emoji.name === '🟢') {
        const role = message.guild.roles.cache.find(role => role.name === 'GreenRole');
        await member.roles.remove(role);
    } else if (emoji.name === '🔵') {
        const role = message.guild.roles.cache.find(role => role.name === 'BlueRole');
        await member.roles.remove(role);
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
