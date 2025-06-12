#!/bin/bash
# Linux specific setup for Discord Music Bot

echo "==== Discord Music Bot Linux Setup ===="

# Check if we're root, if not use sudo
SUDO=''
if [ "$EUID" -ne 0 ]; then
  SUDO='sudo'
  echo "This script will use sudo to install system dependencies"
fi

# Detect the Linux distribution
DISTRO=""
if [ -f /etc/os-release ]; then
  . /etc/os-release
  DISTRO=$ID
fi

echo "Detected distribution: $DISTRO"

# Install system dependencies based on distribution
case $DISTRO in
  ubuntu|debian|linuxmint)
    echo "Installing dependencies for $DISTRO..."
    $SUDO apt-get update
    $SUDO apt-get install -y python3 ffmpeg build-essential
    ;;
  fedora)
    echo "Installing dependencies for Fedora..."
    $SUDO dnf install -y python3 ffmpeg gcc make
    ;;
  arch|manjaro)
    echo "Installing dependencies for Arch-based distribution..."
    $SUDO pacman -Sy --noconfirm python ffmpeg base-devel
    ;;
  *)
    echo "Unsupported distribution. Please install these packages manually:"
    echo "- Python 3"
    echo "- ffmpeg"
    echo "- build-essential (or equivalent development tools)"
    ;;
esac

echo "System dependencies installed."
echo ""
echo "Setting up Node.js dependencies..."

# Create a fixed version of package.json
cat > package.json.linux <<EOL
{
  "name": "discord-music-bot",
  "version": "1.0.0",
  "description": "A Discord music bot with basic commands",
  "main": "main.js",
  "type": "module",
  "scripts": {
    "start": "node main.js",
    "deploy": "node deploy-commands.js"
  },
  "dependencies": {
    "discord.js": "^14.13.0",
    "@discordjs/voice": "^0.16.0",
    "ytdl-core": "^4.11.5",
    "play-dl": "^1.9.7",
    "libsodium-wrappers": "^0.7.13",
    "dotenv": "^16.3.1",
    "ffmpeg-static": "^5.2.0",
    "node-fetch": "^3.3.2"
  },
  "engines": {
    "node": ">=16.9.0"
  }
}
EOL

echo "Backing up current package.json to package.json.backup"
cp package.json package.json.backup

echo "Using Linux-compatible package.json"
cp package.json.linux package.json

echo "Installing Node.js dependencies..."
npm install --no-optional

echo ""
echo "===== Setup Complete ====="
echo "You can now start the bot with: npm start"
