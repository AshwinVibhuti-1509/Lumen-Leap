import assert from 'node:assert/strict';
import test from 'node:test';
import { generateHousePlacements, HOUSE_COUNT, PLAYER_CLEARANCE, SPAWN_CLEARANCE, HOUSE_SEPARATION } from '../src/components/housePlacement.js';
import { touchesEnemyAt, contactRadius, nearestEnemyDistance } from '../src/components/contactRules.js';

const spawns = [ {x:-125,y:-125},{x:-125,y:125},{x:125,y:-125},{x:125,y:125} ];
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
test('houses scatter, avoid spawn zones and each other', () => {
  for (let seed = 1; seed <= 250; seed += 1) {
    let value = seed;
    const random = () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / (2 ** 32); };
    const houses = generateHousePlacements(spawns, random);
    assert.equal(houses.length, HOUSE_COUNT, `seed ${seed}`);
    houses.forEach((h, idx) => {
      assert.ok(Math.hypot(h.x,h.y) >= PLAYER_CLEARANCE);
      assert.ok(spawns.every(s=>distance(h,s) >= SPAWN_CLEARANCE));
      assert.ok(houses.slice(0,idx).every(p=>distance(h,p) >= HOUSE_SEPARATION));
      assert.ok(Number.isInteger(h.turns) && h.turns >= 0 && h.turns <= 3);
    });
  }
});
test('contact detects bee touching player from either direction', () => {
  const enemy = {position:{x:40,y:0},collisionRadius:16};
  assert.equal(contactRadius(18,16),40);
  assert.equal(touchesEnemyAt(0,0,18,enemy),true);
  enemy.position.x=40.01;
  assert.equal(touchesEnemyAt(0,0,18,enemy),false);
  enemy.position.x=-22;
  assert.equal(touchesEnemyAt(0,0,18,enemy),true);
});
test('nearest enemy HUD math', () => {
  const bees = [ {position:{x:100,y:0}}, {position:{x:0,y:30}} ];
  assert.equal(nearestEnemyDistance(0,0,bees),30);
  assert.equal(nearestEnemyDistance(0,0,[]),Infinity);
});
