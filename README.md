# Discord Music Bot Setup Guide

This Discord music bot allows users to play music in voice channels using slash commands.

## Prerequisites
- Node.js v16.9.0 or higher
- npm (comes with Node.js)
- Discord bot token from the Discord Developer Portal
- Server with appropriate permissions

## Installation

1. Install dependencies:
```
npm install
```

2. Configure your bot:
   - Edit `main.js` and replace the placeholder values:
     - `YOUR_DISCORD_BOT_TOKEN` - Your Discord bot token
     - `YOUR_CLIENT_ID` - Your Discord application's client ID
     - `YOUR_GUILD_ID` - (Optional) Your Discord server ID for testing

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
  - On Windows: ffmpeg may need to be installed separately
  - On Linux: additional packages may be required (libtool, build-essential, etc.)

## Additional Notes

- The bot will leave the voice channel after 5 minutes of inactivity
- Songs are queued in the order they are requested
- The bot supports both YouTube URLs and search queries
