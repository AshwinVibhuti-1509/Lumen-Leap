/**
 * Scatter houses through the playable map, with a few near the opening view
 * and others farther away. Keep safe space around the frog and bee spawns.
 * No Three.js dependencies: this function can be tested independently.
 */
export const HOUSE_COUNT = 8;
export const PLAYER_CLEARANCE = 195;
export const SPAWN_CLEARANCE = 145;
export const HOUSE_SEPARATION = 190;

export function generateHousePlacements(spawnLocations, rng = Math.random) {
  const placements = [];
  let attempts = 0;
  const MAX_ATTEMPTS = 1600;
  while (placements.length < HOUSE_COUNT && attempts < MAX_ATTEMPTS) {
    attempts += 1;
    // Approx. 3 homes near the initial camera view, the rest across the map.
    const nearStart = placements.length < 3;
    const radius = nearStart ? 220 + rng() * 110 : 330 + rng() * 210;
    const angle = rng() * Math.PI * 2;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    if (Math.abs(x) > 530 || Math.abs(y) > 530) continue;
    if (Math.hypot(x, y) < PLAYER_CLEARANCE) continue;
    if (spawnLocations.some((spawn) =>
      Math.hypot(x - spawn.x, y - spawn.y) < SPAWN_CLEARANCE)) continue;
    if (placements.some((house) =>
      Math.hypot(x - house.x, y - house.y) < HOUSE_SEPARATION)) continue;
    placements.push({ x, y, turns: Math.floor(rng() * 4) });
  }
  if (placements.length < HOUSE_COUNT) {
    console.warn(`Only generated ${placements.length}/${HOUSE_COUNT} houses safely.`);
  }
  return placements;
}
