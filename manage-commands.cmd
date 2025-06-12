@echo off
:: manage-commands.cmd - Windows script to manage Discord bot commands

echo === Discord Bot Command Manager ===
echo.

IF "%1"=="" (
  echo Available commands:
  echo   manage-commands.cmd delete-global  - Delete all global commands
  echo   manage-commands.cmd delete-guild   - Delete all guild commands
  echo   manage-commands.cmd force-global   - Force-register global commands
  echo   manage-commands.cmd force-guild    - Force-register guild commands
  echo.
  echo Example: manage-commands.cmd force-guild
  goto :EOF
)

node manage-commands.js %1
pause
