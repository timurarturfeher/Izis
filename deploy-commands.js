// deploy-commands.js - Script to deploy slash commands

import { REST } from 'discord.js';
import { Routes } from 'discord-api-types/v10';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const commands = [
  {
    name: 'play',
    description: 'Play a song',
    options: [
      {
        name: 'song',
        description: 'Song name or YouTube URL',
        type: 3, // STRING type
        required: true,
      },
    ],
  },
  {
    name: 'skip',
    description: 'Skip current song',
  },
  {
    name: 'stop',
    description: 'Stop playing music and clear queue',
  },
  {
    name: 'queue',
    description: 'Show current song queue',
  },
  {
    name: 'pause',
    description: 'Pause current song',
  },
  {
    name: 'resume',
    description: 'Resume paused song',
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Started refreshing application slash commands...');

    // The route depends on whether you want to register commands globally or for a specific guild
    const route = process.env.GUILD_ID
      ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
      : Routes.applicationCommands(process.env.CLIENT_ID);

    await rest.put(route, { body: commands });

    console.log('Successfully reloaded application slash commands.');
  } catch (error) {
    console.error(error);
  }
})();
