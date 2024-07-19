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
    db.run("CREATE TABLE IF NOT EXISTS shop (item TEXT PRIMARY KEY, price INTEGER)");
    db.run("CREATE TABLE IF NOT EXISTS inventory (id TEXT, item TEXT, quantity INTEGER, PRIMARY KEY (id, item))");
    db.run("CREATE TABLE IF NOT EXISTS achievements (id TEXT PRIMARY KEY, achieved BOOLEAN)");
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`Prefix is: ${prefix}`);

    const shopItems = [
        { item: 'hat', price: 500 },
        { item: 'shirt', price: 1000 },
        { item: 'sword', price: 1500 }
    ];

    shopItems.forEach(item => {
        db.run("INSERT OR IGNORE INTO shop (item, price) VALUES (?, ?)", [item.item, item.price]);
    });
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const userId = message.author.id;

    db.get("SELECT id FROM users WHERE id = ?", [userId], (err, row) => {
        if (!row) {
            db.run("INSERT INTO users (id, balance) VALUES (?, ?)", [userId, 0]);
        }
    });

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

    if (command === 'shop') {
        db.all("SELECT item, price FROM shop", [], (err, rows) => {
            if (err) {
                message.reply('❌ **An error occurred while fetching the shop items.**');
                console.error(err);
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🛒 **Shop**')
                .setDescription(rows.map(row => `${row.item} - ${row.price} coins`).join('\n'));

            message.reply({ embeds: [embed] });
        });
    }

    if (command === 'buy') {
        const item = args[0];
        const quantity = parseInt(args[1]) || 1;

        if (!item) return message.reply('❌ **You need to specify an item to buy!**');
        if (isNaN(quantity) || quantity <= 0) return message.reply('❌ **The quantity must be a positive number!**');

        db.get("SELECT price FROM shop WHERE item = ?", [item], (err, row) => {
            if (err) {
                message.reply('❌ **An error occurred while fetching the item price.**');
                console.error(err);
                return;
            }
            if (!row) return message.reply('❌ **Item not found in the shop!**');

            const totalPrice = row.price * quantity;

            db.get("SELECT balance FROM users WHERE id = ?", [userId], (err, userRow) => {
                if (err) {
                    message.reply('❌ **An error occurred while fetching your balance.**');
                    console.error(err);
                    return;
                }
                if (userRow.balance < totalPrice) return message.reply('❌ **You do not have enough balance!**');

                db.run("UPDATE users SET balance = balance - ? WHERE id = ?", [totalPrice, userId]);
                db.run("INSERT INTO inventory (id, item, quantity) VALUES (?, ?, ?) ON CONFLICT(id, item) DO UPDATE SET quantity = quantity + ?", [userId, item, quantity, quantity]);

                message.reply(`🛍️ **You bought ${quantity} ${item}(s) for ${totalPrice} coins!**`);
            });
        });
    }

    if (command === 'inventory') {
        db.all("SELECT item, quantity FROM inventory WHERE id = ?", [userId], (err, rows) => {
            if (err) {
                message.reply('❌ **An error occurred while fetching your inventory.**');
                console.error(err);
                return;
            }

            if (rows.length === 0) {
                message.reply('📦 **Your inventory is empty.**');
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('#FF4500')
                .setTitle('📦 **Your Inventory**')
                .setDescription(rows.map(row => `${row.item} - ${row.quantity}`).join('\n'));

            message.reply({ embeds: [embed] });
        });
    }

    if (command === 'achievements') {
        db.get("SELECT achieved FROM achievements WHERE id = ?", [userId], (err, row) => {
            if (err) {
                message.reply('❌ **An error occurred while fetching your achievements.**');
                console.error(err);
                return;
            }

            if (!row) {
                db.run("INSERT INTO achievements (id, achieved) VALUES (?, ?)", [userId, false]);
                message.reply('🏆 **You have no achievements yet.**');
                return;
            }

            const achievementStatus = row.achieved ? 'achieved' : 'not achieved';
            message.reply(`🏆 **Your achievement status: ${achievementStatus}.**`);
        });
    }

    if (command === 'reset') {
        db.run("DELETE FROM users WHERE id = ?", [userId]);
        db.run("DELETE FROM daily WHERE id = ?", [userId]);
        db.run("DELETE FROM inventory WHERE id = ?", [userId]);
        db.run("DELETE FROM achievements WHERE id = ?", [userId]);
        message.reply('🔄 **Your account has been reset.**');
    }

    if (command === 'report') {
        const reason = args.join(' ');
        if (!reason) return message.reply('❌ **You need to provide a reason for the report!**');

        const reportChannel = client.channels.cache.get('YOUR_REPORT_CHANNEL_ID');
        if (!reportChannel) return message.reply('❌ **Report channel not found!**');

        const reportEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🚨 **New Report**')
            .setDescription(`**User:** ${message.author.tag}\n**Reason:** ${reason}`)
            .setTimestamp();

        reportChannel.send({ embeds: [reportEmbed] });

        message.reply('✅ **Your report has been submitted.**');
    }

    if (command === 'transfer') {
        const amount = parseInt(args[0]);
        const recipientId = args[1].replace(/[<@!>]/g, '');

        if (isNaN(amount) || amount <= 0) return message.reply('❌ **The amount must be a positive number!**');
        if (!recipientId) return message.reply('❌ **You need to specify a recipient!**');

        db.get("SELECT balance FROM users WHERE id = ?", [userId], (err, row) => {
            if (err) {
                message.reply('❌ **An error occurred while fetching your balance.**');
                console.error(err);
                return;
            }
            if (row.balance < amount) return message.reply('❌ **You do not have enough balance!**');

            db.get("SELECT id FROM users WHERE id = ?", [recipientId], (err, recipientRow) => {
                if (err) {
                    message.reply('❌ **An error occurred while fetching the recipient\'s balance.**');
                    console.error(err);
                    return;
                }
                if (!recipientRow) {
                    db.run("INSERT INTO users (id, balance) VALUES (?, ?)", [recipientId, amount]);
                }

                db.run("UPDATE users SET balance = balance - ? WHERE id = ?", [amount, userId]);
                db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [amount, recipientId]);

                message.reply(`✅ **Successfully transferred ${amount} coins to <@${recipientId}>.**`);
            });
        });
    }

    if (command === 'top') {
        db.all("SELECT id, balance FROM users ORDER BY balance DESC LIMIT 5", [], (err, rows) => {
            if (err) {
                message.reply('❌ **An error occurred while fetching the top users.**');
                console.error(err);
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('#00FFFF')
                .setTitle('🌟 **Top Users**')
                .setDescription(rows.map((row, index) => `${index + 1}. <@${row.id}> - ${row.balance} coins`).join('\n'));

            message.reply({ embeds: [embed] });
        });
    }
});

client.login(process.env.TOKEN);
