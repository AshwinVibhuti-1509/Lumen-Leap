import test from 'node:test';
import assert from 'node:assert/strict';
import {careerDefaults, normalizeCareer, normalizeRecords, addRecord, checkAchievements} from '../src/components/Records.js';
import {normalizeSave} from '../src/components/shop.js';

test('V4 saves are compatible with V5 records/career data',()=>{
  const s=normalizeSave({coins:34,unlocked:['classic','lumo'],name:'Ashwin',best:900});
  assert.equal(s.coins,34);assert.equal(s.name,'Ashwin');
  assert.deepEqual(s.career,careerDefaults());assert.deepEqual(s.records,[]);
});
test('record list only keeps top five scores',()=>{
  const save=normalizeSave(null);
  for(let i=1;i<=8;i++)addRecord(save,{name:'Tode',score:i*100,duration:60+i,won:i%2===0});
  assert.equal(save.records.length,5);
  assert.equal(save.records[0].score,800);assert.equal(save.records.at(-1).score,400);
});
test('untrusted storage is bounded and safe',()=>{
  assert.equal(normalizeCareer({kills:-4,summons:1e99}).kills,0);
  const rows=normalizeRecords([{name:'ABCDEFGHIJKLMNOPQRSTUVWXYZ',score:-9},{name:'B',score:Infinity}]);
  assert.equal(rows.length,2);assert.ok(rows[0].name.length<=18);
});
test('achievements unlock once',()=>{
  const s=normalizeSave(null);s.career={kills:25,summons:10,wins:1};
  const awards=checkAchievements(s,{lights:3,won:true,hearts:3,difficulty:'hard'});
  assert.equal(awards.length,6);
  assert.equal(checkAchievements(s,{lights:3,won:true,hearts:3,difficulty:'hard'}).length,0);
});
