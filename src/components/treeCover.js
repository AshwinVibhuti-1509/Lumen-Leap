/** Lightweight 2D circle collision and tree-cover geometry, independent of WebGL. */
export function intersectsCircle(x, y, radius, cx, cy, otherRadius, gap = 0) {
  return Math.hypot(x - cx, y - cy) < radius + otherRadius + gap;
}

/** Is a tree trunk between this bee and Tode? Uses an XY segment-to-circle test. */
export function blocksSight(bee, frog, tree, trunkRadius = 19) {
  const vx = frog.x - bee.x;
  const vy = frog.y - bee.y;
  const lengthSq = vx * vx + vy * vy;
  if (lengthSq < 1e-6) return false;
  const t = ((tree.position.x - bee.x) * vx + (tree.position.y - bee.y) * vy) / lengthSq;
  if (t <= 0.04 || t >= 0.96) return false;
  const closestX = bee.x + t * vx;
  const closestY = bee.y + t * vy;
  return Math.hypot(tree.position.x - closestX, tree.position.y - closestY) < trunkRadius;
}

/** Nearby tree can conceal Tode from bees on the other side, but not from bees already close. */
export function treeProvidesCover(bee, frog, trees) {
  if (Math.hypot(bee.x - frog.x, bee.y - frog.y) < 76) return false;
  return trees.some(tree =>
    Math.hypot(tree.position.x - frog.x, tree.position.y - frog.y) < 75 &&
    blocksSight(bee, frog, tree)
  );
}
