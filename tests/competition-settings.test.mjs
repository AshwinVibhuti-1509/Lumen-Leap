import test from 'node:test';
import assert from 'node:assert/strict';
import {THEMES, DIFFICULTIES, difficultyStats} from '../src/components/gameSettings.js';

test('four themes are available with unique palettes',()=>{
  assert.deepEqual(Object.keys(THEMES), ['twilight','fantasy','marsh','forest']);
  assert.notEqual(THEMES.twilight.grass[0], THEMES.fantasy.grass[0]);
});
test('difficulty increases bee caps and pursuit speed',()=>{
  const [easy,normal,hard]=['easy','normal','hard'].map(name=>difficultyStats(name,0));
  assert.ok(easy.maxEnemies<normal.maxEnemies && normal.maxEnemies<hard.maxEnemies);
  assert.ok(easy.enemySpeed<normal.enemySpeed && normal.enemySpeed<hard.enemySpeed);
  assert.ok(easy.spawnDelay>normal.spawnDelay && normal.spawnDelay>hard.spawnDelay);
});
test('score scales difficulty but delays stay safely bounded',()=>{
  for(const name of Object.keys(DIFFICULTIES)){
    const start=difficultyStats(name,0),late=difficultyStats(name,10000);
    assert.ok(late.enemySpeed>start.enemySpeed);
    assert.ok(late.spawnDelay<start.spawnDelay && late.spawnDelay>=1.05);
    assert.ok(late.attackCooldown>=0.65);
    assert.equal(late.maxEnemies,start.maxEnemies);
  }
});
test('invalid inputs fall back to normal and do not create NaN',()=>{
  assert.equal(difficultyStats('unknown',NaN).enemySpeed,difficultyStats('normal',0).enemySpeed);
});
