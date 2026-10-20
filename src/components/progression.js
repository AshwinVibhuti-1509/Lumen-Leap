/** Progression is tied to the three collectible lights; difficulty remains an independent choice. */
export const STAGES = Object.freeze([
  { title:'THE AWAKENING', subtitle:'Find the first light', speed:1, spawn:1, capBonus:0, wave:0 },
  { title:'THE SWARM', subtitle:'The garden fights back', speed:1.16, spawn:0.78, capBonus:3, wave:3 },
  { title:'THE FINAL GLOW', subtitle:'Light the way home', speed:1.34, spawn:0.62, capBonus:5, wave:5 },
  { title:'THE ESCAPE', subtitle:'Reach the portal', speed:1.48, spawn:0.56, capBonus:7, wave:5 },
]);
export function stageIndex(collected) { return Math.max(0, Math.min(3, Math.floor(Number(collected) || 0))); }
export function stageFor(collected) { return STAGES[stageIndex(collected)]; }
export function waveSize(collected, mode='normal') {
  const scale = mode==='easy' ? 0.6 : mode==='hard' ? 1.35 : 1;
  return Math.round(stageFor(collected).wave*scale);
}
export function stageDifficulty(base, collected) {
  const stage=stageFor(collected);
  return { ...base, enemySpeed:base.enemySpeed*stage.speed,
    spawnDelay:Math.max(0.8,base.spawnDelay*stage.spawn),
    maxEnemies:base.maxEnemies+stage.capBonus };
}
