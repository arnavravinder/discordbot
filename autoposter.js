const { Client, GatewayIntentBits, Events } = require('discord.js');
const axios = require('axios');
const { format } = require('date-fns');
const schedule = require('node-schedule');
const fs = require('fs');
const path = require('path');
const util = require('util');

const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageContent,
] });

const DISCORD_TOKEN = 'ur api key'; 
const DISCORD_CHANNEL_ID = 'your-discord-channel-id';
const TWITCH_CLIENT_ID = 'ur twitch client id'; 
const TWITCH_OAUTH_TOKEN = 'ur twitch oauth token'; 
const YOUTUBE_API_KEY = 'ur youtube api key'; 
const YOUTUBE_CHANNEL_ID = 'your-youtube-channel-id';
const TROVO_CLIENT_ID = 'ur trovo client id'; 
const TROVO_OAUTH_TOKEN = 'ur trovo oauth token'; 
const FACEBOOK_PAGE_ACCESS_TOKEN = 'ur facebook page access token'; 
const FACEBOOK_PAGE_ID = 'your-facebook-page-id';
const LOG_FILE_PATH = path.join(__dirname, 'announcement_logs.txt');
const SCHEDULE_FILE_PATH = path.join(__dirname, 'scheduled_announcements.json');
const USERS_FILE_PATH = path.join(__dirname, 'users.json');
const TEMPLATES_FILE_PATH = path.join(__dirname, 'templates.json');

client.once(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.tag}!`);
    loadScheduledAnnouncements();
    loadUsers();
    loadTemplates();
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!announce')) {
        const announcement = message.content.replace('!announce', '').trim();
        try {
            await sendAnnouncements(announcement);
            await logAnnouncement(announcement);
            message.channel.send('Announcement sent to all platforms!');
        } catch (error) {
            console.error('Error sending announcement:', error);
            message.channel.send('An error occurred while sending the announcement.');
        }
    }
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!schedule')) {
        const [_, date, ...announcementParts] = message.content.split(' ');
        const announcement = announcementParts.join(' ');
        try {
            await scheduleAnnouncement(announcement, date);
            saveScheduledAnnouncement(announcement, date);
            message.channel.send(`Announcement scheduled for ${date}`);
        } catch (error) {
            console.error('Error scheduling announcement:', error);
            message.channel.send('An error occurred while scheduling the announcement.');
        }
    }
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!status')) {
        try {
            const logContent = fs.readFileSync(LOG_FILE_PATH, 'utf8');
            message.channel.send('```\n' + logContent + '\n```');
        } catch (error) {
            console.error('Error retrieving log status:', error);
            message.channel.send('An error occurred while retrieving log status.');
        }
    }
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!list-scheduled')) {
        try {
            const scheduled = fs.readFileSync(SCHEDULE_FILE_PATH, 'utf8');
            message.channel.send('```\n' + scheduled + '\n```');
        } catch (error) {
            console.error('Error retrieving scheduled announcements:', error);
            message.channel.send('An error occurred while retrieving scheduled announcements.');
        }
    }
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!add-user')) {
        const [_, userId, ...roles] = message.content.split(' ');
        try {
            addUser(userId, roles);
            message.channel.send(`User ${userId} added with roles: ${roles.join(', ')}`);
        } catch (error) {
            console.error('Error adding user:', error);
            message.channel.send('An error occurred while adding the user.');
        }
    }
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!remove-user')) {
        const [_, userId] = message.content.split(' ');
        try {
            removeUser(userId);
            message.channel.send(`User ${userId} removed.`);
        } catch (error) {
            console.error('Error removing user:', error);
            message.channel.send('An error occurred while removing the user.');
        }
    }
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!list-users')) {
        try {
            const users = fs.readFileSync(USERS_FILE_PATH, 'utf8');
            message.channel.send('```\n' + users + '\n```');
        } catch (error) {
            console.error('Error retrieving users:', error);
            message.channel.send('An error occurred while retrieving users.');
        }
    }
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!set-template')) {
        const [_, templateName, ...templateParts] = message.content.split(' ');
        const template = templateParts.join(' ');
        try {
            setTemplate(templateName, template);
            message.channel.send(`Template ${templateName} set.`);
        } catch (error) {
            console.error('Error setting template:', error);
            message.channel.send('An error occurred while setting the template.');
        }
    }
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!get-template')) {
        const [_, templateName] = message.content.split(' ');
        try {
            const template = getTemplate(templateName);
            message.channel.send('```\n' + template + '\n```');
        } catch (error) {
            console.error('Error retrieving template:', error);
            message.channel.send('An error occurred while retrieving the template.');
        }
    }
});

client.login(DISCORD_TOKEN);

async function sendAnnouncements(content) {
    try {
        await sendDiscordAnnouncement(content);
        await sendTwitchAnnouncement(content);
        await sendYouTubeAnnouncement(content);
        await sendTrovoAnnouncement(content);
        await sendFacebookAnnouncement(content);
    } catch (error) {
        console.error('Error sending announcements:', error);
        throw error;
    }
}

async function sendDiscordAnnouncement(content) {
    try {
        const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
        await channel.send(content);
    } catch (error) {
        console.error('Error sending Discord announcement:', error);
    }
}

async function sendTwitchAnnouncement(content) {
    try {
        await axios.post('https://api.twitch.tv/helix/channels', {
            broadcaster_id: 'your-broadcaster-id',
            title: 'New Announcement',
            description: content
        }, {
            headers: {
                'Client-ID': TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${TWITCH_OAUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error sending Twitch announcement:', error);
    }
}

async function sendYouTubeAnnouncement(content) {
    try {
        await axios.post('https://www.googleapis.com/youtube/v3/liveBroadcasts', {
            part: 'snippet,status',
            snippet: {
                title: 'Announcement',
                description: content,
                scheduledStartTime: format(new Date(), "yyyy-MM-ddTHH:mm:ssZ")
            },
            status: {
                privacyStatus: 'public'
            }
        }, {
            headers: {
                'Authorization': `Bearer ${YOUTUBE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error sending YouTube announcement:', error);
    }
}

