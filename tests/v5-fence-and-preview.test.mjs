import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ARENA_HALF_EXTENT, isInsideArena, clampToArena } from '../src/components/lumenRules.js';
const file = path => readFileSync(new URL(path,import.meta.url),'utf8');
const fence = file('../src/components/GardenFence.js');
const map = file('../src/components/Map.js');
const main = file('../src/main.js');
const player = file('../src/components/Player.js');
const bee = file('../src/components/Enemy.js');

for (const [character, radius] of Object.entries({frog:18, orangeToad:18, spider:26, dragonfly:23})) {
  test(`${character} cannot cross any arena edge`, () => {
    assert.equal(ARENA_HALF_EXTENT, 520);
    const good = ARENA_HALF_EXTENT - radius;
    assert.equal(isInsideArena(good,0,radius),true);
    assert.equal(isInsideArena(good+.001,0,radius),false);
    assert.equal(isInsideArena(0,-good-.001,radius),false);
    assert.deepEqual(clampToArena(10000,-10000,radius),{x:good,y:-good});
  });
}
test('all four fences are authored distinctly, at the same collision boundary', () => {
  assert.match(fence,/ARENA_HALF_EXTENT/);
  for (const kind of ['fantasy','forest','marsh']) assert.ok(fence.includes(`this.theme === '${kind}'`));
  assert.match(fence,/this\.setTheme\('twilight'\)/);
  assert.match(fence,/InstancedMesh/);
  assert.match(fence,/color/i);
  assert.match(map,/this\.arenaFence\.setTheme\(name\)/);
});
test('enemies and alternate player models respect perimeter during updates', () => {
  assert.match(player,/clampToArena\(this\.position\.x, this\.position\.y, this\.collisionRadius\)/);
  assert.match(player,/isInsideArena\(nextX, nextY, this\.collisionRadius\)/);
  assert.match(bee,/clampToArena\(targetPosition\.x, targetPosition\.y, this\.collisionRadius \+ 2\)/);
  assert.match(bee,/!isInsideArena\(x, y, this\.collisionRadius \+ 2\)/);
  assert.match(main,/map\.isInsideFence\(x,y,player\.collisionRadius\)/);
});
test('world selection preview renders a pristine, centered scene rather than last hero camera', () => {
  assert.match(main,/const overviewScene=new THREE\.Scene\(\)/);
  assert.match(main,/overviewCamera\.lookAt\(0,0,0\)/);
  assert.match(main,/renderer\.render\(overviewScene,overviewCamera\)/);
  assert.match(main,/overviewMap\.setTheme\(t,chosenTheme\)/);
  assert.ok(!main.includes('worldPreviewCtx.drawImage(renderer.domElement') ||
    main.includes('renderer.render(overviewScene,overviewCamera)'));
});
test('ground extends farther than the camera and fences', () => {
  assert.match(map,/const MAP_SIZE = 4000/);
  assert.match(map,/const TILE_COUNT = 80/);
  assert.ok(4000/2 > ARENA_HALF_EXTENT + 700);
});
