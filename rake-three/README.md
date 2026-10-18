# Rake Three — standalone app

This is a self-contained Three.js version of the Rake game, added without replacing the existing root game.

## Run locally
1. Install Node.js 18 or newer.
2. Open this folder in a terminal.
3. Run `npm install` then `npm start`.
4. Open http://localhost:8080.

On Windows, double-click `Run-Rake-Three.bat` after installing dependencies.

## Build the Windows server EXE
Double-click `BUILD-EXE.bat`, or run `npm install` followed by `npm run build:exe`. The build creates `RakeThreeServer.exe`. Keep `index.html` beside the EXE and run it; then visit http://localhost:8080. The EXE is the local web server, while the game renders in the browser.

## Features
- Three.js forest scene, third-person movement and horror HUD.
- Solo, AI squad and WebSocket multiplayer modes.
- GLB/GLTF import with embedded clips, `AnimationMixer`, auto-detected walk/attack/idle/stun clips and manual clip mapping.
- Imported models are normalized by bounding box and attached under a grounded character root to prevent floating.
- A* grid pathfinding for the local Rake AI; AI squad behavior in AI mode.
- WebSocket server shares player transforms and basic Rake combat state.

The multiplayer mode requires the EXE/server to be running on the host. Other players must connect to the host machine's reachable address and port 8080; firewall/router rules may be needed. Three.js and its addons load from jsDelivr, so an internet connection is needed in the browser. This is a starter implementation; server-side authoritative AI combat and remote-client interpolation can be expanded further.
