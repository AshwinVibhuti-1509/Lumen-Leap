import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { measureFootprint, circlesOverlap } from './collision.js';
import { pursuitStep, findObstaclePath, isStaticClear } from './navigation.js';
import { isInsideArena, clampToArena } from './lumenRules.js';

const DEFAULT_ENEMY_SPEED = 22;
const TARGET_MODEL_SIZE = 66; // Visible body + wings; collision footprint below matches this size.
const ABOVE_GROUND = 2;
const DEFAULT_COLLISION_RADIUS = 22;

export default class Enemy extends THREE.Group {
  constructor(x, y, variant = 'bee') {
    super();
    this.position.set(x, y, 0);
    this.movementSpeed = DEFAULT_ENEMY_SPEED;
    this.collisionRadius = DEFAULT_COLLISION_RADIUS;
    this.model = null;
    this.detour = [];
    this.variant = ['bee','stinger','armored'].includes(variant) ? variant : 'bee';
    this.hitPoints = this.variant === 'armored' ? 2 : 1;
    // Elite bee types are distinguished by a visible ground aura and speed,
    // without needing new copyrighted or unverified 3D assets.
    if(this.variant!=='bee'){
      const marker=new THREE.Mesh(new THREE.RingGeometry(22,27,32),
        new THREE.MeshBasicMaterial({color:this.variant==='stinger'?0xff697a:0x80d5ff,
          transparent:true,opacity:.76,side:THREE.DoubleSide,depthWrite:false}));
      marker.position.z=1.7;
      this.add(marker);
    }

    // The group translates in world XY. ONLY the visual pivot rotates.
    this.visualPivot = new THREE.Group();
    this.add(this.visualPivot);

    // Remain visible if loading fails. Keep this INSIDE visualPivot so it
    // faces the same direction as the actual model.
    this.placeholder = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(17, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xe63657 }),
    );
    body.position.z = 17;
    this.placeholder.add(body);
    const cap = new THREE.Mesh(
      new THREE.ConeGeometry(8, 12, 6),
      new THREE.MeshBasicMaterial({ color: 0x69213a }),
    );
    cap.rotation.x = Math.PI / 2;
    cap.position.z = 34;
    this.placeholder.add(cap);
    this.visualPivot.add(this.placeholder);
    this.model = this.placeholder;

    new GLTFLoader().load(
      '/models/enemy.glb',
      ({ scene: bee }) => {
        if (!this.parent) return; // Removed enemy; ignore late async loads.
        const meshes = [];
        bee.traverse((object) => {
          if (object.isMesh && object.geometry?.attributes?.position?.count > 0) {
            meshes.push(object);
            object.castShadow = true;
            object.receiveShadow = true;
            // Animated/skinned meshes need conservative frustum handling.
            object.frustumCulled = false;
          }
        });
        if (!meshes.length) {
          console.warn('enemy.glb has no meshes; using red fallback.');
          return;
        }

        // IMPORTANT BUG FIX:
        // Fit the model while its parent has NO world-space translation.
        // The previous code subtracted a WORLD-SCALE center from fit.position,
        // creating a huge off-center pivot. Rotating that pivot caused the bee
        // to orbit its collision point, visually flee, and trigger invisible hits.
        bee.rotation.x = Math.PI / 2;
        bee.scale.setScalar(5); // Keep the course-specified asset scale.
        const fit = new THREE.Group();
        fit.add(bee); // Still detached: all bounds are in local coordinates.
        fit.updateWorldMatrix(true, true);
        const bounds = new THREE.Box3().setFromObject(fit, true);
        const size = bounds.getSize(new THREE.Vector3());
        const longest = Math.max(size.x, size.y, size.z);
        if (!Number.isFinite(longest) || longest < 0.0001) {
          console.warn('enemy.glb has invalid dimensions; using fallback.');
          return;
        }
        fit.scale.setScalar(TARGET_MODEL_SIZE / longest);
        fit.updateWorldMatrix(true, true);
        const fitted = new THREE.Box3().setFromObject(fit, true);
        const center = fitted.getCenter(new THREE.Vector3());
        // Center on LOCAL XY origin, independent of enemy spawn position.
        fit.position.set(-center.x, -center.y, ABOVE_GROUND - fitted.min.z);
        this.visualPivot.add(fit);
        this.visualPivot.updateWorldMatrix(true, true);

        const boundsFinal = new THREE.Box3().setFromObject(fit, true);
        if (boundsFinal.isEmpty()) {
          this.visualPivot.remove(fit);
          console.warn('enemy.glb has empty bounds; using fallback.');
          return;
        }
        this.placeholder.visible = false;
        this.model = bee;
        // The original body-footprint logic, with a cap to exclude wings.
        this.collisionRadius = measureFootprint(bee, this.visualPivot, {
          minRadius: 21, maxRadius: 25,
        }).radius;
      },
      undefined,
      (error) => console.error('Unable to load enemy.glb; using fallback.', error),
    );
  }

  /**
   * Chase the last known player position when hidden; route around houses AND
   * trees using bounded A*. Never treat tree cover as a global freeze switch.
   * Existing calls with only four arguments still work as before.
   */
  update(deltaTime, player, enemies, minimumGap, obstacles = [], targetPosition = player.position) {
    if (!player.model || deltaTime <= 0) return;
    const startX = this.position.x;
    const startY = this.position.y;
    const speed = Math.max(0, this.movementSpeed);
    const step = speed * deltaTime;
    if (step <= 0) return;

    // Existing enemies created before this patch also initialize lazily.
    this.detour ??= [];
    this.repathCooldown = Math.max(0, (this.repathCooldown ?? 0) - deltaTime);
    const target = clampToArena(targetPosition.x, targetPosition.y, this.collisionRadius + 2);
    if (!Number.isFinite(target.x) || !Number.isFinite(target.y)) return;

    // Following a moving target is important: stale detours must be discarded.
    if (this.routeTarget && Math.hypot(target.x - this.routeTarget.x,
        target.y - this.routeTarget.y) > 42) {
      this.detour.length = 0;
      this.repathCooldown = 0;
    }
    while (this.detour.length && Math.hypot(this.detour[0].x - startX,
        this.detour[0].y - startY) <= Math.max(3.8, step)) {
      this.detour.shift();
    }

    const hitsStatic = (x, y) => !isInsideArena(x, y, this.collisionRadius + 2) ||
      !isStaticClear(x, y, obstacles, this.collisionRadius, minimumGap);
    const hitsEnemy = (x, y) => enemies.some(other => other !== this &&
      circlesOverlap(x, y, this.collisionRadius, other.position.x,
        other.position.y, other.collisionRadius, minimumGap));
    const clear = (x, y) => !hitsStatic(x, y) && !hitsEnemy(x, y);

    let goal = this.detour[0] ?? target;
    let direct = pursuitStep(startX, startY, goal.x, goal.y, speed, deltaTime);
    if (direct.distance < 1e-6) return;

    if (hitsStatic(direct.x, direct.y) && this.repathCooldown <= 0) {
      // A small tree and a big house use the SAME collider contract; bounded
      // routing means several neighboring trees can all be avoided together.
      this.detour = findObstaclePath(
        { x: startX, y: startY }, target, obstacles,
        this.collisionRadius, minimumGap);
      this.routeTarget = { ...target };
      this.repathCooldown = 0.7;
      goal = this.detour[0] ?? target;
      direct = pursuitStep(startX, startY, goal.x, goal.y, speed, deltaTime);
    }

    // Ignore a blocked path segment rather than walking through its tree.
    if (clear(direct.x, direct.y)) {
      this.position.set(direct.x, direct.y, this.position.z);
      this.visualPivot.rotation.z = Math.atan2(-(direct.x - startX), direct.y - startY);
      this.blockedFor = 0;
      return;
    }

    // Crowding: test progressively wider steering angles. This lets a bee go
    // around another bee while keeping every collider intact.
    const dx = direct.headingX / direct.distance;
    const dy = direct.headingY / direct.distance;
    const steerAngles = [0, Math.PI/6, -Math.PI/6, Math.PI/3, -Math.PI/3,
      Math.PI/2, -Math.PI/2, 2*Math.PI/3, -2*Math.PI/3];
    for (const angle of steerAngles) {
      const cs = Math.cos(angle), sn = Math.sin(angle);
      const nextX = startX + (dx*cs - dy*sn)*step;
      const nextY = startY + (dx*sn + dy*cs)*step;
      if (!clear(nextX, nextY)) continue;
      this.position.set(nextX, nextY, this.position.z);
      this.visualPivot.rotation.z = Math.atan2(-(nextX - startX), nextY - startY);
      this.blockedFor = 0;
      return;
    }

    // Completely surrounded: pause rather than overlap. Replan once the
    // blockage has persisted briefly; moving obstacles may have shifted.
    this.blockedFor = (this.blockedFor ?? 0) + deltaTime;
    if (this.blockedFor >= 0.9) {
      this.detour.length = 0;
      this.repathCooldown = 0;
      this.blockedFor = 0;
    }
  }
}
