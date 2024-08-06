const { Client, GatewayIntentBits, Partials, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const token = ''; // ur discord bot token
const clientId = ''; // ur client id
const guildId = ''; // ur guild id

client.once('ready', () => {
    console.log('🤖 Bot is online!');
    createCommands();
});

const commands = [
    {
        name: 'setup-tickets',
        description: 'Setup the ticket system'
    },
    {
        name: 'setup-roles',
        description: 'Setup the reaction roles'
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
    } else if (commandName === 'setup-roles') {
        const embed = new EmbedBuilder()
            .setTitle('Choose your roles')
            .setDescription('React to get the respective role.');

        const message = await interaction.reply({ embeds: [embed], fetchReply: true });

        await message.react('🟢');
        await message.react('🔵');
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
                    deny: ['ViewChannel'],
                },
                {
                    id: interaction.user.id,
                    allow: ['ViewChannel'],
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

client.login(token);
