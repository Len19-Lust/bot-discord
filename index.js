const { Client, GatewayIntentBits, Partials, Events }= require('discord.js');
const fetch = require('node-fetch');
const Tesseract = require('tesseract.js');
const dotenv = require('dotenv');
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const ALLIANCE_ROLE_MAPPING = {
  "Eternal Oblivion God": "O51G",
  "EternalSpirit Legion": "E51S",
  "ETERNAL BASTARDS": "E51B",
  "Eternal Gods Of War": "EGO#",
  "ETERNAL Flame": "E51F"
};

client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'verify') {
    const attachment = interaction.options.getAttachment('image');
    if (!attachment) {
      await interaction.reply({ content: '❌ No image provided!', ephemeral: true });
      return;
    }

    await interaction.reply({ content: '🔍 Processing image... Please wait.', ephemeral: true });

    try {
      const response = await fetch(attachment.url);
      const buffer = await response.arrayBuffer();

      const { data: { text } } = await Tesseract.recognize(Buffer.from(buffer), 'eng');

      const matchedAlliance = Object.keys(ALLIANCE_ROLE_MAPPING).find(name => text.includes(name));

      if (matchedAlliance) {
        const roleName = ALLIANCE_ROLE_MAPPING[matchedAlliance];
        const role = interaction.guild.roles.cache.find(r => r.name === roleName);

        if (role) {
          await interaction.member.roles.add(role);
          await interaction.editReply({
            content: `✅ Verified! You are now a member of **${matchedAlliance}** and got role **${roleName}**.`
          });
        } else {
          await interaction.editReply({ content: `⚠️ Role **${roleName}** not found in this server.` });
        }
      } else {
        await interaction.editReply({ content: '⚠️ Alliance not recognized in image.' });
      }
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: `❌ Error during verification: ${error.message}` });
    }
  }
});

client.on(Events.ClientReady, async () => {
  const data = [{
    name: 'verify',
    description: 'Upload your game profile image to verify',
    options: [{
      name: 'image',
      type: 11,
      description: 'Your profile screenshot',
      required: true
    }]
  }];

  await client.application.commands.set(data);
});

client.login(process.env.TOKEN);
