const { Client, Intents, MessageEmbed } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
// fyi all imgur links are the discordjs logo plz feel free to add ur bot logo there! also add 'analyrics_data.json' file in ur host
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS
    ]
});

const prefix = "!";
let analytics = {
    messageCount: 0,
    memberCount: 0,
    joinCount: 0,
    leaveCount: 0,
    userMessageCounts: {},
    dailyMessageCount: {},
    hourlyMessageCount: {}
};

const dataFile = './analytics_data.json';

client.once('ready', async () => {
    console.log('Server Analytics Bot is online! 📊');
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    analytics.memberCount = guild.memberCount;

    if (fs.existsSync(dataFile)) {
        const data = JSON.parse(fs.readFileSync(dataFile));
        analytics = { ...analytics, ...data };
    } else {
        saveData();
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    analytics.messageCount++;
    const userId = message.author.id;
    if (!analytics.userMessageCounts[userId]) {
        analytics.userMessageCounts[userId] = 0;
    }
    analytics.userMessageCounts[userId]++;

    const today = new Date().toISOString().split('T')[0];
    if (!analytics.dailyMessageCount[today]) {
        analytics.dailyMessageCount[today] = 0;
    }
    analytics.dailyMessageCount[today]++;

    const hour = new Date().getHours();
    if (!analytics.hourlyMessageCount[hour]) {
        analytics.hourlyMessageCount[hour] = 0;
    }
    analytics.hourlyMessageCount[hour]++;

    saveData();

    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'analytics') {
            const analyticsEmbed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Server Analytics 📊')
                .setDescription('Here are the current server analytics:')
                .addFields(
                    { name: 'Total Members', value: `${analytics.memberCount}`, inline: true },
                    { name: 'Total Messages', value: `${analytics.messageCount}`, inline: true },
                    { name: 'Joins', value: `${analytics.joinCount}`, inline: true },
                    { name: 'Leaves', value: `${analytics.leaveCount}`, inline: true }
                )
                .setFooter('Server Analytics Bot', 'https://i.imgur.com/wSTFkRM.png');
            message.channel.send({ embeds: [analyticsEmbed] });
        } else if (command === 'help') {
            const helpEmbed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Server Analytics Bot Help')
                .setDescription('List of available commands:')
                .addFields(
                    { name: '!analytics', value: 'View the server analytics.' },
                    { name: '!userstats <@user>', value: 'View stats for a specific user.' },
                    { name: '!topusers', value: 'View the top 5 users by message count.' },
                    { name: '!dailymessages', value: 'View the daily message count.' },
                    { name: '!hourlymessages', value: 'View the hourly message count.' },
                    { name: '!help', value: 'Display this help message.' }
                )
                .setFooter('Server Analytics Bot', 'https://i.imgur.com/wSTFkRM.png');
            message.channel.send({ embeds: [helpEmbed] });
        } else if (command === 'userstats') {
            const user = message.mentions.users.first() || message.author;
            const userId = user.id;
            const userMessageCount = analytics.userMessageCounts[userId] || 0;

            const userStatsEmbed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle(`Stats for ${user.username}`)
                .addFields(
                    { name: 'Messages Sent', value: `${userMessageCount}`, inline: true },
                    { name: 'User ID', value: `${userId}`, inline: true }
                )
                .setFooter('Server Analytics Bot', 'https://i.imgur.com/wSTFkRM.png');
            message.channel.send({ embeds: [userStatsEmbed] });
        } else if (command === 'topusers') {
            const topUsers = Object.entries(analytics.userMessageCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([userId, count], index) => {
                    const user = client.users.cache.get(userId);
                    return `${index + 1}. ${user ? user.username : 'Unknown User'}: ${count} messages`;
                })
                .join('\n');

            const topUsersEmbed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Top 5 Users by Messages')
                .setDescription(topUsers)
                .setFooter('Server Analytics Bot', 'https://i.imgur.com/wSTFkRM.png'); //djs logo
            message.channel.send({ embeds: [topUsersEmbed] });
        } else if (command === 'dailymessages') {
            const dailyMessages = Object.entries(analytics.dailyMessageCount)
                .map(([date, count]) => `${date}: ${count} messages`)
                .join('\n');

            const dailyMessagesEmbed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Daily Messages')
                .setDescription(dailyMessages)
                .setFooter('Server Analytics Bot', 'https://i.imgur.com/wSTFkRM.png'); //djs logo
            message.channel.send({ embeds: [dailyMessagesEmbed] });
        } else if (command === 'hourlymessages') {
            const hourlyMessages = Object.entries(analytics.hourlyMessageCount)
                .map(([hour, count]) => `${hour}:00 - ${hour + 1}:00: ${count} messages`)
                .join('\n');

            const hourlyMessagesEmbed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Hourly Messages')
                .setDescription(hourlyMessages)
                .setFooter('Server Analytics Bot', 'https://i.imgur.com/wSTFkRM.png'); //djs logo
            message.channel.send({ embeds: [hourlyMessagesEmbed] });
        }
    }
});

client.on('guildMemberAdd', async member => {
    analytics.memberCount++;
    analytics.joinCount++;
    saveData();
});

client.on('guildMemberRemove', async member => {
    analytics.memberCount--;
    analytics.leaveCount++;
    saveData();
});

function saveData() {
    fs.writeFileSync(dataFile, JSON.stringify(analytics, null, 2));
}

function generateReport() {
    const reportEmbed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Weekly Server Analytics Report 📊')
        .setDescription('Here are the analytics for the past week:')
        .addFields(
            { name: 'Total Members', value: `${analytics.memberCount}`, inline: true },
            { name: 'Total Messages', value: `${analytics.messageCount}`, inline: true },
            { name: 'Joins', value: `${analytics.joinCount}`, inline: true },
            { name: 'Leaves', value: `${analytics.leaveCount}`, inline: true }
        )
        .setFooter('Server Analytics Bot', 'https://i.imgur.com/wSTFkRM.png'); //djs logo, set ur bot logo

    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    const channel = guild.channels.cache.find(channel => channel.name === 'general');
    if (channel) {
        channel.send({ embeds: [reportEmbed] });
    }
}

//weekly report set if u want

// setInterval(generateReport, 7 * 24 * 60 * 60 * 1000);

client.login(process.env.DISCORD_TOKEN);
