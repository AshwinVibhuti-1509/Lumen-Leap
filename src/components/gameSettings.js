/** Competition settings are deliberately data-only: easy to test and rebalance. */
export const THEMES = Object.freeze({
  twilight: {
    label: 'Enchanted Twilight', sky: 0x171f47, fog: 0x2e375d,
    grass: [0x284a68, 0x324e6b], leaf: 0x368a78, leafAlt: 0x7150a0,
    bloom: [0xffd782, 0xc9a6ff, 0x8df6f0], ambient: 1.72,
    sun: 0x9ac6ff, sunIntensity: 1.35, accent: '#92f8df',
  },
  fantasy: {
    label: 'Colorful Fantasy', sky: 0x85d3ff, fog: 0xd0f4ff,
    grass: [0x84c86f, 0x9bd984], leaf: 0x53a971, leafAlt: 0xeb86a4,
    bloom: [0xffd873, 0xfc8bc0, 0xb3e0ff], ambient: 1.8,
    sun: 0xfff2c1, sunIntensity: 1.55, accent: '#f9dc83',
  },
  marsh: {
    label: 'Moonlit Marsh', sky: 0x162f53, fog: 0x3a6381,
    grass: [0x27677f, 0x35778e], leaf: 0x388b8d, leafAlt: 0x77b7cc,
    bloom: [0xb4f4ff, 0xffe59f, 0xc4b8ff], ambient: 1.74,
    sun: 0x8edbf9, sunIntensity: 1.38, accent: '#a2e7ff',
  },
  forest: {
    label: 'Mystical Forest', sky: 0x173b32, fog: 0x366347,
    grass: [0x2b6849, 0x316f4f], leaf: 0x286d52, leafAlt: 0x499b88,
    bloom: [0xa7f4a3, 0x81d7ff, 0xd0b5ff], ambient: 1.85,
    sun: 0xb3ffe0, sunIntensity: 1.45, accent: '#b5f6b2',
  },
});
export const DIFFICULTIES = Object.freeze({
  easy: { label: 'Explorer', start: 2, max: 8, spawn: 6.3, speed: 14, growth: 0.65 },
  normal: { label: 'Adventurer', start: 4, max: 13, spawn: 4.2, speed: 19, growth: 0.86 },
  hard: { label: 'Nightmare', start: 6, max: 18, spawn: 2.8, speed: 24, growth: 1.04 },
});
export function difficultyStats(name = 'normal', score = 0) {
  const d = DIFFICULTIES[name] ?? DIFFICULTIES.normal;
  const safeScore = Math.max(0, Number.isFinite(score) ? score : 0);
  const growth = Math.min(1, safeScore * 0.0025);
  return {
    maxEnemies: d.max,
    startingEnemies: d.start,
    enemySpeed: d.speed * (1 + growth * d.growth),
    spawnDelay: Math.max(1.05, d.spawn * (1 - growth * 0.48)),
    attackRadius: 65 * (1 + growth * 0.12),
    playerSpeed: 2.5 * (1 + growth * 0.12),
    attackCooldown: Math.max(0.65, 1 - growth * 0.15),
  };
}
