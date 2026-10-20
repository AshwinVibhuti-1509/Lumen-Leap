import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { measureFootprint } from './collision.js';
import { createPlayable } from './Characters.js';
import { isInsideArena, clampToArena } from './lumenRules.js';

const MOVEMENT_SPEED = 2;   // Jump progress per second (a hop lasts about 0.5 s).
const JUMP_HEIGHT = 30;
const JUMP_DISTANCE = 50;
const ATTACK_COOLDOWN = 1; // seconds

const DIRECTIONS = {
  ArrowUp: { x: 0, y: 1, rotation: 0 },
  ArrowDown: { x: 0, y: -1, rotation: Math.PI },
  ArrowLeft: { x: -1, y: 0, rotation: Math.PI / 2 },
  ArrowRight: { x: 1, y: 0, rotation: -Math.PI / 2 },
};

export default class Player extends THREE.Group {
  constructor() {
    super();
    this.model = null;
    this.visualPivot = new THREE.Group(); // Rotate visuals, never the camera's parent.
    this.add(this.visualPivot);
    this.inputQueue = [];
    this.heldDirection = null;
    this.movement = { direction: null, progress: 0, isComplete: true };
    this.collisionRadius = 18; // Safe until the GLB has loaded.
    this.baseCollisionRadius = 18;
    this.elapsedTime = 0;
    this.lastAttackTime = -ATTACK_COOLDOWN;
    this.movementSpeed = MOVEMENT_SPEED;
    this.jumpHeight=JUMP_HEIGHT;
    this.attackCooldown = ATTACK_COOLDOWN;
    this.onAttack = null;
    this.isBlocked = false;
    this.enabled = true;
    this.alternateModel = null;
    this.currentCharacter = 'classic';
    this.frogSkin = 'classic';

    window.addEventListener('keydown', (event) => {
      if (!this.enabled) return;

      const direction = DIRECTIONS[event.code];
      if (direction) {
        event.preventDefault();
        this.heldDirection = event.code;
        // Keep taps queued. Holding an arrow continuously hops without flooding the queue.
        if (!event.repeat && this.inputQueue.length < 8) this.inputQueue.push(direction);
        return;
      }
      if (event.code === 'Space') {
        event.preventDefault();
        if (!event.repeat && this.elapsedTime - this.lastAttackTime >= this.attackCooldown) {
          this.lastAttackTime = this.elapsedTime;
          this.onAttack?.();
        }
      }
    });
    window.addEventListener('keyup', (event) => {
      if (event.code === this.heldDirection) this.heldDirection = null;
    });
    window.addEventListener('blur', () => { this.heldDirection = null; });

    new GLTFLoader().load(
        '/models/tode.glb',
        ({ scene: model }) => {
          model.rotation.x = Math.PI / 2;
          model.scale.setScalar(20);
          model.traverse((object) => {
            if (object.isMesh) {
              object.castShadow = true;
              object.receiveShadow = true;
            }
          });
          this.visualPivot.add(model);
          // Orient and measure geometry before aligning its center and feet.
          this.visualPivot.updateWorldMatrix(true, true);
          const footprint = measureFootprint(model, this.visualPivot, {
            minRadius: 8, maxRadius: 18,
          });
          model.position.x -= footprint.centerX;
          model.position.y -= footprint.centerY;
          this.visualPivot.updateWorldMatrix(true, true);
          const bounds = new THREE.Box3().setFromObject(model);
          model.position.z -= bounds.min.z;
          this.baseCollisionRadius = footprint.radius;
          this.collisionRadius = footprint.radius;
          this.model = model;
          this.applyAppearance(this.currentCharacter,this.frogSkin);
          console.info(`Tode loaded. Collision radius: ${this.collisionRadius.toFixed(1)}`);
        },
        undefined,
        (error) => {
          console.error('Cannot load public/models/tode.glb; using a temporary green player marker:', error);
          const fallback = new THREE.Mesh(
              new THREE.ConeGeometry(12, 25, 12),
              new THREE.MeshLambertMaterial({ color: 0x268d56 }),
          );
          // Three.js cones point along Y; make the tip point upwards along Z.
          fallback.rotation.x = Math.PI / 2;
          fallback.position.z = 13;
          this.visualPivot.add(fallback);
          this.collisionRadius = 12;
          this.model = fallback;
        },
    );
  }

