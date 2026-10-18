@echo off
setlocal
cd /d "%~dp0"
if not exist node_modules\express echo Dependencies are not installed. Run npm install first.
if not exist node_modules\express pause & exit /b 1
start "Rake Three Server" cmd /k "node server.js"
timeout /t 2 /nobreak >nul
start "" http://localhost:8080
