const { Client, Intents, MessageEmbed } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.MESSAGE_CONTENT
    ]
});

const prefix = "!";

client.once('ready', () => {
    console.log('BOTt is online! 🤖');
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const content = message.content;

    if (content.startsWith(prefix)) {
        const args = content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'chat') {
            const userMessage = args.join(' ');
            const botResponse = await getChatResponse(userMessage);
            message.channel.send(`💬 ${botResponse}`);
        } else if (command === 'help') {
            const helpEmbed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('AI Mod $& Chatbot')
                .setDescription('List of available commands:')
                .addFields(
                    { name: '!chat <message>', value: 'Chat with the AI.' },
                    { name: '!help', value: 'Display this help message.' },
                    { name: '!rules', value: 'Display the server rules.' },
                    { name: '!ping', value: 'Check the bot\'s latency.' }
                )
                .setFooter('AI Moderation and Chat Bot', 'https://i.imgur.com/wSTFkRM.png');
            message.channel.send({ embeds: [helpEmbed] });
        } else if (command === 'rules') {
            const rulesEmbed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('Server Rules 📜')
                .setDescription('Please adhere to the following rules to maintain a healthy community:')
                .addFields(
                    { name: '1. Be respectful', value: 'Treat everyone with respect. No harassment or hate speech.' },
                    { name: '2. No spam', value: 'Avoid spamming messages or commands.' },
                    { name: '3. Follow Discord TOS', value: 'Ensure your behavior complies with Discord\'s Terms of Service.' },
                    { name: '4. Use appropriate channels', value: 'Post in the relevant channels to keep discussions organized.' }
                )
                .setFooter('AI Moderation and Chat Bot', 'https://i.imgur.com/wSTFkRM.png');
            message.channel.send({ embeds: [rulesEmbed] });
        } else if (command === 'ping') {
            const ping = Date.now() - message.createdTimestamp;
            message.channel.send(`🏓 Pong! Latency is ${ping}ms.`);
        }
    } else {
        const isAppropriate = await checkMessage(content);

        if (!isAppropriate) {
            await message.delete();
            message.channel.send(`${message.author}, your message was deleted due to inappropriate content. Please adhere to the community guidelines. ⚠️`);
        }
    }
});

async function checkMessage(content) {
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/completions',
            {
                model: "text-davinci-003",
                prompt: `Analyze the following message for inappropriate content: "${content}"\nRespond with "true" if the message is appropriate and "false" if it is inappropriate.`,
                max_tokens: 10,
                n: 1,
                stop: null,
                temperature: 0.5,
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const result = response.data.choices[0].text.trim();
        return result.toLowerCase() === 'true';
    } catch (error) {
        console.error('Error checking message:', error);
        return true; // if error --> thene message is fine! 
    }
}

async function getChatResponse(userMessage) {
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/completions',
            {
                model: "text-davinci-003",
                prompt: `The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.\n\nHuman: ${userMessage}\nAI:`,
                max_tokens: 150,
                n: 1,
                stop: ["\n", " Human:", " AI:"],
                temperature: 0.9,
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].text.trim();
    } catch (error) {
        console.error('Error getting chat response:', error);
        return "I'm sorry, I'm having trouble processing your request right now. 😢";
    }
}

client.login(process.env.DISCORD_TOKEN);
