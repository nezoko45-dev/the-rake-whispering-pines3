# Rake GLB animation slot

Place the skinned Rake model here as:

`assets/rake/rake.glb`

The game now loads this GLB automatically and uses Three.js `AnimationMixer`.

## Animation clip names

Use these names in Blender (or your animation tool):

- `Idle`
- `Walk`
- `Chase` (aliases: `Run`, `Running`, `Sprint`)
- `Attack`
- `Parry` (aliases: `Stun`, `Stunned`, `Hit`)

The loader also accepts names with spaces or punctuation, such as `Rake Attack`.

Attack and parry play once and clamp at the end. Idle, walk, and chase loop. Walk/chase playback speed is automatically adjusted to the AI movement speed.

If `rake.glb` is not present, the game keeps its existing procedural Rake animation so the game still runs. Once the GLB is added, the mixer takes over automatically.