import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const style=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
test('wizard contains difficulty, world, explorer in order',()=>{
  assert.ok(main.indexOf('data-step="0"')<main.indexOf('data-step="1"'));
  assert.ok(main.indexOf('data-step="1"')<main.indexOf('data-step="2"'));
  for(const name of ['menu-start','wizard-next','wizard-back','world-live-canvas','wizard-help','wizard-records','open-shop','profile-avatar','player-nickname'])assert.ok(main.includes(name));
});
test('menu features and visual updates are integrated',()=>{
  for(const name of ['shop-categories','refreshAchievements','updateRestoration','feedback.pulse','realmMechanics.apply','renderRecords','renderGame()'])assert.ok(main.includes(name));
  for(const name of ['.wizard-wallet','.wizard-footer','.guide-overlay','.achievement-toast','.avatar-orbit'])assert.ok(style.includes(name));
});
