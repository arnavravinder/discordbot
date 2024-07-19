const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageContent
    ]
});

let ticketSetupMessageId = 'TICKET_SETUP_MESSAGE_ID'; // Replace with your message ID
const ticketEmoji = '🎫'; // Emoji used to create tickets

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!setticket')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.channel.send('⚠️ You do not have permission to use this command!');
        }

        const ticketMessage = await message.channel.send({
            content: 'React with 🎫 to create a support ticket!',
            components: []
        });
        
        ticketSetupMessageId = ticketMessage.id;
        message.channel.send('✅ Ticket setup message created!');
    }

    if (message.content.startsWith('!assign')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.channel.send('⚠️ You do not have permission to use this command!');
        }

        const args = message.content.split(' ').slice(1);
        const user = message.mentions.users.first();
        const ticketChannel = message.channel;

        if (!user || !ticketChannel.name.startsWith('ticket-')) {
            return message.channel.send('⚠️ Please mention a user and ensure you are in a ticket channel.');
        }

        const member = message.guild.members.cache.get(user.id);
        if (member) {
            ticketChannel.permissionOverwrites.edit(user.id, {
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true
            });
            message.channel.send(`✅ Ticket assigned to ${user.tag}`);
        } else {
            message.channel.send('⚠️ User not found in the server.');
        }
    }

    if (message.content.startsWith('!status')) {
        if (!message.channel.name.startsWith('ticket-')) {
            return message.channel.send('⚠️ This command can only be used in a ticket channel.');
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Ticket Status')
            .addFields(
                { name: 'Ticket Channel', value: message.channel.name, inline: true },
                { name: 'Created By', value: message.channel.name.split('-')[1], inline: true },
                { name: 'Status', value: 'Open', inline: true }
            )
            .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() });

        message.channel.send({ embeds: [embed] });
    }

    if (message.content.startsWith('!escalate')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.channel.send('⚠️ You do not have permission to use this command!');
        }

        const args = message.content.split(' ').slice(1);
        const role = message.mentions.roles.first();
        const ticketChannel = message.channel;

        if (!role || !ticketChannel.name.startsWith('ticket-')) {
            return message.channel.send('⚠️ Please mention a role and ensure you are in a ticket channel.');
        }

        ticketChannel.permissionOverwrites.edit(role.id, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: true
        });
        message.channel.send(`✅ Ticket escalated to ${role.name}`);
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.message.id === ticketSetupMessageId && !user.bot && reaction.emoji.name === ticketEmoji) {
        const guild = reaction.message.guild;
        const member = guild.members.cache.get(user.id);

        if (member) {
            const ticketChannel = await guild.channels.create(`ticket-${user.username}`, {
                type: 'GUILD_TEXT',
                parent: 'TICKET_CATEGORY_ID', // Replace with your category ID
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                    },
                    {
                        id: guild.roles.cache.find(role => role.name === 'Support'),
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                    }
                ],
            });

            const ticketEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`🎫 Ticket created by ${user.tag}`)
                .setDescription('Use `!close` to close this ticket or `!assign @user` to assign it to someone.')
                .setFooter({ text: `Ticket ID: ${ticketChannel.id}`, iconURL: user.displayAvatarURL() });

            const closeButton = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Close Ticket')
                .setStyle(ButtonStyle.Danger);

            const assignButton = new ButtonBuilder()
                .setCustomId('assign_ticket')
                .setLabel('Assign Ticket')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(closeButton, assignButton);

            ticketChannel.send({ embeds: [ticketEmbed], components: [row] });

            reaction.message.reactions.resolve(ticketEmoji).users.remove(user.id);
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const { customId } = interaction;

    if (customId === 'close_ticket') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply('⚠️ You do not have permission to use this button!');
        }

        interaction.channel.send('🔒 Closing ticket...').then(() => {
            setTimeout(() => {
                interaction.channel.delete();
            }, 5000);
        });
        await interaction.reply({ content: '✅ Ticket is being closed.', ephemeral: true });
    }

    if (customId === 'assign_ticket') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply('⚠️ You do not have permission to use this button!');
        }

        await interaction.reply({ content: 'Please mention the user to assign the ticket to:', ephemeral: true });
        const filter = response => response.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, time: 15000 });

        collector.on('collect', msg => {
            if (msg.mentions.users.size) {
                const user = msg.mentions.users.first();
                interaction.channel.permissionOverwrites.edit(user.id, {
                    VIEW_CHANNEL: true,
                    SEND_MESSAGES: true
                });
                interaction.channel.send(`✅ Ticket assigned to ${user.tag}`);
                collector.stop();
            } else {
                interaction.reply('⚠️ Please mention a valid user.');
            }
        });

        collector.on('end', collected => {
            if (!collected.size) {
                interaction.channel.send('⏳ Time expired. Ticket assignment cancelled.');
            }
        });
    }
});

client.login(process.env.TOKEN);
