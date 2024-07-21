const { Client, Intents } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
});

const prefix = "!";

client.once('ready', () => {
    console.log('Emoji Bot is online! 😃');
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'listemojis') {
        const emojis = message.guild.emojis.cache.map(e => e.toString()).join(' ');
        if (emojis.length > 0) {
            message.channel.send(`Custom emojis in this server: ${emojis}`);
        } else {
            message.channel.send('There are no custom emojis in this server. 😢');
        }
    } else if (command === 'stealemoji') {
        if (args.length < 2) {
            return message.channel.send('Usage: !stealemoji <emoji> <name>');
        }

        const emoji = args[0];
        const name = args[1];

        if (emoji.startsWith('http') || emoji.startsWith('https')) {
            try {
                const newEmoji = await message.guild.emojis.create(emoji, name);
                message.channel.send(`Emoji ${newEmoji.toString()} has been added to the server as :${name}:`);
            } catch (error) {
                message.channel.send('Failed to add the emoji. Please ensure the URL is correct and try again. ❌');
            }
        } else {
            const emojiMatch = emoji.match(/<a?:(\w+):(\d+)>/);
            if (emojiMatch) {
                const emojiId = emojiMatch[2];
                const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.png`;
                try {
                    const newEmoji = await message.guild.emojis.create(emojiUrl, name);
                    message.channel.send(`Emoji ${newEmoji.toString()} has been added to the server as :${name}:`);
                } catch (error) {
                    message.channel.send('Failed to add the emoji. Please ensure the emoji is correct and try again. ❌');
                }
            } else {
                message.channel.send('Invalid emoji format. Please provide a URL or a valid emoji from another server. ❌');
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
