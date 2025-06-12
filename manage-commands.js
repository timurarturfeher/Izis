import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Bot configuration from environment variables
const TOKEN = process.env.TOKEN; 
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// Create REST instance
const rest = new REST({ version: '10' }).setToken(TOKEN);

// Command handler function
async function handleCommands(action) {
  try {
    switch (action) {
      case 'delete-global':
        console.log('Deleting all global commands...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
        console.log('Successfully deleted all global commands');
        break;
        
      case 'delete-guild':
        if (!GUILD_ID) {
          console.error('Error: GUILD_ID is required for deleting guild commands');
          process.exit(1);
        }
        console.log(`Deleting all commands for guild ${GUILD_ID}...`);
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
        console.log(`Successfully deleted all commands for guild ${GUILD_ID}`);
        break;
        
      case 'force-global':
        console.log('Force-registering global commands from main.js...');
        // We need to dynamically import main.js to get the commands
        const mainModule = await import('./main.js');
        if (!mainModule.commandsJSON) {
          console.error('Error: Commands not found in main.js');
          process.exit(1);
        }
        
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: mainModule.commandsJSON });
        console.log('Successfully force-registered all global commands');
        break;
        
      case 'force-guild':
        if (!GUILD_ID) {
          console.error('Error: GUILD_ID is required for registering guild commands');
          process.exit(1);
        }
        
        console.log(`Force-registering commands for guild ${GUILD_ID}...`);
        // We need to dynamically import main.js to get the commands
        const guildMainModule = await import('./main.js');
        if (!guildMainModule.commandsJSON) {
          console.error('Error: Commands not found in main.js');
          process.exit(1);
        }
        
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: guildMainModule.commandsJSON });
        console.log(`Successfully force-registered all commands for guild ${GUILD_ID}`);
        break;
        
      default:
        console.log('Available commands:');
        console.log('  node manage-commands.js delete-global - Delete all global commands');
        console.log('  node manage-commands.js delete-guild - Delete all guild commands');
        console.log('  node manage-commands.js force-global - Force-register global commands');
        console.log('  node manage-commands.js force-guild - Force-register guild commands');
        break;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Get action from command line arguments
const action = process.argv[2];
handleCommands(action);
