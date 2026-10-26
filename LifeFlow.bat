@echo off
title LifeFlow - Personal Life OS
echo Dang khoi dong LifeFlow Personal Life OS...
cd /d "%~dp0"
start http://localhost:5173
npm run dev
pause
