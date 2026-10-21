@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Save

node scripts\save.mjs

echo.
pause
