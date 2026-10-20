import { isInsideArena, clampToArena } from '../src/components/lumenRules.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { findObstaclePath, isSegmentClear } from '../src/components/navigation.js';
import { readFileSync } from 'node:fs';
import { pursuitStep, isStaticClear } from '../src/components/navigation.js';

const circlesOverlap = (ax, ay, ar, bx, by, br, gap = 0) =>
  Math.hypot(ax - bx, ay - by) < ar + br + gap;
const source = readFileSync(new URL('../src/components/Enemy.js', import.meta.url), 'utf8')
  .replace(/^import\s+.*?;\s*$/gm, '')
  .replace('export default class Enemy', 'class Enemy');
const Enemy = new Function('THREE','GLTFLoader','measureFootprint','circlesOverlap',
  'pursuitStep','findObstaclePath','isStaticClear','isInsideArena','clampToArena', source + '\nreturn Enemy;')(
  { Group: class {} }, class {}, () => null, circlesOverlap,
  pursuitStep, findObstaclePath, isStaticClear, isInsideArena, clampToArena);
function makeEnemy(x, y, radius = 12) {
  const e = Object.create(Enemy.prototype);
  e.position = { x, y, z: 0, set(nx,ny,nz){this.x=nx; this.y=ny; this.z=nz;} };
  e.visualPivot = {rotation:{z:0}};
  e.model={};e.detour=[];e.movementSpeed=35;e.collisionRadius=radius;
  return e;
}
function tree(x, y, r = 17) {
  return { position:{ x, y }, collidesWithCircle(px, py, radius, gap = 0){
    return Math.hypot(px-x,py-y) < r + radius + gap;
  }};
}
function house(x, y, rx = 22, ry = 25) {
  return {position:{x,y}, collidesWithCircle(px,py,r,gap=0){
    const nearX=Math.max(x-rx,Math.min(x+rx,px));
    const nearY=Math.max(y-ry,Math.min(y+ry,py));
    return Math.hypot(px-nearX,py-nearY)<r+gap;
  }};
}
const frog = {position:{x:0,y:0}, model:{}};

test('A* avoids circular tree trunk while preserving collider clearance', () => {
  const tree1 = tree(65,0);
  const path = findObstaclePath({x:140,y:0},frog.position,[tree1],12,6);
  assert.ok(path.length>=2, 'must detour, not just fly through the tree');
  let prev = {x:140,y:0};
  for(const next of path){
    assert.ok(isSegmentClear(prev,next,[tree1],12,6),'path segment cuts through tree');
    prev=next;
  }
  assert.ok(Math.hypot(prev.x,prev.y)<25,'path failed to lead toward Tode');
});

test('bee navigates around multiple trees and a house without clipping', () => {
  const obstacles=[tree(92,0),tree(82,64),tree(60,-68),house(52,48,16,22)];
  const bee=makeEnemy(185,0);
  const initialDist=Math.hypot(bee.position.x,bee.position.y);
  for(let i=0;i<1500;i++){
    bee.update(1/60,frog,[bee],6,obstacles);
    for(const obstacle of obstacles)assert.equal(
      obstacle.collidesWithCircle(bee.position.x,bee.position.y,bee.collisionRadius,6),false,
      'bee entered an obstacle');
    if(Math.hypot(bee.position.x,bee.position.y)<22)break;
  }
  assert.ok(Math.hypot(bee.position.x,bee.position.y)<initialDist-110,
    'bee became permanently stuck behind tree cluster');
});

test('last-seen pursuit continues independently of player input and tree cover', () => {
  const bee=makeEnemy(140,0);
  const obstacles=[tree(70,0)];
  const lastVisible={x:0,y:0};
  for(let i=0;i<800;i++){
    // Tode has moved behind cover. The bee investigates its last-seen location.
    bee.update(1/60,frog,[bee],6,obstacles,lastVisible);
  }
  assert.ok(Math.hypot(bee.position.x,bee.position.y)<40,
    'bee should travel around the tree toward last-seen target, not freeze');
});

test('static pathfinding does not run on unobstructed routes', () => {
  const path=findObstaclePath({x:120,y:30},{x:0,y:0},[tree(0,200)],12,6);
  assert.deepEqual(path,[{x:0,y:0}]);
});
