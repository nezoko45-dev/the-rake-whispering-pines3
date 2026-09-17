import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class RakeAnimationController {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.url = options.url || 'assets/rake/rake.glb';
    this.root = null;
    this.mixer = null;
    this.actions = new Map();
    this.current = null;
    this.ready = false;
    this.loader = new GLTFLoader();
  }

  async load() {
    try {
      const gltf = await this.loader.loadAsync(this.url);
      if (!gltf || !gltf.scene) throw new Error('Rake GLB contains no scene');

      this.root = gltf.scene;
      this.root.visible = false;
      this.root.traverse((o) => {
        if (o.isMesh) {
          // Keep the imported character lightweight enough for browser GPUs.
          o.castShadow = false;
          o.receiveShadow = false;
          o.frustumCulled = true;
        }
      });

      this.mixer = new THREE.AnimationMixer(this.root);
      for (const clip of gltf.animations || []) {
        if (!clip || !clip.name) continue;
        const key = clip.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (key) this.actions.set(key, this.mixer.clipAction(clip));
      }

      this.ready = true;
      this.setState('idle', true);
      return this.root;
    } catch (error) {
      console.warn('[Rake] GLB load failed; using procedural fallback.', error);
      this.ready = false;
      this.root = null;
      this.mixer = null;
      this.actions.clear();
      return null;
    }
  }

  findAction(state) {
    const aliases = {
      idle: ['idle', 'breathing', 'stand', 'standing', 'walk', 'walking'],
      walk: ['walk', 'walking', 'idle', 'standing'],
      chase: ['chase', 'run', 'running', 'sprint', 'walk', 'walking'],
      attack: ['attack', 'attacking', 'slash', 'claw'],
      parry: ['parry', 'parried', 'stun', 'stunned', 'hit']
    };
    for (const name of aliases[state] || []) {
      const key = name.replace(/[^a-z0-9]/g, '');
      if (this.actions.has(key)) return this.actions.get(key);
    }
    return null;
  }

  setState(state, immediate = false) {
    if (!this.ready || !this.mixer) return;
    if (state === 'stun') state = 'parry';
    if (this.current === state && !immediate) return;

    const next = this.findAction(state);
    if (!next) return;

    if (this.current) {
      const previous = this.findAction(this.current);
      if (previous && previous !== next) previous.fadeOut(immediate ? 0 : 0.12);
    }

    next.reset().fadeIn(immediate ? 0 : 0.12).play();
    this.current = state;

    if (state === 'attack' || state === 'parry') {
      next.setLoop(THREE.LoopOnce, 1);
      next.clampWhenFinished = true;
    } else {
      next.setLoop(THREE.LoopRepeat, Infinity);
      next.clampWhenFinished = false;
    }
  }

  update(dt, state, movementSpeed = 0) {
    if (!this.ready || !this.mixer) return;
    this.setState(state);
    const action = this.findAction(this.current);
    if (action && (this.current === 'walk' || this.current === 'chase')) {
      const base = this.current === 'chase' ? 19 : 7;
      action.timeScale = THREE.MathUtils.clamp(movementSpeed / base, 0.75, 1.35);
    }
    this.mixer.update(Math.min(dt, 0.05));
  }

  attachToAI(root) {
    if (!this.ready || !this.root) return false;

    // Hide the procedural meshes first, but leave the root itself active for AI/collision.
    root.traverse((o) => {
      if (o.isMesh) o.visible = false;
    });

    this.root.position.set(0, 0, 0);
    this.root.visible = true;
    root.add(this.root);
    return true;
  }
}

export { THREE };