  applyAppearance(characterId='classic', skinId='classic', tint=0x38c777) {
    this.currentCharacter=characterId;
    this.frogSkin=skinId;
    this.collisionRadius=characterId==='spider'?26:characterId==='dragonfly'?23:this.baseCollisionRadius;
    if(this.alternateModel){this.visualPivot.remove(this.alternateModel);this.alternateModel=null;}
    if(this.model){
      this.model.visible=characterId==='classic';
      this.model.traverse(object=>{
        if(!object.isMesh)return;
        if(!object.userData.baseMaterials){
          object.userData.baseMaterials=(Array.isArray(object.material)?object.material:[object.material]).map(m=>m?.clone());
        }
        const recolor=(mat)=>{
          if(!mat)return mat;
          const copy=mat.clone();
          if(skinId!=='classic'&&copy.color){
            const intensity=copy.color.r+copy.color.g+copy.color.b;
            if(intensity>0.15&&copy.color.g>=copy.color.r*0.7)copy.color.lerp(new THREE.Color(tint),0.72);
          }
          return copy;
        };
        const bases=object.userData.baseMaterials;
        object.material=Array.isArray(object.material)?bases.map(recolor):recolor(bases[0]);
      });
    }
    if(characterId!=='classic'){
      this.alternateModel=createPlayable(characterId);
      this.visualPivot.add(this.alternateModel);
    }
  }

  update(deltaTime, isPositionClear) {
    if (!this.enabled) return;

    this.elapsedTime += deltaTime;
    // Enforce the same collision boundary for Classic Tode, Orange Toad,
    // Spider, and Dragonfly. This also recovers an old save/hot-reload if
    // the character was already outside when the fence was introduced.
    const safe = clampToArena(this.position.x, this.position.y, this.collisionRadius);
    this.position.x = safe.x;
    this.position.y = safe.y;
    if (!this.model) return;

    if (this.movement.isComplete) {
      const nextDirection = this.inputQueue.shift() ??
          (this.heldDirection ? DIRECTIONS[this.heldDirection] : null);
      if (nextDirection) {
        this.movement = { direction: nextDirection, progress: 0, isComplete: false };
        this.visualPivot.rotation.z = nextDirection.rotation;
        this.isBlocked = false;
      }
    }
    if (this.movement.isComplete) return;

    const oldProgress = this.movement.progress;
    const rawProgress = oldProgress + deltaTime * this.movementSpeed;
    const progress = rawProgress >= 1 - 1e-9 ? 1 : rawProgress;
    const { direction } = this.movement;
    const step = (progress - oldProgress) * JUMP_DISTANCE;
    const nextX = this.position.x + direction.x * step;
    const nextY = this.position.y + direction.y * step;

    // Only apply movement after the new XY position has passed collision checks.
    if (!isInsideArena(nextX, nextY, this.collisionRadius) ||
        !isPositionClear(nextX, nextY)) {
      this.isBlocked = true;
      this.movement.isComplete = true;
      this.position.z = 0;
      return;
    }

    this.movement.progress = progress;
    this.position.x = nextX;
    this.position.y = nextY;
    this.position.z = Math.sin(progress * Math.PI) * this.jumpHeight;
    if (progress === 1) {
      this.position.z = 0;
      this.movement.isComplete = true;
    }
  }

  reset() {
    this.position.set(0, 0, 0);
    this.inputQueue.length = 0;
    this.heldDirection = null;
    this.movement = { direction: null, progress: 0, isComplete: true };
    this.visualPivot.rotation.z = 0;
    this.elapsedTime = 0;
    this.lastAttackTime = -ATTACK_COOLDOWN;
    this.movementSpeed = MOVEMENT_SPEED;
    this.jumpHeight=JUMP_HEIGHT;
    this.attackCooldown = ATTACK_COOLDOWN;
    this.isBlocked = false;
    this.enabled = true;
    if (this.model) this.model.visible = true;
    this.visible = true;
  }
}
