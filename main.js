import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  NoSubscriberBehavior
} from '@discordjs/voice';
import ytdl from 'ytdl-core';
import play from 'play-dl';
import dotenv from 'dotenv';
import sodium from 'libsodium-wrappers';

// Load environment variables from .env file
dotenv.config();

// Create a new Discord client
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ] 
});

// Bot configuration from environment variables
const TOKEN = process.env.TOKEN; // Your bot token
const CLIENT_ID = process.env.CLIENT_ID; // Your client ID
const GUILD_ID = process.env.GUILD_ID; // Optional: for testing in a specific server

// Music queue system
const queue = new Map();

// Register slash commands
const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song')
    .addStringOption(option => 
      option.setName('song')
        .setDescription('Song name or YouTube URL')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip current song'),
  new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playing music and clear queue'),
  new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show current song queue'),
  new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause current song'),
  new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume paused song')
];

// Convert commands to JSON
const commandsJSON = commands.map(command => command.toJSON());

// Register slash commands when bot is ready
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  
  try {
    console.log('Started refreshing slash commands...');
    
    // If GUILD_ID is provided, register commands for a specific server (faster updates during development)
    if (GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), 
        { body: commandsJSON }
      );
      console.log(`Successfully registered commands for guild ${GUILD_ID}`);
    } else {
      // Register commands globally (can take up to an hour to update)
      await rest.put(
        Routes.applicationCommands(CLIENT_ID), 
        { body: commandsJSON }
      );
      console.log('Successfully registered commands globally');
    }
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }
});

// Handle slash commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  
  const { commandName, options, guild, member, channel } = interaction;
  
  // Check if bot is in a guild
  if (!guild) {
    return interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
  }
  
  // Get or create server queue
  const serverQueue = queue.get(guild.id) || {
    textChannel: channel,
    voiceChannel: null,
    connection: null,
    player: null,
    songs: [],
    volume: 5,
    playing: false
  };
  
  // Handle different commands
  switch (commandName) {
    case 'play':
      executePlay(interaction, serverQueue, options.getString('song'));
      break;
    case 'skip':
      skipSong(interaction, serverQueue);
      break;
    case 'stop':
      stopPlaying(interaction, serverQueue);
      break;
    case 'queue':
      showQueue(interaction, serverQueue);
      break;
    case 'pause':
      pauseSong(interaction, serverQueue);
      break;
    case 'resume':
      resumeSong(interaction, serverQueue);
      break;
    default:
      interaction.reply({ content: 'Unknown command!', ephemeral: true });
  }
});

// Play command handler
async function executePlay(interaction, serverQueue, songInput) {
  // Check if user is in a voice channel
  const voiceChannel = interaction.member.voice.channel;
  if (!voiceChannel) {
    return interaction.reply({ content: 'You need to be in a voice channel to play music!', ephemeral: true });
  }
  
  // Check bot permissions
  const permissions = voiceChannel.permissionsFor(interaction.client.user);
  if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
    return interaction.reply({ content: 'I need permission to join and speak in your voice channel!', ephemeral: true });
  }
  
  try {
    // Inform user we're processing their request
    await interaction.reply(`🔍 Searching for \`${songInput}\`...`);
    
    let songInfo;
    let song;
    
    // Check if it's a YouTube URL or search query
    if (ytdl.validateURL(songInput)) {
      songInfo = await ytdl.getInfo(songInput);
      song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
      };
    } else {
      // Search YouTube for the song
      const searched = await play.search(songInput, { limit: 1 });
      if (searched.length === 0) {
        return interaction.editReply('❌ No songs found!');
      }
      
      const video = searched[0];
      song = {
        title: video.title,
        url: video.url,
      };
    }
    
    // Setup queue if it doesn't exist
    if (!serverQueue.player) {
      // Create new queue
      serverQueue.voiceChannel = voiceChannel;
      serverQueue.songs.push(song);
      serverQueue.playing = true;
      queue.set(interaction.guild.id, serverQueue);
      
      try {
        // Create voice connection
        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guild.id,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });
        serverQueue.connection = connection;
        
        // Create audio player
        const player = createAudioPlayer({
          behaviors: {
            noSubscriber: NoSubscriberBehavior.Pause,
          },
        });
        serverQueue.player = player;
        
        // Subscribe connection to player
        connection.subscribe(player);
        
        // Handle connection ready state
        connection.on(VoiceConnectionStatus.Ready, () => {
          console.log('Voice connection is ready!');
          playSong(interaction.guild, serverQueue.songs[0]);
        });
        
        // Handle disconnection
        connection.on(VoiceConnectionStatus.Disconnected, async () => {
          try {
            await Promise.race([
              entersState(connection, VoiceConnectionStatus.Signalling, 5000),
              entersState(connection, VoiceConnectionStatus.Connecting, 5000),
            ]);
          } catch (error) {
            // Destroy connection if we're definitely disconnected
            connection.destroy();
            queue.delete(interaction.guild.id);
          }
        });
        
        // Handle player state changes
        player.on(AudioPlayerStatus.Idle, () => {
          // Remove the song that just finished
          serverQueue.songs.shift();
          
          // Play next song or leave if queue is empty
          if (serverQueue.songs.length > 0) {
            playSong(interaction.guild, serverQueue.songs[0]);
          } else {
            // Leave voice channel after 5 minutes of inactivity
            setTimeout(() => {
              if (serverQueue.songs.length === 0) {
                serverQueue.connection.destroy();
                queue.delete(interaction.guild.id);
              }
            }, 300000);
          }
        });
        
        // Handle errors
        player.on('error', error => {
          console.error('Audio player error:', error);
          serverQueue.textChannel.send(`❌ Error playing song: ${error.message}`);
          // Skip to next song
          serverQueue.songs.shift();
          if (serverQueue.songs.length > 0) {
            playSong(interaction.guild, serverQueue.songs[0]);
          }
        });
        
        await interaction.editReply(`🎵 Added to queue: **${song.title}**`);
      } catch (error) {
        console.error('Error creating voice connection:', error);
        queue.delete(interaction.guild.id);
        return interaction.editReply(`❌ Error connecting to voice channel: ${error.message}`);
      }
    } else {
      // Just add song to queue
      serverQueue.songs.push(song);
      return interaction.editReply(`✅ Added to queue: **${song.title}**`);
    }
  } catch (error) {
    console.error('Error in play command:', error);
    return interaction.editReply(`❌ Error: ${error.message}`);
  }
}

