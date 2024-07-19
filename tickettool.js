const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');
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

const ticketSetupMessageId = 'TICKET_SETUP_MESSAGE_ID'; // Replace with your message ID
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

            ticketChannel.send(`🎫 **Ticket created by ${user.tag}**\n\nUse \`!close\` to close this ticket.`);

            reaction.message.reactions.resolve(ticketEmoji).users.remove(user.id);
        }
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.channel.name.startsWith('ticket-')) {
        if (message.content.toLowerCase() === '!close') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                return message.channel.send('⚠️ You do not have permission to use this command!');
            }

            message.channel.send('🔒 Closing ticket...').then(() => {
                setTimeout(() => {
                    message.channel.delete();
                }, 5000);
            });
        }
    }
});

client.login(process.env.TOKEN);
