import test from 'node:test';
import assert from 'node:assert/strict';
import { intersectsCircle, blocksSight, treeProvidesCover } from '../src/components/treeCover.js';
import { touchesEnemyAt } from '../src/components/contactRules.js';

test('tree collision prevents overlap independently of keyboard movement', () => {
  const tree = { x: 100, y: 0 };
  assert.equal(intersectsCircle(70, 0, 18, tree.x, tree.y, 17, 6), true);
  assert.equal(intersectsCircle(20, 0, 18, tree.x, tree.y, 17, 6), false);
});

test('a bee on the far side of a trunk cannot see a frog hiding close behind it', () => {
  const trunk = { position: { x: 45, y: 0 } };
  assert.equal(blocksSight({ x: -150, y: 0 }, { x: 80, y: 0 }, trunk), true);
  assert.equal(treeProvidesCover({ x: -150, y: 0 }, { x: 80, y: 0 }, [trunk]), true);
  assert.equal(treeProvidesCover({ x: -150, y: 250 }, { x: 80, y: 0 }, [trunk]), false);
});

test('nearby bees cannot be ignored even when a tree blocks distant vision', () => {
  const trunk = { position: { x: 45, y: 0 } };
  assert.equal(treeProvidesCover({ x: 24, y: 0 }, { x: 80, y: 0 }, [trunk]), false);
});

test('contact distance depends on coordinates, not on whether a key was pressed', () => {
  const enemy = { position: { x: 55, y: 0 }, collisionRadius: 25 };
  assert.equal(touchesEnemyAt(0, 0, 18, enemy, 15), true);
  enemy.position.x = 85;
  assert.equal(touchesEnemyAt(0, 0, 18, enemy, 15), false);
});
