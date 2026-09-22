@echo off
REM Invoice Generator launcher
REM Runs the server hidden in the background - no window stays open.
cd /d "%~dp0"
echo Starting Invoice Server...
if not exist "node_modules" goto install
goto check
:install
echo Installing dependencies - first run only...
call npm install --no-audit --no-fund
:check
netstat -aon | findstr :3000 | findstr LISTENING >nul
if %errorlevel%==0 goto already
powershell -NoProfile -Command "Start-Process node -ArgumentList 'server.js' -WorkingDirectory '%~dp0' -WindowStyle Hidden"
echo Done. Server is running in the background. The browser opens automatically.
echo Use stop.bat to stop the server.
timeout /t 3 >nul
goto end
:already
echo Server is already running. Opening it in the browser...
start http://localhost:3000
:end
