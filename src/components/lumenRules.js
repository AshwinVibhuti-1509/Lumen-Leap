/**
 * Grid-aligned objectives make every firefly reachable with the player's
 * 50-unit cardinal hops. Breadth-first search excludes house footprints.
 * Pure JS: safe to test without starting WebGL or loading assets.
 */
export const HOP_SIZE = 50;
export const REQUIRED_FIREFLIES = 3;
export const MAX_HEARTS = 3;
export const DAMAGE_INVULNERABILITY = 2.0;
export const GUARDIAN_DURATION = 5;
export const GUARDIAN_COOLDOWN = 15;
// Center-coordinate arena limit: a 50-unit hop can reach x/y=500, not 550.
export const ARENA_HALF_EXTENT = 520;
export const KILLS_PER_HEART = 5;

export function isInsideArena(x, y, playerRadius = 0) {
  if (![x, y, playerRadius].every(Number.isFinite) || playerRadius < 0) return false;
  return Math.abs(x) + playerRadius <= ARENA_HALF_EXTENT &&
         Math.abs(y) + playerRadius <= ARENA_HALF_EXTENT;
}

/** Keep moving agents inside the same arena as Tode. */
export function clampToArena(x, y, radius = 0) {
  const limit = Math.max(0, ARENA_HALF_EXTENT - Math.max(0, radius));
  return { x: Math.max(-limit, Math.min(limit, x)),
           y: Math.max(-limit, Math.min(limit, y)) };
}

// Milestone only: skip the bonus when already at full health, no banked heal.
export function earnsHeartOnKill(defeated, hearts) {
  return Number.isInteger(defeated) && defeated > 0 &&
         defeated % KILLS_PER_HEART === 0 && hearts > 0 && hearts < MAX_HEARTS;
}


export function selectFireflyLocations(isBlocked, hop = HOP_SIZE) {
  const key = (x, y) => `${x},${y}`;
  const queue = [{ x: 0, y: 0 }];
  const seen = new Set([key(0, 0)]);
  const reachable = [];
  for (let index = 0; index < queue.length; index += 1) {
    const { x, y } = queue[index];
    if (Math.hypot(x, y) >= hop * 3.7 &&
        Math.hypot(x, y) <= hop * 7.4 && !isBlocked(x, y, 32)) {
      reachable.push({ x, y });
    }
    for (const [dx, dy] of [[hop,0],[-hop,0],[0,hop],[0,-hop]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (Math.abs(nx) > hop * 8 || Math.abs(ny) > hop * 8) continue;
      const id = key(nx, ny);
      if (seen.has(id) || isBlocked(nx, ny, 19)) continue;
      seen.add(id);
      queue.push({ x: nx, y: ny });
    }
  }
  const targets = [
    { x: hop * 5, y: hop },
    { x: -hop * 4, y: hop * 4 },
    { x: -hop * 4, y: -hop * 4 },
  ];
  const picked = [];
  for (const target of targets) {
    const valid = reachable
      .filter((p) => picked.every((other) => Math.hypot(p.x-other.x, p.y-other.y) >= hop * 3.5))
      .sort((a, b) => Math.hypot(a.x-target.x, a.y-target.y) -
                         Math.hypot(b.x-target.x, b.y-target.y));
    if (valid.length) picked.push(valid[0]);
  }
  if (picked.length !== REQUIRED_FIREFLIES) {
    throw new Error('Not enough reachable safe locations for three fireflies.');
  }
  return picked;
}

export function nextKillCombo(elapsed, lastKillAt, previousCombo, comboWindow = 4) {
  if (![elapsed, lastKillAt, previousCombo, comboWindow].every(Number.isFinite)) return 1;
  if (elapsed < lastKillAt || elapsed - lastKillAt > comboWindow) return 1;
  return Math.min(4, Math.max(0, Math.floor(previousCombo)) + 1);
}

export function readyToSummon(elapsed, lastSummon, cooldown = GUARDIAN_COOLDOWN) {
  return elapsed - lastSummon >= cooldown;
}

export function canTakeDamage(invulnerabilityRemaining, hearts) {
  return invulnerabilityRemaining <= 0 && hearts > 0;
}
