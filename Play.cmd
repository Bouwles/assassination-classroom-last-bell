@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is needed to start the local game. Install Node.js 22 or newer, then try again.
  pause
  exit /b 1
)
node server.mjs
if errorlevel 1 pause
