import { isInsideArena, clampToArena } from '../src/components/lumenRules.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pursuitStep, findObstaclePath, isStaticClear } from '../src/components/navigation.js';
import { treeProvidesCover } from '../src/components/treeCover.js';

const overlap = (ax,ay,ar,bx,by,br,gap=0) => Math.hypot(ax-bx,ay-by)<ar+br+gap;
const source=readFileSync(new URL('../src/components/Enemy.js',import.meta.url),'utf8')
  .replace(/^import\s+.*?;\s*$/gm,'')
  .replace('export default class Enemy','class Enemy');
const Enemy=new Function('THREE','GLTFLoader','measureFootprint','circlesOverlap',
  'pursuitStep','findObstaclePath','isStaticClear','isInsideArena','clampToArena',source+'\nreturn Enemy;')(
  {Group:class {}},class {},()=>null,overlap,pursuitStep,findObstaclePath,isStaticClear,isInsideArena,clampToArena);
const tree={position:{x:70,y:0},collidesWithCircle(x,y,r,gap=0){return Math.hypot(x-70,y)<17+r+gap;}};

test('bee investigates last seen frog position and resumes when sight clears',()=>{
  const enemy=Object.create(Enemy.prototype);
  enemy.position={x:160,y:0,z:0,set(x,y,z){Object.assign(this,{x,y,z});}};
  enemy.model={};enemy.detour=[];enemy.visualPivot={rotation:{z:0}};
  enemy.movementSpeed=34;enemy.collisionRadius=12;
  const player={position:{x:0,y:15},model:{}};
  let lastSeen={...player.position};
  const initialX=enemy.position.x;
  let observedHidden=false;
  for(let i=0;i<480;i++){
    // Tode escapes sideways behind the tree rather than remaining fixed.
    player.position.y=15+40*Math.sin(i/120);
    const hidden=treeProvidesCover(enemy.position,player.position,[tree]);
    observedHidden||=hidden;
    if(!hidden)lastSeen={...player.position};
    enemy.update(1/60,player,[enemy],6,[tree],hidden?lastSeen:player.position);
    assert.equal(tree.collidesWithCircle(enemy.position.x,enemy.position.y,12,6),false);
  }
  assert.equal(observedHidden,true,'scenario must actually exercise tree cover');
  assert.ok(enemy.position.x<initialX-70,'bee must not remain frozen during tree cover');
});

test('main update never clears navigation and skips bees merely due to tree cover',()=>{
  const src=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  assert.match(src,/enemy\.lastSeenPosition/);
  assert.match(src,/enemy\.update\(dt,player,enemies,COLLISION_GAP,obstacles,pursuitTarget\)/);
  assert.doesNotMatch(src,/enemy\.detour\.length\s*=\s*0;\s*continue/);
});