async function sendTrovoAnnouncement(content) {
    try {
        await axios.post('https://api.trovo.live/announce', {
            message: content
        }, {
            headers: {
                'Client-ID': TROVO_CLIENT_ID,
                'Authorization': `Bearer ${TROVO_OAUTH_TOKEN}`
            }
        });
    } catch (error) {
        console.error('Error sending Trovo announcement:', error);
    }
}

async function sendFacebookAnnouncement(content) {
    try {
        await axios.post(`https://graph.facebook.com/${FACEBOOK_PAGE_ID}/feed`, {
            message: content,
            access_token: FACEBOOK_PAGE_ACCESS_TOKEN
        });
    } catch (error) {
        console.error('Error sending Facebook announcement:', error);
    }
}

async function logAnnouncement(content) {
    try {
        const logEntry = `${format(new Date(), "yyyy-MM-dd HH:mm:ss")}: ${content}\n`;
        fs.appendFileSync(LOG_FILE_PATH, logEntry);
    } catch (error) {
        console.error('Error logging announcement:', error);
    }
}

function formatAnnouncement(content) {
    return `📢 **New Announcement** 📢\n\n${content}\n\nStay tuned for more updates!`;
}

async function scheduleAnnouncement(content, date) {
    try {
        const formattedDate = format(new Date(date), "yyyy-MM-ddTHH:mm:ssZ");
        schedule.scheduleJob(formattedDate, async () => {
            try {
                await sendAnnouncements(content);
            } catch (error) {
                console.error('Error sending scheduled announcement:', error);
            }
        });
    } catch (error) {
        console.error('Error scheduling announcement:', error);
    }
}

function saveScheduledAnnouncement(content, date) {
    try {
        let scheduled = [];
        if (fs.existsSync(SCHEDULE_FILE_PATH)) {
            scheduled = JSON.parse(fs.readFileSync(SCHEDULE_FILE_PATH, 'utf8'));
        }
        scheduled.push({ content, date });
        fs.writeFileSync(SCHEDULE_FILE_PATH, JSON.stringify(scheduled, null, 2));
    } catch (error) {
        console.error('Error saving scheduled announcement:', error);
    }
}

function loadScheduledAnnouncements() {
    try {
        if (fs.existsSync(SCHEDULE_FILE_PATH)) {
            const scheduled = JSON.parse(fs.readFileSync(SCHEDULE_FILE_PATH, 'utf8'));
            scheduled.forEach(({ content, date }) => {
                scheduleAnnouncement(content, date);
            });
        }
    } catch (error) {
        console.error('Error loading scheduled announcements:', error);
    }
}

function addUser(userId, roles) {
    try {
        let users = [];
        if (fs.existsSync(USERS_FILE_PATH)) {
            users = JSON.parse(fs.readFileSync(USERS_FILE_PATH, 'utf8'));
        }
        users.push({ userId, roles });
        fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Error adding user:', error);
        throw error;
    }
}

function removeUser(userId) {
    try {
        let users = [];
        if (fs.existsSync(USERS_FILE_PATH)) {
            users = JSON.parse(fs.readFileSync(USERS_FILE_PATH, 'utf8'));
        }
        users = users.filter(user => user.userId !== userId);
        fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Error removing user:', error);
        throw error;
    }
}

function loadUsers() {
    try {
        if (fs.existsSync(USERS_FILE_PATH)) {
            const users = JSON.parse(fs.readFileSync(USERS_FILE_PATH, 'utf8'));
            console.log(`Loaded ${users.length} users.`);
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function setTemplate(name, template) {
    try {
        let templates = [];
        if (fs.existsSync(TEMPLATES_FILE_PATH)) {
            templates = JSON.parse(fs.readFileSync(TEMPLATES_FILE_PATH, 'utf8'));
        }
        const existingIndex = templates.findIndex(t => t.name === name);
        if (existingIndex > -1) {
            templates[existingIndex] = { name, template };
        } else {
            templates.push({ name, template });
        }
        fs.writeFileSync(TEMPLATES_FILE_PATH, JSON.stringify(templates, null, 2));
    } catch (error) {
        console.error('Error setting template:', error);
        throw error;
    }
}

function getTemplate(name) {
    try {
        if (fs.existsSync(TEMPLATES_FILE_PATH)) {
            const templates = JSON.parse(fs.readFileSync(TEMPLATES_FILE_PATH, 'utf8'));
            const template = templates.find(t => t.name === name);
            return template ? template.template : 'Template not found.';
        }
        return 'Templates file does not exist.';
    } catch (error) {
        console.error('Error retrieving template:', error);
        throw error;
    }
}

function loadTemplates() {
    try {
        if (fs.existsSync(TEMPLATES_FILE_PATH)) {
            const templates = JSON.parse(fs.readFileSync(TEMPLATES_FILE_PATH, 'utf8'));
            console.log(`Loaded ${templates.length} templates.`);
        }
    } catch (error) {
        console.error('Error loading templates:', error);
    }
}
