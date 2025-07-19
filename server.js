require('dotenv').config();
const { Client, GatewayIntentBits, MessageEmbed } = require('discord.js');
const axios = require('axios');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const TRACKER_API_KEY = process.env.TRACKER_API_KEY;
const TRACKER_ENDPOINT = 'https://public-api.tracker.gg/v2/fortnite/standard/profile';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

async function getFortniteStats(platform, username) {
  try {
    const response = await axios.get(
      `${TRACKER_ENDPOINT}/${platform}/${encodeURIComponent(username)}`,
      { headers: { 'TRN-Api-Key': TRACKER_API_KEY } }
    );
    return response.data;
  } catch (err) {
    console.error('Tracker API error:', err.response?.data || err.message);
    throw new Error('Unable to fetch Fortnite stats. Check username and platform.');
  }
}

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith('!fortnite ')) return;

  const args = msg.content.split(' ');
  const platform = args[1]; // epic / xbl / psn
  const username = args.slice(2).join(' ');

  if (!platform || !username) {
    return msg.reply('Usage: `!fortnite <platform> <username>` (platform = epic/xbl/psn)');
  }

  try {
    const data = await getFortniteStats(platform, username);
    const stats = data.data.segments.find(s => s.type === 'all');

    const embed = new MessageEmbed()
      .setColor('#00ffcc')
      .setAuthor({ 
        name: `${username}'s Fortnite Stats`,
        iconURL: 'https://cdn.tracker.gg/fortnite/images/fortnite.png',
        url: `https://fortnitetracker.com/profile/${platform}/${encodeURIComponent(username)}`
      })
      .addFields(
        { name: '🏆 Wins', value: stats.stats.wins.displayValue, inline: true },
        { name: '🎮 Matches', value: stats.stats.matchesPlayed.displayValue, inline: true },
        { name: '📊 Win %', value: stats.stats.winRatio.displayValue, inline: true },
        { name: '💀 Kills', value: stats.stats.kills.displayValue, inline: true },
        { name: '⚔️ K/D', value: stats.stats.kd.displayValue, inline: true },
        { name: '⭐ Score', value: stats.stats.score.displayValue, inline: true }
      )
      .setThumbnail('https://cdn.tracker.gg/fortnite/images/fortnite.png')
      .setFooter({ text: 'Stats powered by tracker.gg', iconURL: 'https://cdn.tracker.gg/fortnite/images/fortnite.png' })
      .setTimestamp();

    msg.reply({ embeds: [embed] });

  } catch (e) {
    msg.reply(`⚠️ ${e.message}`);
  }
});

client.login(DISCORD_TOKEN);
