@echo off
REM Stop Invoice Server
echo Stopping Node server on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul
echo Done.
pause
