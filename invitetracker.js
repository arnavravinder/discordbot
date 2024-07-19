const { Client, GatewayIntentBits, PermissionsBitField, Collection } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites
    ]
});

const inviteCache = new Map();

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.guilds.cache.forEach(async guild => {
        const invites = await guild.invites.fetch();
        invites.forEach(invite => {
            inviteCache.set(invite.code, invite.uses);
        });
    });
});

client.on('inviteCreate', invite => {
    inviteCache.set(invite.code, invite.uses);
});

client.on('inviteDelete', invite => {
    inviteCache.delete(invite.code);
});

client.on('guildMemberAdd', async member => {
    const oldInvites = inviteCache;
    const newInvites = await member.guild.invites.fetch();

    let usedInvite = null;
    newInvites.forEach(invite => {
        if (oldInvites.has(invite.code)) {
            if (invite.uses > oldInvites.get(invite.code)) {
                usedInvite = invite;
            }
        } else {
            inviteCache.set(invite.code, invite.uses);
        }
    });

    if (usedInvite) {
        const channel = member.guild.channels.cache.find(ch => ch.name === 'invite-logs');
        if (channel) {
            channel.send(`👤 ${member.user.tag} joined using the invite link: https://discord.gg/${usedInvite.code}`);
        }
    }

    inviteCache.clear();
    newInvites.forEach(invite => {
        inviteCache.set(invite.code, invite.uses);
    });
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!invites')) {
        const user = message.mentions.users.first() || message.author;
        const member = message.guild.members.cache.get(user.id);
        const invites = await member.guild.invites.fetch();
        const userInvites = invites.filter(invite => invite.inviter && invite.inviter.id === user.id);

        let inviteList = '';
        userInvites.forEach(invite => {
            inviteList += `https://discord.gg/${invite.code} - Uses: ${invite.uses}\n`;
        });

        message.channel.send(`Invites created by ${user.tag}:\n${inviteList || 'No invites found.'}`);
    }

    if (message.content.startsWith('!invitecount')) {
        const invites = await message.guild.invites.fetch();
        const inviteCounts = invites.reduce((acc, invite) => {
            if (!acc[invite.inviter.id]) {
                acc[invite.inviter.id] = 0;
            }
            acc[invite.inviter.id] += invite.uses;
            return acc;
        }, {});

        const inviteCountMessages = Object.keys(inviteCounts).map(id => {
            const user = client.users.cache.get(id);
            return `${user.tag}: ${inviteCounts[id]} invites`;
        }).join('\n');

        message.channel.send(`Invite counts:\n${inviteCountMessages || 'No invite data available.'}`);
    }
});

client.login(process.env.BOT_TOKEN);
