import assert from 'node:assert/strict';
import test from 'node:test';
import { selectFireflyLocations, canTakeDamage, readyToSummon,
  GUARDIAN_COOLDOWN, GUARDIAN_DURATION, REQUIRED_FIREFLIES, MAX_HEARTS,
  isInsideArena, earnsHeartOnKill, nextKillCombo, ARENA_HALF_EXTENT, KILLS_PER_HEART } from '../src/components/lumenRules.js';
import { generateHousePlacements } from '../src/components/housePlacement.js';

const spawns = [{x:-125,y:-125},{x:-125,y:125},{x:125,y:-125},{x:125,y:125}];
function createBlocked(houses) {
  return (x,y,radius) => houses.some((house) => {
    const px = Math.max(-40,Math.min(40,x-house.x));
    const py = Math.max(-40,Math.min(40,y-house.y));
    return Math.hypot(x-house.x-px,y-house.y-py) < radius + 6;
  });
}
function reachablePositions(blocked) {
  const seen = new Set(['0,0']);
  const q = [[0,0]];
  for (let i=0;i<q.length;i++) {
    const [x,y] = q[i];
    for (const [dx,dy] of [[50,0],[-50,0],[0,50],[0,-50]]) {
      const a=x+dx,b=y+dy,key=`${a},${b}`;
      if (Math.abs(a)>400 || Math.abs(b)>400 || seen.has(key) || blocked(a,b,19)) continue;
      seen.add(key);q.push([a,b]);
    }
  }
  return seen;
}
test('three fireflies appear at walkable reachable spots across 500 varied maps', () => {
  for(let seed=1;seed<=500;seed++) {
    let value = seed;
    const random=()=>{value=(Math.imul(value,1664525)+1013904223)>>>0; return value/2**32;};
    const houses=generateHousePlacements(spawns, random);
    const blocked=createBlocked(houses);
    const fireflies=selectFireflyLocations(blocked);
    const reachable=reachablePositions(blocked);
    assert.equal(fireflies.length, REQUIRED_FIREFLIES,`seed ${seed}`);
    for(const [i,p] of fireflies.entries()) {
      assert.ok(p.x % 50 === 0);
      assert.ok(p.y % 50 === 0);
      assert.ok(!blocked(p.x,p.y,32), `seed ${seed} safe collectible`);
      assert.ok(reachable.has(`${p.x},${p.y}`),`seed ${seed} reachable`);
      assert.ok(fireflies.slice(i+1).every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=175));
    }
  }
});
test('healthy player loses a heart only after invulnerability',()=>{
  assert.equal(MAX_HEARTS,3);
  assert.equal(canTakeDamage(0,3),true);
  assert.equal(canTakeDamage(1.9,2),false);
  assert.equal(canTakeDamage(0,0),false);
});
test('guardian expires after five seconds and recharges after 15 seconds',()=>{
  assert.equal(GUARDIAN_DURATION,5);
  assert.equal(GUARDIAN_COOLDOWN,15);
  assert.equal(readyToSummon(0,-15),true);
  assert.equal(readyToSummon(14.9,0),false);
  assert.equal(readyToSummon(15,0),true);
});

// Edge tests prevent the camera following Tode onto non-existent ground.
test('player cannot leave the playable garden, even with a wide character',()=>{
  assert.equal(ARENA_HALF_EXTENT,520);
  assert.equal(isInsideArena(0,0,18),true);
  assert.equal(isInsideArena(500,-500,18),true);
  assert.equal(isInsideArena(550,0,18),false);
  assert.equal(isInsideArena(-550,0,18),false);
  assert.equal(isInsideArena(0,520,18),false);
  assert.equal(isInsideArena(504,0,18),false);
  assert.equal(isInsideArena(Number.NaN,0,18),false);
  assert.equal(isInsideArena(0,0,-1),false);
});
test('only every fifth defeated bee heals, capped at 3, without carrying over',()=>{
  assert.equal(KILLS_PER_HEART,5);
  assert.equal(earnsHeartOnKill(0,2),false);
  assert.equal(earnsHeartOnKill(4,2),false);
  assert.equal(earnsHeartOnKill(5,2),true);
  assert.equal(earnsHeartOnKill(5,3),false);
  assert.equal(earnsHeartOnKill(6,2),false);
  assert.equal(earnsHeartOnKill(10,1),true);
  assert.equal(earnsHeartOnKill(10,0),false);
});
test('combo resets after four seconds and caps at four',()=>{
  assert.equal(nextKillCombo(0,-100,0),1);
  assert.equal(nextKillCombo(1,0,1),2);
  assert.equal(nextKillCombo(2,1,2),3);
  assert.equal(nextKillCombo(3,2,3),4);
  assert.equal(nextKillCombo(3.5,3,4),4);
  assert.equal(nextKillCombo(10,3,4),1);
});
test('game guide describes new Lumo, fifth-bee healing, and house-free boundaries',async()=>{
  const {readFileSync}=await import('node:fs');
  const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  assert.ok(source.includes('recharges in 15 seconds'));
  assert.ok(source.includes('Every fifth bee defeat restores one missing heart'));
  assert.ok(source.includes('isInsideArena(x,y,player.collisionRadius)'));
  assert.ok(!source.includes('Trees and houses block your path'));
  assert.ok(source.includes('nextKillCombo(elapsed,lastKillAt,combo)'));
  assert.ok(source.includes("say('firefly')"));
  assert.ok(source.includes("say('summon')"));
  assert.ok(source.includes("say('hurt')"));
});