// Function to play a song
async function playSong(guild, song) {
  const serverQueue = queue.get(guild.id);
  
  if (!song) {
    serverQueue.playing = false;
    return;
  }
  
  try {
    // Make sure sodium is ready before creating audio resources
    await sodium.ready;
    
    // Get audio stream
    const stream = await play.stream(song.url);
    
    // Create audio resource
    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
      inlineVolume: true
    });
    
    // Set volume
    if (resource.volume) {
      resource.volume.setVolume(serverQueue.volume / 10);
    }
    
    // Play the song
    serverQueue.player.play(resource);
    serverQueue.playing = true;
    
    // Notify channel
    serverQueue.textChannel.send(`🎵 Now playing: **${song.title}**`);
  } catch (error) {
    console.error('Error creating audio resource:', error);
    serverQueue.textChannel.send(`❌ Error playing song: ${error.message}`);
    
    // Skip to next song
    serverQueue.songs.shift();
    if (serverQueue.songs.length > 0) {
      playSong(guild, serverQueue.songs[0]);
    }
  }
}

// Skip command handler
function skipSong(interaction, serverQueue) {
  if (!interaction.member.voice.channel) {
    return interaction.reply({ content: 'You need to be in a voice channel to skip songs!', ephemeral: true });
  }
  
  if (!serverQueue || !serverQueue.songs.length) {
    return interaction.reply({ content: 'There are no songs to skip!', ephemeral: true });
  }
  
  // Stop current song, the idle event will trigger next song
  serverQueue.player.stop();
  interaction.reply('⏭️ Skipped the current song!');
}

// Stop command handler
function stopPlaying(interaction, serverQueue) {
  if (!interaction.member.voice.channel) {
    return interaction.reply({ content: 'You need to be in a voice channel to stop the music!', ephemeral: true });
  }
  
  if (!serverQueue) {
    return interaction.reply({ content: 'There are no songs playing!', ephemeral: true });
  }
  
  // Clear queue and stop playing
  serverQueue.songs = [];
  serverQueue.player.stop();
  interaction.reply('⏹️ Music playback stopped and queue cleared!');
}

// Show queue command handler
function showQueue(interaction, serverQueue) {
  if (!serverQueue || !serverQueue.songs.length) {
    return interaction.reply({ content: 'The queue is empty!', ephemeral: true });
  }
  
  const queueList = serverQueue.songs.map((song, index) => {
    return `${index + 1}. **${song.title}**`;
  }).join('\n');
  
  interaction.reply({
    content: `📜 **Song Queue**\nNow playing: **${serverQueue.songs[0].title}**\n\n${queueList}`,
    ephemeral: false
  });
}

// Pause command handler
function pauseSong(interaction, serverQueue) {
  if (!interaction.member.voice.channel) {
    return interaction.reply({ content: 'You need to be in a voice channel to pause music!', ephemeral: true });
  }
  
  if (!serverQueue || !serverQueue.playing) {
    return interaction.reply({ content: 'There is no song playing!', ephemeral: true });
  }
  
  serverQueue.player.pause();
  serverQueue.playing = false;
  interaction.reply('⏸️ Paused the current song!');
}

// Resume command handler
function resumeSong(interaction, serverQueue) {
  if (!interaction.member.voice.channel) {
    return interaction.reply({ content: 'You need to be in a voice channel to resume music!', ephemeral: true });
  }
  
  if (!serverQueue || serverQueue.playing) {
    return interaction.reply({ content: 'The song is not paused!', ephemeral: true });
  }
  
  serverQueue.player.unpause();
  serverQueue.playing = true;
  interaction.reply('▶️ Resumed the current song!');
}

// Login to Discord
(async () => {
  try {
    // Make sure sodium is ready before connecting
    await sodium.ready;
    console.log('Sodium initialized');
    
    await client.login(TOKEN);
    console.log('Discord bot initialized');
  } catch (error) {
    console.error('Error during initialization:', error);
  }
})();