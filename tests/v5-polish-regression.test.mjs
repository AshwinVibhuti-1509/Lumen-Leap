import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const map=readFileSync(new URL('../src/components/Map.js',import.meta.url),'utf8');

test('no houses in the runtime garden; the terrain extends beyond arena edge',()=>{
  assert.ok(map.includes('const MAP_SIZE = 4000'));
  assert.ok(map.includes('const TILE_COUNT = 80'));
  assert.ok(map.includes('this.houses = []'));
  assert.ok(map.includes('this.createArenaBoundary()'));
  assert.ok(!map.includes('this.createHouses('));
  assert.ok(!map.includes("from './House.js'"));
});
test('fifth-bee milestone and HUD guidance are wired to the real defeat handler',()=>{
  assert.ok(main.includes('const heartAwarded = earnsHeartOnKill(defeated, hearts)'));
  assert.ok(main.includes('hearts=Math.min(MAX_HEARTS, hearts+1)'));
  assert.ok(main.includes('lastHeartRewardAt=elapsed'));
  assert.ok(main.includes("say('heal')"));
  assert.ok(main.includes('hud-heart-progress'));
});
test('combo announcements and firefly speech are not immediately replaced',()=>{
  assert.ok(main.includes('combo=nextKillCombo(elapsed,lastKillAt,combo)'));
  assert.ok(main.includes('lastHeartRewardAt!==elapsed && combo<2'));
  assert.ok(!main.includes("if(collected<3)say('stage')"));
  assert.ok(main.includes("say('firefly')"));
  assert.ok(main.includes("say('summon')"));
  assert.ok(main.includes("say('hurt')"));
});
