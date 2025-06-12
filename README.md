# Discord Music Bot Setup Guide

This Discord music bot allows users to play music in voice channels using slash commands.

## Prerequisites
- Node.js v16.9.0 or higher
- npm (comes with Node.js)
- Discord bot token from the Discord Developer Portal
- Server with appropriate permissions

## Installation

### Windows
1. Run the setup script:
```
setup.cmd
```

2. Configure your bot by editing the `.env` file with:
   - `TOKEN` - Your Discord bot token
   - `CLIENT_ID` - Your Discord application's client ID
   - `GUILD_ID` - (Optional) Your Discord server ID for testing

3. Start the bot:
```
node main.js
```

### Linux/macOS
1. Run the setup script:
```
chmod +x setup.sh
./setup.sh
```

2. Configure your bot by editing the `.env` file with:
   - `TOKEN` - Your Discord bot token
   - `CLIENT_ID` - Your Discord application's client ID
   - `GUILD_ID` - (Optional) Your Discord server ID for testing

3. Start the bot:
```
node main.js
```

## Commands

The bot supports the following slash commands:
- `/play <song>` - Play a song by name or YouTube URL
- `/skip` - Skip the current song
- `/stop` - Stop playing and clear the queue
- `/queue` - Show the current song queue
- `/pause` - Pause the current song
- `/resume` - Resume a paused song

## Troubleshooting

- Make sure your bot has the necessary permissions in your Discord server
- For voice connection issues, ensure you have the required dependencies:
  - On Windows: The setup script should handle dependencies
  - On Linux: If the setup script fails, manually install these packages:
    ```
    sudo apt install python3 build-essential ffmpeg
    ```
    (Adjust for your Linux distribution)
    
- If you see errors related to sodium or voice connections:
  1. Try installing with `npm install --no-optional`
  2. Make sure ffmpeg is installed on your system
  3. Check that your bot has permissions to join voice channels

## Additional Notes

- The bot will leave the voice channel after 5 minutes of inactivity
- Songs are queued in the order they are requested
- The bot supports both YouTube URLs and search queries
