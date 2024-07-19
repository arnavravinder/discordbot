const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
let queue = new Map(); //que
let playlists = new Map(); 
let volume = 0.5; 

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'play') {
        if (!message.member.voice.channel) {
            return message.reply('🎵 **You need to join a voice channel first!**');
        }

        const query = args.join(' ');
        if (!query) {
            return message.reply('❌ **You need to provide a song name or URL!**');
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
            if (!song) return message.reply('🔍 **No results found!**');
        } catch (err) {
            return message.reply('⚠️ **Error searching for song!**');
        }

        const stream = await ytSearch.stream(song.url);
        const resource = createAudioResource(stream, { inputType: 'arbitrary', metadata: { title: song.title } });
        const player = createAudioPlayer();
        const playerOptions = { volume };

        player.play(resource, playerOptions);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            connection.destroy();
        });

        player.on('error', error => {
            console.error(`Error: ${error.message}`);
            connection.destroy();
        });

        message.reply(`🎶 **Now playing:** ${song.title}`);
    }

    if (command === 'stop') {
        if (!message.member.voice.channel) {
            return message.reply('🎵 **You need to join a voice channel first!**');
        }

        const voiceChannel = message.member.voice.channel;
        const connection = voiceChannel.guild.voiceAdapterCreator.getVoiceConnection();
        if (connection) {
            connection.destroy();
            message.reply('⛔ **Stopped playing and left the voice channel.**');
        } else {
            message.reply('⚠️ **I am not connected to a voice channel.**');
        }
    }

    if (command === 'skip') {
        if (!message.member.voice.channel) {
            return message.reply('🎵 **You need to join a voice channel first!**');
        }

        const voiceChannel = message.member.voice.channel;
        const connection = voiceChannel.guild.voiceAdapterCreator.getVoiceConnection();
        if (connection) {
            const player = connection.state.subscription.player;
            if (player) {
                player.stop();
                message.reply('⏭️ **Skipped the current track.**');
            } else {
                message.reply('🔄 **No track is currently playing.**');
            }
        } else {
            message.reply('⚠️ **I am not connected to a voice channel.**');
        }
    }

    if (command === 'queue') {
        if (!queue.has(message.guild.id)) {
            return message.reply('📜 **No songs in the queue.**');
        }

        const serverQueue = queue.get(message.guild.id);
        let queueString = serverQueue.songs.map((song, index) => `**${index + 1}.** ${song.title}`).join('\n');
        if (queueString.length > 2000) queueString = queueString.slice(0, 2000) + '...';

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🎶 **Current Song Queue**')
            .setDescription(queueString)
            .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() });

        message.reply({ embeds: [embed] });
    }

    if (command === 'clearqueue') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply('⚠️ **You do not have permission to use this command!**');
        }

        queue.set(message.guild.id, { songs: [] });
        message.reply('🗑️ **Queue has been cleared!**');
    }

    if (command === 'volume') {
        if (!args[0] || isNaN(args[0]) || args[0] < 0 || args[0] > 2) {
            return message.reply('🔊 **Please provide a volume level between 0 and 2.**');
        }

        volume = parseFloat(args[0]);
        message.reply(`🔊 **Volume set to ${volume * 100}%**`);
    }

    if (command === 'pause') {
        if (!message.member.voice.channel) {
            return message.reply('🎵 **You need to join a voice channel first!**');
        }

        const voiceChannel = message.member.voice.channel;
        const connection = voiceChannel.guild.voiceAdapterCreator.getVoiceConnection();
        if (connection) {
            const player = connection.state.subscription.player;
            if (player) {
                player.pause();
                message.reply('⏸️ **Playback paused.**');
            } else {
                message.reply('🔄 **No track is currently playing.**');
            }
        } else {
            message.reply('⚠️ **I am not connected to a voice channel.**');
        }
    }

    if (command === 'resume') {
        if (!message.member.voice.channel) {
            return message.reply('🎵 **You need to join a voice channel first!**');
        }

        const voiceChannel = message.member.voice.channel;
        const connection = voiceChannel.guild.voiceAdapterCreator.getVoiceConnection();
        if (connection) {
            const player = connection.state.subscription.player;
            if (player) {
                player.unpause();
                message.reply('▶️ **Playback resumed.**');
            } else {
                message.reply('🔄 **No track is currently playing.**');
            }
        } else {
            message.reply('⚠️ **I am not connected to a voice channel.**');
        }
    }

    if (command === 'repeat') {
        if (!message.member.voice.channel) {
            return message.reply('🎵 **You need to join a voice channel first!**');
        }

        const voiceChannel = message.member.voice.channel;
        const connection = voiceChannel.guild.voiceAdapterCreator.getVoiceConnection();
        if (connection) {
            const player = connection.state.subscription.player;
            if (player) {
                player.setRepeatMode(!player.repeatMode);
                message.reply(`🔁 **Repeat mode ${player.repeatMode ? 'enabled' : 'disabled'}.**`);
            } else {
                message.reply('🔄 **No track is currently playing.**');
            }
        } else {
            message.reply('⚠️ **I am not connected to a voice channel.**');
        }
    }

    if (command === 'nowplaying') {
        if (!message.member.voice.channel) {
            return message.reply('🎵 **You need to join a voice channel first!**');
        }

        const voiceChannel = message.member.voice.channel;
        const connection = voiceChannel.guild.voiceAdapterCreator.getVoiceConnection();
        if (connection) {
            const player = connection.state.subscription.player;
            if (player) {
                const song = player.currentResource.metadata;
                message.reply(`🎶 **Currently playing:** ${song.title}`);
            } else {
                message.reply('🔄 **No track is currently playing.**');
            }
        } else {
            message.reply('⚠️ **I am not connected to a voice channel.**');
        }
    }

    if (command === 'playlist') {
        const subCommand = args.shift().toLowerCase();
        const playlistName = args.join(' ');

        if (subCommand === 'create') {
            if (!playlistName) return message.reply('❌ **You need to provide a name for the playlist!**');
            if (playlists.has(playlistName)) return message.reply('⚠️ **Playlist already exists!**');

            playlists.set(playlistName, []);
            message.reply(`🗂️ **Playlist "${playlistName}" created!**`);
        }

        if (subCommand === 'add') {
            if (!playlistName) return message.reply('❌ **You need to provide a name of the playlist to add to!**');
            if (!playlists.has(playlistName)) return message.reply('⚠️ **Playlist not found!**');

            const songName = args.join(' ');
            if (!songName) return message.reply('❌ **You need to provide a song name or URL to add to the playlist!**');

            const results = await ytSearch(songName);
            const song = results.videos[0];
            if (!song) return message.reply('🔍 **No results found!**');

            const playlist = playlists.get(playlistName);
            playlist.push({ title: song.title, url: song.url });
            playlists.set(playlistName, playlist);
            message.reply(`🎶 **Added "${song.title}" to playlist "${playlistName}".**`);
        }

        if (subCommand === 'play') {
            if (!playlistName) return message.reply('❌ **You need to provide a name of the playlist to play!**');
            if (!playlists.has(playlistName)) return message.reply('⚠️ **Playlist not found!**');

            const playlist = playlists.get(playlistName);
            if (playlist.length === 0) return message.reply('📜 **Playlist is empty!**');

            const voiceChannel = message.member.voice.channel;
            if (!voiceChannel) return message.reply('🎵 **You need to join a voice channel first!**');

            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });

            const player = createAudioPlayer();
            connection.subscribe(player);

            for (const song of playlist) {
                const stream = await ytSearch.stream(song.url);
                const resource = createAudioResource(stream, { inputType: 'arbitrary', metadata: { title: song.title } });
                player.play(resource);
                await new Promise(resolve => player.once('stateChange', (oldState, newState) => {
                    if (oldState.status === AudioPlayerStatus.Playing && newState.status === AudioPlayerStatus.Idle) resolve();
                }));
            }

            message.reply(`🎶 **Playing playlist "${playlistName}".**`);
        }

        if (subCommand === 'delete') {
            if (!playlistName) return message.reply('❌ **You need to provide a name of the playlist to delete!**');
            if (!playlists.has(playlistName)) return message.reply('⚠️ **Playlist not found!**');

            playlists.delete(playlistName);
            message.reply(`🗑️ **Playlist "${playlistName}" deleted!**`);
        }
    }

    if (command === 'shuffle') {
        if (!message.member.voice.channel) {
            return message.reply('🎵 **You need to join a voice channel first!**');
        }

        const voiceChannel = message.member.voice.channel;
        const connection = voiceChannel.guild.voiceAdapterCreator.getVoiceConnection();
        if (connection) {
            const serverQueue = queue.get(message.guild.id);
            if (serverQueue && serverQueue.songs.length > 0) {
                serverQueue.songs = serverQueue.songs.sort(() => Math.random() - 0.5);
                message.reply('🔀 **Queue has been shuffled!**');
            } else {
                message.reply('📜 **No songs in the queue to shuffle.**');
            }
        } else {
            message.reply('⚠️ **I am not connected to a voice channel.**');
        }
    }

    if (command === 'loop') {
        if (!message.member.voice.channel) {
            return message.reply('🎵 **You need to join a voice channel first!**');
        }

        const voiceChannel = message.member.voice.channel;
        const connection = voiceChannel.guild.voiceAdapterCreator.getVoiceConnection();
        if (connection) {
            const player = connection.state.subscription.player;
            if (player) {
                const isLooping = player.getRepeatMode();
                player.setRepeatMode(!isLooping);
                message.reply(`🔁 **Loop mode ${!isLooping ? 'enabled' : 'disabled'}.**`);
            } else {
                message.reply('🔄 **No track is currently playing.**');
            }
        } else {
            message.reply('⚠️ **I am not connected to a voice channel.**');
        }
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.message.author.bot && reaction.emoji.name === '🎵') {
        const guild = reaction.message.guild;
        const member = guild.members.cache.get(user.id);

        if (member) {
            const voiceChannel = member.voice.channel;
            if (voiceChannel) {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                });

                const queue = queue.get(guild.id) || { songs: [] };
                queue.songs.push({ title: reaction.message.content, url: reaction.message.url });
                queue.set(guild.id, queue);

                reaction.message.channel.send(`🎶 **Added to queue:** ${reaction.message.content}`);
            } else {
                reaction.message.channel.send('🔊 **You need to join a voice channel first!**');
            }
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const { customId } = interaction;

    if (customId === 'play_next') {
        if (!interaction.member.voice.channel) {
            return interaction.reply('🎵 **You need to join a voice channel first!**');
        }

        const voiceChannel = interaction.member.voice.channel;
        const connection = voiceChannel.guild.voiceAdapterCreator.getVoiceConnection();
        if (connection) {
            const player = connection.state.subscription.player;
            if (player) {
                const serverQueue = queue.get(interaction.guild.id);
                if (serverQueue && serverQueue.songs.length > 0) {
                    const nextSong = serverQueue.songs.shift();
                    const stream = await ytSearch.stream(nextSong.url);
                    const resource = createAudioResource(stream, { inputType: 'arbitrary', metadata: { title: nextSong.title } });
                    player.play(resource);
                    interaction.reply(`🎶 **Playing next song:** ${nextSong.title}`);
                } else {
                    interaction.reply('📜 **No more songs in the queue.**');
                }
            } else {
                interaction.reply('🔄 **No song is currently playing.**');
            }
        } else {
            interaction.reply('⚠️ **I am not connected to a voice channel.**');
        }
    }

    if (customId === 'add_to_playlist') {
        const [action, playlistName] = customId.split(':');
        const songTitle = interaction.message.content;

        if (action === 'playlist_add') {
            if (playlists.has(playlistName)) {
                const playlist = playlists.get(playlistName);
                playlist.push({ title: songTitle, url: interaction.message.url });
                playlists.set(playlistName, playlist);
                interaction.reply(`🎶 **Added "${songTitle}" to playlist "${playlistName}".**`);
            } else {
                interaction.reply('⚠️ **Playlist not found!**');
            }
        }
    }
});

client.login(process.env.TOKEN);
