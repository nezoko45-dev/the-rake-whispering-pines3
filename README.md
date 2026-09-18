# The Rake — Whispering Pines

Fresh multiplayer Three.js Rake game.

- Existing Rake GLB is preserved at assets/rake/rake.glb.
- THREE.AnimationMixer uses the animations embedded in that GLB.
- Animation names are detected for attack, parry/block, walk, run/chase and idle.
- Real players share the world through the WebSocket backend.
- Every player has a stunstick.
- Normal stunstick hit: 45 Rake damage and 2.5 seconds of stun.
- A charged attack can be parried when the attacker is looking directly at the Rake.
- Rake stalking/searching speed: 7.
- Rake chase speed inside 45 studs: 19.
- Backend owns multiplayer player state, Rake health, combat and Rake movement.
- The browser is the game UI and the Windows EXE is built by GitHub Actions.

Controls: WASD move, mouse look, Shift charge, left click stunstick.
