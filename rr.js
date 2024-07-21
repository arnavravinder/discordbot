const { Client, Intents, REST, Routes, MessageActionRow, MessageButton } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MEMBERS
    ]
});

const commands = [
    {
        name: 'createrolemessage',
        description: 'Create a role assignment message',
        options: [
            {
                name: 'title',
                type: 'STRING',
                description: 'The title of the role assignment message',
                required: true
            },
            {
                name: 'role1',
                type: 'ROLE',
                description: 'The first role to assign',
                required: true
            },
            {
                name: 'role2',
                type: 'ROLE',
                description: 'The second role to assign',
                required: false
            },
            {
                name: 'role3',
                type: 'ROLE',
                description: 'The third role to assign',
                required: false
            }
        ]
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
    console.log('Reaction Role Bot is online! 🔘');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'createrolemessage') {
        const title = options.getString('title');
        const role1 = options.getRole('role1');
        const role2 = options.getRole('role2');
        const role3 = options.getRole('role3');

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(`role_${role1.id}`)
                    .setLabel(role1.name)
                    .setStyle('PRIMARY'),
            );

        if (role2) {
            row.addComponents(
                new MessageButton()
                    .setCustomId(`role_${role2.id}`)
                    .setLabel(role2.name)
                    .setStyle('PRIMARY'),
            );
        }

        if (role3) {
            row.addComponents(
                new MessageButton()
                    .setCustomId(`role_${role3.id}`)
                    .setLabel(role3.name)
                    .setStyle('PRIMARY'),
            );
        }

        await interaction.reply({ content: title, components: [row] });
    } else if (interaction.isButton()) {
        const roleId = interaction.customId.split('_')[1];
        const role = interaction.guild.roles.cache.get(roleId);
        if (role) {
            const member = interaction.guild.members.cache.get(interaction.user.id);
            if (member.roles.cache.has(roleId)) {
                await member.roles.remove(role);
                await interaction.reply({ content: `Removed role ${role.name} from you.`, ephemeral: true });
            } else {
                await member.roles.add(role);
                await interaction.reply({ content: `Assigned role ${role.name} to you.`, ephemeral: true });
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
