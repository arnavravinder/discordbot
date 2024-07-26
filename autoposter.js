const { Client, GatewayIntentBits, Events } = require('discord.js');
const axios = require('axios');
const { format } = require('date-fns');

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

client.once(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!announce')) {
        const announcement = message.content.replace('!announce', '').trim();
        try {
            await sendDiscordAnnouncement(announcement);
            await sendTwitchAnnouncement(announcement);
            await sendYouTubeAnnouncement(announcement);
            await sendTrovoAnnouncement(announcement);
            await sendFacebookAnnouncement(announcement);
            message.channel.send('Announcement sent to all platforms!');
        } catch (error) {
            console.error('Error sending announcement:', error);
            message.channel.send('An error occurred while sending the announcement.');
        }
    }
});

client.login(DISCORD_TOKEN);

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
        await axios.post('https://your-log-service.com/api/logs', {
            message: content,
            timestamp: new Date().toISOString()
        });
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
        await axios.post('https://your-scheduler-service.com/api/schedule', {
            message: content,
            scheduledTime: formattedDate
        });
    } catch (error) {
        console.error('Error scheduling announcement:', error);
    }
}

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!schedule')) {
        const [_, date, ...announcementParts] = message.content.split(' ');
        const announcement = announcementParts.join(' ');
        try {
            await scheduleAnnouncement(announcement, date);
            message.channel.send(`Announcement scheduled for ${date}`);
        } catch (error) {
            console.error('Error scheduling announcement:', error);
            message.channel.send('An error occurred while scheduling the announcement.');
        }
    }
});
