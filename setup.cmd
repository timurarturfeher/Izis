@echo off
:: setup.cmd - Script to prepare environment for the Discord bot on Windows

echo === Discord Music Bot Setup ===
echo Installing Node.js dependencies...

:: Install dependencies without optional ones that might cause issues
npm install --no-optional

echo.
echo Setup complete!
echo Run 'node main.js' to start the bot.
pause
