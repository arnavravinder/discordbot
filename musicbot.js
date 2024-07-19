const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, AudioResourceStatus, VoiceConnectionStatus, AudioPlayer } = require('@discordjs/voice');
const ytSearch = require('yt-search');
const ffmpeg = require('ffmpeg-static');
const { Readable } = require('stream');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const prefix = '!';

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'play') {
        if (!message.member.voice.channel) {
            return message.reply('You need to join a voice channel first!');
        }

        const query = args.join(' ');
        if (!query) {
            return message.reply('You need to provide a song name or URL!');
        }

        const voiceChannel = message.member.voice.channel;
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        let song;
        try {
            const results = await ytSearch(query);
            song = results.videos[0];
            if (!song) return message.reply('No results found!');
        } catch (err) {
            return message.reply('Error searching for song!');
        }

        const stream = await ytSearch.stream(song.url);
        const resource = createAudioResource(stream, { inputType: 'arbitrary', metadata: { title: song.title } });
        const player = createAudioPlayer();

        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            connection.destroy();
        });

        player.on('error', error => {
            console.error(`Error: ${error.message}`);
            connection.destroy();
        });

        message.reply(`Now playing: ${song.title}`);
    }

    if (command === 'stop') {
        if (!message.member.voice.channel) {
            return message.reply('You need to join a voice channel first!');
        }

        const voiceChannel = message.member.voice.channel;
        const connection = voiceChannel.guild.voiceAdapterCreator.getVoiceConnection();
        if (connection) {
            connection.destroy();
            message.reply('Stopped playing and left the voice channel.');
        } else {
            message.reply('I am not connected to a voice channel.');
        }
    }

    if (command === 'skip') {
        if (!message.member.voice.channel) {
            return message.reply('You need to join a voice channel first!');
        }

        const voiceChannel = message.member.voice.channel;
        const connection = voiceChannel.guild.voiceAdapterCreator.getVoiceConnection();
        if (connection) {
            const player = connection.state.subscription.player;
            if (player) {
                player.stop();
                message.reply('Skipped the current track.');
            } else {
                message.reply('No track is currently playing.');
            }
        } else {
            message.reply('I am not connected to a voice channel.');
        }
    }
});

client.login(process.env.TOKEN);
