/**
 * The original 40+ unit bee model was drawn larger than its collision disk,
 * making visible contact look harmless. Share one rule between player hops
 * and moving-enemy contact, with a modest, configurable visual allowance.
 *
 * All values are in the XY ground plane; the Z-axis is only for jumping.
 */
export const ENEMY_CONTACT_PADDING = 6;

export function contactRadius(playerRadius, enemyRadius, padding = ENEMY_CONTACT_PADDING) {
  return Math.max(0, playerRadius) + Math.max(0, enemyRadius) + padding;
}

export function touchesEnemyAt(x, y, playerRadius, enemy, padding = ENEMY_CONTACT_PADDING) {
  const threshold = contactRadius(playerRadius, enemy.collisionRadius, padding);
  return Math.hypot(x - enemy.position.x, y - enemy.position.y) <= threshold;
}

export function nearestEnemyDistance(x, y, enemies) {
  let distance = Infinity;
  for (const enemy of enemies) {
    distance = Math.min(distance, Math.hypot(x - enemy.position.x, y - enemy.position.y));
  }
  return distance;
}
