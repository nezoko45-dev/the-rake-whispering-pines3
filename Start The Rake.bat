@echo off
title The Rake Server
cd /d "%~dp0"
if not exist "TheRakeServer.exe" (
  echo TheRakeServer.exe was not found.
  echo Build/download the server package first.
  pause
  exit /b 1
)
start "" "TheRakeServer.exe"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8080/"
