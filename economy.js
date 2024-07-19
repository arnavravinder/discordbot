const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

const prefix = '!';
const db = new sqlite3.Database('./economy.db');

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, balance INTEGER)");
    db.run("CREATE TABLE IF NOT EXISTS daily (id TEXT PRIMARY KEY, lastClaim INTEGER)");
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`Prefix is: ${prefix}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const userId = message.author.id;

    db.get("SELECT id FROM users WHERE id = ?", [userId], (err, row) => {
        if (!row) {
            db.run("INSERT INTO users (id, balance) VALUES (?, ?)", [userId, 0]);
        }
    });

    // Daily Reward System
    if (message.content.startsWith(`${prefix}daily`)) {
        const now = Date.now();
        db.get("SELECT lastClaim FROM daily WHERE id = ?", [userId], (err, row) => {
            if (err) {
                message.reply('❌ **An error occurred while fetching daily reward.**');
                console.error(err);
                return;
            }
            if (row) {
                const lastClaim = row.lastClaim;
                if (now - lastClaim < 86400000) {
                    message.reply('🕑 **You have already claimed your daily reward today!**');
                    return;
                }
            }

            const reward = Math.floor(Math.random() * 100) + 50;
            db.run("INSERT OR REPLACE INTO daily (id, lastClaim) VALUES (?, ?)", [userId, now]);
            db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [reward, userId]);

            message.reply(`🎉 **You have claimed your daily reward of ${reward} coins!**`);
        });
    }

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'balance') {
        db.get("SELECT balance FROM users WHERE id = ?", [userId], (err, row) => {
            if (err) {
                message.reply('❌ **An error occurred while fetching your balance.**');
                console.error(err);
                return;
            }
            message.reply(`💰 **Your balance is ${row.balance} coins.**`);
        });
    }

    if (command === 'pay') {
        const amount = parseInt(args[0]);
        const recipient = message.mentions.users.first();

        if (!recipient) return message.reply('❌ **You need to mention a user to pay!**');
        if (isNaN(amount) || amount <= 0) return message.reply('❌ **The amount must be a positive number!**');

        db.get("SELECT balance FROM users WHERE id = ?", [userId], (err, row) => {
            if (err) {
                message.reply('❌ **An error occurred while fetching your balance.**');
                console.error(err);
                return;
            }
            if (row.balance < amount) return message.reply('❌ **You do not have enough balance!**');

            db.get("SELECT id FROM users WHERE id = ?", [recipient.id], (err, recipientRow) => {
                if (err) {
                    message.reply('❌ **An error occurred while fetching the recipient\'s balance.**');
                    console.error(err);
                    return;
                }
                if (!recipientRow) {
                    db.run("INSERT INTO users (id, balance) VALUES (?, ?)", [recipient.id, amount]);
                }

                db.run("UPDATE users SET balance = balance - ? WHERE id = ?", [amount, userId]);
                db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [amount, recipient.id]);

                message.reply(`✅ **Successfully paid ${amount} coins to ${recipient.tag}.**`);
            });
        });
    }

    if (command === 'leaderboard') {
        db.all("SELECT id, balance FROM users ORDER BY balance DESC LIMIT 10", [], (err, rows) => {
            if (err) {
                message.reply('❌ **An error occurred while fetching the leaderboard.**');
                console.error(err);
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🏆 **Economy Leaderboard**')
                .setDescription(rows.map((row, index) => `${index + 1}. <@${row.id}> - ${row.balance} coins`).join('\n'));

            message.reply({ embeds: [embed] });
        });
    }

    if (command === 'gamble') {
        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount <= 0) return message.reply('❌ **The amount must be a positive number!**');

        db.get("SELECT balance FROM users WHERE id = ?", [userId], (err, row) => {
            if (err) {
                message.reply('❌ **An error occurred while fetching your balance.**');
                console.error(err);
                return;
            }
            if (row.balance < amount) return message.reply('❌ **You do not have enough balance!**');

            const outcome = Math.random() < 0.5 ? 'win' : 'lose';
            const multiplier = outcome === 'win' ? 2 : 0;
            const winnings = amount * multiplier;

            db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [winnings - amount, userId]);

            message.reply(`🎰 **You ${outcome}!** ${outcome === 'win' ? `You won ${winnings} coins!` : `You lost ${amount} coins!`}`);
        });
    }
});

client.login(process.env.TOKEN);
