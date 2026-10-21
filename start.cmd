@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Blog Preview

if not exist "node_modules" (
  echo First run: installing dependencies, this takes a few minutes...
  call npm install
)

echo.
echo   Starting local preview...
echo   Your browser will open automatically.
echo.
echo   Phone access: find the "Network:" line below, open that URL
echo   on your phone (same Wi-Fi required).
echo.
echo   Keep this window open while writing. Close it to stop.
echo.

call npm run dev -- --host 0.0.0.0 --port 4321 --open
pause
