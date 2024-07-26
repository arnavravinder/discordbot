const { Client, GatewayIntentBits, Events, REST, Routes, MessageEmbed } = require('discord.js');
const axios = require('axios');

const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageContent,
] });

const DISCORD_TOKEN = 'ur api key'; //add key
const DISCORD_CHANNEL_ID = 'your-discord-channel-id';
const TWITCH_CLIENT_ID = 'ur twitch client id'; //add key
const YOUTUBE_API_KEY = 'ur youtube api key'; //add key
const TROVO_CLIENT_ID = 'ur trovo client id'; //add key
const FACEBOOK_PAGE_ACCESS_TOKEN = 'ur facebook page access token'; //add key

client.once(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!announce')) {
        const announcement = message.content.replace('!announce', '').trim();
        await sendDiscordAnnouncement(announcement);
        await sendTwitchAnnouncement(announcement);
        await sendYouTubeAnnouncement(announcement);
        await sendTrovoAnnouncement(announcement);
        await sendFacebookAnnouncement(announcement);
        message.channel.send('Announcement sent to all platforms!');
    }
});

client.login(DISCORD_TOKEN);

async function sendDiscordAnnouncement(content) {
    const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
    channel.send(content);
}

async function sendTwitchAnnouncement(content) {
    try {
        await axios.post(`https://api.twitch.tv/helix/channels?broadcaster_id=your-broadcaster-id`, {
            message: content
        }, {
            headers: {
                'Client-ID': TWITCH_CLIENT_ID,
                'Authorization': `Bearer ur twitch oauth token` //add token
            }
        });
    } catch (error) {
        console.error('Error sending Twitch announcement:', error);
    }
}

async function sendYouTubeAnnouncement(content) {
    try {
        await axios.post(`https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status`, {
            snippet: {
                title: 'Announcement',
                description: content
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
