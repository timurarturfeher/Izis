#!/bin/bash
# manage-commands.sh - Linux script to manage Discord bot commands

echo "=== Discord Bot Command Manager ==="
echo

if [ -z "$1" ]; then
  echo "Available commands:"
  echo "  ./manage-commands.sh delete-global  - Delete all global commands"
  echo "  ./manage-commands.sh delete-guild   - Delete all guild commands"
  echo "  ./manage-commands.sh force-global   - Force-register global commands"
  echo "  ./manage-commands.sh force-guild    - Force-register guild commands"
  echo
  echo "Example: ./manage-commands.sh force-guild"
  exit 0
fi

node manage-commands.js "$1"
