@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || (echo Install Node.js 18 first: https://nodejs.org/ & pause & exit /b 1)
call npm install
if errorlevel 1 pause & exit /b 1
call npx pkg server.js --targets node18-win-x64 --output RakeThreeServer.exe
if errorlevel 1 pause & exit /b 1
echo.
echo Built RakeThreeServer.exe. Keep index.html beside the EXE, then double-click the EXE and open http://localhost:8080
pause
