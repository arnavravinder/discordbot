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
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const userId = message.author.id;

    db.get("SELECT id FROM users WHERE id = ?", [userId], (err, row) => {
        if (!row) {
            db.run("INSERT INTO users (id, balance) VALUES (?, ?)", [userId, 0]);
        }
    });

    const randomMoney = Math.floor(Math.random() * 10) + 1;
    db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [randomMoney, userId]);

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
});

client.login(process.env.TOKEN);
