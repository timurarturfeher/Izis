#!/bin/bash
# setup.sh - Script to prepare environment for the Discord bot

echo "=== Discord Music Bot Setup ==="
echo "Installing required system dependencies..."

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
fi

# Install dependencies based on OS
case $OS in
    "Ubuntu" | "Debian GNU/Linux")
        echo "Detected $OS"
        sudo apt update
        sudo apt install -y python3 build-essential ffmpeg
        ;;
    "Fedora" | "CentOS Linux")
        echo "Detected $OS"
        sudo dnf install -y python3 gcc-c++ make ffmpeg
        ;;
    "Arch Linux")
        echo "Detected $OS"
        sudo pacman -Sy --noconfirm python3 base-devel ffmpeg
        ;;
    *)
        echo "Unknown OS: $OS"
        echo "Please install the following packages manually:"
        echo "- Python 3"
        echo "- Build tools (gcc, make, etc.)"
        echo "- ffmpeg"
        ;;
esac

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install --no-optional

echo "Setup complete!"
echo "Run 'node main.js' to start the bot."
