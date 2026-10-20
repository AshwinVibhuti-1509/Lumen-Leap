import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGES, stageFor, stageIndex, stageDifficulty, waveSize } from '../src/components/progression.js';
import { ITEMS, AVATARS, blankSave, normalizeSave, buyOrEquip } from '../src/components/shop.js';

test('automatic progression advances with fireflies; final escape has its own wave',()=>{
 assert.equal(STAGES.length,4);
 assert.deepEqual([0,1,2,3].map(n=>stageIndex(n)),[0,1,2,3]);
 assert.equal(stageIndex(100),3);
 assert.equal(stageFor(2).title,'THE FINAL GLOW');
 const base={enemySpeed:20,spawnDelay:4,maxEnemies:13};
 const late=stageDifficulty(base,3);
 assert.ok(late.enemySpeed>base.enemySpeed);
 assert.ok(late.spawnDelay<base.spawnDelay);
 assert.ok(late.maxEnemies>base.maxEnemies);
 assert.equal(base.maxEnemies,13); // pure: no mutation
});
test('stage waves increase across difficulties',()=>{
 for(let n=1;n<=3;n++){
   assert.ok(waveSize(n,'easy')<=waveSize(n,'normal'));
   assert.ok(waveSize(n,'normal')<=waveSize(n,'hard'));
 }
 assert.equal(waveSize(0,'normal'),0);
});
test('shop deducts gold once, unlocks persist, and equips without repeat charges',()=>{
 const state=blankSave();state.coins=100;
 assert.equal(buyOrEquip(state,'sunset').ok,true);
 assert.equal(state.coins,70);
 assert.equal(buyOrEquip(state,'sunset').ok,true);
 assert.equal(state.coins,70);
 assert.equal(state.equipped.frog,'sunset');
 assert.equal(buyOrEquip(state,'golden').ok,false);
 const restored=normalizeSave(JSON.parse(JSON.stringify(state)));
 assert.equal(restored.coins,70);
 assert.ok(restored.unlocked.includes('sunset'));
 assert.equal(restored.equipped.frog,'sunset');
});
test('player character unlocks cannot be equipped free',()=>{
 const state=blankSave();
 assert.equal(buyOrEquip(state,'spider').ok,false);
 state.coins=200;
 assert.equal(buyOrEquip(state,'spider').ok,true);
 assert.equal(state.equipped.character,'spider');
 assert.equal(state.equipped.frog,'classic');
 assert.ok(ITEMS.some(i=>i.id==='dragonfly'));
});
test('local save normalizes malformed names, avatars and wallet',()=>{
 const normalized=normalizeSave({coins:-1000,name:'ABCDEFGHIJKLMNOPQRSTUVWX',avatar:'🦀',best:4});
 assert.equal(normalized.coins,0);
 assert.ok(normalized.name.length<=18);
 assert.equal(normalized.avatar,AVATARS[0]);
 assert.deepEqual(normalizeSave(null),blankSave());
});
