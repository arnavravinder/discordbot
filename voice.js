const { Client, Intents, REST, Routes } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, getVoiceConnection } = require('@discordjs/voice');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS, 
        Intents.FLAGS.GUILD_VOICE_STATES, 
        Intents.FLAGS.GUILD_MESSAGES, 
        Intents.FLAGS.GUILD_MESSAGE_ATTACHMENTS
    ]
});

const commands = [
    {
        name: 'join',
        description: 'Join the voice channel',
    },
    {
        name: 'leave',
        description: 'Leave the voice channel',
    },
    {
        name: 'play',
        description: 'Play an uploaded MP3 file',
    }
];

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.once('ready', () => {
    console.log('Voice Command Bot is online! 🔊');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'join') {
        if (interaction.member.voice.channel) {
            const connection = joinVoiceChannel({
                channelId: interaction.member.voice.channel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator
            });
            connection.on(VoiceConnectionStatus.Ready, () => {
                interaction.reply('Joined the voice channel! 🎶');
            });
        } else {
            interaction.reply('You need to join a voice channel first! ❗');
        }
    } else if (commandName === 'leave') {
        const connection = getVoiceConnection(interaction.guild.id);
        if (connection) {
            connection.destroy();
            interaction.reply('Left the voice channel! 👋');
        } else {
            interaction.reply('I am not in a voice channel! ❌');
        }
    } else if (commandName === 'play') {
        const connection = getVoiceConnection(interaction.guild.id);
        if (connection) {
            const attachment = interaction.options.getAttachment('file');
            if (attachment && attachment.name.endsWith('.mp3')) {
                const filePath = path.join(__dirname, 'temp', `${interaction.id}.mp3`);
                const fileStream = fs.createWriteStream(filePath);
                fileStream.on('finish', () => {
                    const player = createAudioPlayer();
                    const resource = createAudioResource(filePath);
                    player.play(resource);
                    connection.subscribe(player);
                    player.on(AudioPlayerStatus.Playing, () => {
                        interaction.reply('Now playing! 🎵');
                    });
                    player.on(AudioPlayerStatus.Idle, () => {
                        player.stop();
                        fs.unlinkSync(filePath);
                    });
                });
                fileStream.on('error', (error) => {
                    console.error(error);
                    interaction.reply('There was an error processing the file! 😢');
                });
                const response = await fetch(attachment.url);
                response.body.pipe(fileStream);
            } else {
                interaction.reply('Please upload a valid MP3 file! 📁');
            }
        } else {
            interaction.reply('I am not in a voice channel! ❌');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
