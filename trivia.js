const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

const prefix = '!';
let currentQuestion = null;
let currentAnswer = null;
const scores = new Map();

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.startsWith(`${prefix}trivia`)) {
        // Start a new trivia game
        try {
            const response = await fetch('https://opentdb.com/api.php?amount=1&type=multiple');
            const data = await response.json();
            const question = data.results[0];
            currentQuestion = question.question;
            currentAnswer = question.correct_answer;

            const options = [...question.incorrect_answers, question.correct_answer].sort(() => Math.random() - 0.5);

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('🎉 **Trivia Time!**')
                .setDescription(`**Question:** ${currentQuestion}\n\n` +
                    options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n'));

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            message.reply('❌ **Failed to fetch trivia question.**');
        }
    }

    if (message.content.startsWith(`${prefix}score`)) {
        const userScore = scores.get(message.author.id) || 0;
        message.reply(`🏅 **Your score is ${userScore}.**`);
    }

    if (currentQuestion && message.content.length === 1) {
        const answerIndex = message.content.toUpperCase().charCodeAt(0) - 65;
        if (answerIndex >= 0 && answerIndex <= 3) {
            const selectedAnswer = currentQuestion.options[answerIndex];
            if (selectedAnswer === currentAnswer) {
                let userScore = scores.get(message.author.id) || 0;
                userScore += 1;
                scores.set(message.author.id, userScore);

                message.reply('✅ **Correct!**');
            } else {
                message.reply('❌ **Incorrect.**');
            }
            currentQuestion = null;
            currentAnswer = null;
        }
    }
});

client.login(process.env.TOKEN);
