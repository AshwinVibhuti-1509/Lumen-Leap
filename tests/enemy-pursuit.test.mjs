import { isInsideArena, clampToArena } from '../src/components/lumenRules.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pursuitStep, findObstaclePath, isStaticClear } from '../src/components/navigation.js';

// Test the ACTUAL Enemy.update method without constructing its WebGL model.
// Three.js only gets used inside the constructor, so these motion tests work
// without a browser or downloaded npm packages.
const source = readFileSync(new URL('../src/components/Enemy.js', import.meta.url), 'utf8')
  .replace(/^import\s+.*?;\s*$/gm, '')
  .replace('export default class Enemy', 'class Enemy');
const circlesOverlap = (ax,ay,ar,bx,by,br,gap=0) =>
  Math.hypot(ax-bx, ay-by) < ar+br+gap;
const Enemy = new Function('THREE','GLTFLoader','measureFootprint','circlesOverlap','pursuitStep','findObstaclePath','isStaticClear','isInsideArena','clampToArena',
  source + '\nreturn Enemy;')(
    {Group: class {}}, class {}, () => null, circlesOverlap, pursuitStep, findObstaclePath, isStaticClear, isInsideArena, clampToArena,
  );
function dummyEnemy(x,y) {
  const enemy = Object.create(Enemy.prototype);
  enemy.position = {x,y,z:0, set(nx,ny,nz){this.x=nx;this.y=ny;this.z=nz;}};
  enemy.model = {};
  enemy.detour = [];
  enemy.collisionRadius = 12;
  enemy.movementSpeed = 22;
  enemy.visualPivot = {rotation:{z:0}};
  return enemy;
}
const frog = { position:{x:0,y:0}, model:{} };

test('pursuit distances decrease from each spawn corner (no obstacles)', () => {
  for (const [x,y] of [[-125,-125],[-125,125],[125,-125],[125,125]]) {
    const enemy = dummyEnemy(x,y);
    let last = Math.hypot(x,y);
    for (let i=0;i<80;i++) {
      enemy.update(1/60, frog, [enemy], 6, []);
      const d = Math.hypot(enemy.position.x, enemy.position.y);
      assert.ok(d <= last + 1e-9, 'enemy moved away from the player');
      last=d;
    }
    assert.ok(last < Math.hypot(x,y)-20, 'enemy failed to approach');
  }
});

test('rotating the visual pivot cannot change enemy XY coordinates', () => {
  const enemy=dummyEnemy(125,0);
  const before=enemy.position.x;
  enemy.update(0, frog,[enemy],6,[]);
  assert.equal(enemy.position.x,before);
  assert.equal(enemy.position.y,0);
});

test('player contact is NOT blocked by collision avoidance', () => {
  const enemy=dummyEnemy(20,0);
  enemy.update(1, frog, [enemy],6,[]);
  assert.ok(Math.hypot(enemy.position.x, enemy.position.y) < 20);
});

test('an enemy does not move through a house footprint', () => {
  const enemy=dummyEnemy(90,0);
  // A simplified house between the enemy and frog.
  const house={ position:{x:40,y:0}, footprint:{minX:-15,maxX:15,minY:-20,maxY:20}, collidesWithCircle(x,y,r,gap) {
    const cx=Math.max(25,Math.min(55,x));
    const cy=Math.max(-20,Math.min(20,y));
    return Math.hypot(x-cx,y-cy) < r+gap;
  }};
  for(let i=0;i<720;i++) {
    enemy.update(1/60,frog,[enemy],6,[house]);
    assert.ok(!house.collidesWithCircle(enemy.position.x,enemy.position.y,12,6));
  }
  assert.ok(Math.hypot(enemy.position.x,enemy.position.y) < 20,
    "enemy must navigate around house and eventually reach the player");
});

test('enemies avoid overlapping each other while moving', () => {
  const a=dummyEnemy(100,0), b=dummyEnemy(100,45);
  for(let i=0;i<120;i++) {
    a.update(1/60,frog,[a,b],6,[]);
    b.update(1/60,frog,[a,b],6,[]);
    assert.ok(Math.hypot(a.position.x-b.position.x,a.position.y-b.position.y)>=30-1e-8);
  }
});
