const { Client, Intents } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
});

const prefix = "!";
let currentAuction = null;

client.once('ready', () => {
    console.log('Auction Bot is online! 🏷️');
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'startauction') {
        if (currentAuction) {
            return message.channel.send('An auction is already in progress. Please end the current auction before starting a new one.');
        }

        const item = args.join(' ');
        const startingBid = parseFloat(args[0]);

        if (!item || isNaN(startingBid)) {
            return message.channel.send('Usage: !startauction <startingBid> <item>');
        }

        currentAuction = {
            item: item.slice(startingBid.toString().length).trim(),
            startingBid,
            highestBid: startingBid,
            highestBidder: null,
            startTime: new Date()
        };

        message.channel.send(`Auction started for **${currentAuction.item}** with a starting bid of $${currentAuction.startingBid.toFixed(2)}. Place your bids with !bid <amount>.`);
    } else if (command === 'bid') {
        if (!currentAuction) {
            return message.channel.send('There is no active auction. Start an auction with !startauction.');
        }

        const bidAmount = parseFloat(args[0]);

        if (isNaN(bidAmount)) {
            return message.channel.send('Usage: !bid <amount>');
        }

        if (bidAmount <= currentAuction.highestBid) {
            return message.channel.send(`Your bid must be higher than the current highest bid of $${currentAuction.highestBid.toFixed(2)}.`);
        }

        currentAuction.highestBid = bidAmount;
        currentAuction.highestBidder = message.author;

        message.channel.send(`The highest bid for **${currentAuction.item}** is now $${currentAuction.highestBid.toFixed(2)} by ${currentAuction.highestBidder}.`);
    } else if (command === 'endauction') {
        if (!currentAuction) {
            return message.channel.send('There is no active auction to end.');
        }

        if (!currentAuction.highestBidder) {
            message.channel.send(`The auction for **${currentAuction.item}** ended with no bids.`);
        } else {
            message.channel.send(`The auction for **${currentAuction.item}** has ended. The winning bid is $${currentAuction.highestBid.toFixed(2)} by ${currentAuction.highestBidder}.`);
        }

        currentAuction = null;
    }
});

client.login(process.env.DISCORD_TOKEN);
