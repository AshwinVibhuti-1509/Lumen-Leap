/** Local-only career records and achievement rules (no server or leaderboard claims). */
export const ACHIEVEMENTS = Object.freeze([
  {id:'first-light', icon:'✨', title:'First Light', description:'Rescue a firefly.'},
  {id:'bee-buster', icon:'🐝', title:'Bee Buster', description:'Defeat 25 bees across runs.'},
  {id:'guardians-call', icon:'🦎', title:"Guardian's Call", description:'Summon Lumo ten times.'},
  {id:'untouchable', icon:'❤️', title:'Untouchable', description:'Win with all three hearts.'},
  {id:'garden-savior', icon:'🌸', title:'Garden Savior', description:'Complete an adventure.'},
  {id:'nightmare', icon:'🔥', title:'Nightmare Survivor', description:'Win on Nightmare.'},
]);
export function careerDefaults(){return {kills:0,summons:0,wins:0};}
export function normalizeCareer(raw){
  const data=raw&&typeof raw==='object'?raw:{};
  const bounded=v=>Math.max(0,Math.min(999999,Math.floor(Number(v)||0)));
  return {kills:bounded(data.kills),summons:bounded(data.summons),wins:bounded(data.wins)};
}
export function normalizeRecords(records){
  if(!Array.isArray(records))return [];
  return records.slice(0,30).filter(r=>r&&typeof r==='object').map(r=>({
    name:String(r.name??'Explorer').slice(0,18),
    avatar:String(r.avatar??'🐸').slice(0,8),
    score:Math.max(0,Math.min(9999999,Math.floor(Number(r.score)||0))),
    realm:String(r.realm??'twilight').slice(0,20),
    difficulty:String(r.difficulty??'normal').slice(0,15),
    duration:Math.max(0,Math.min(999999,Math.floor(Number(r.duration)||0))),
    won:Boolean(r.won),
  })).sort((a,b)=>b.score-a.score||a.duration-b.duration).slice(0,5);
}
export function addRecord(save,record){save.records=normalizeRecords([...(save.records||[]),record]);}
export function checkAchievements(save,{lights=0,won=false,hearts=0,difficulty='normal'}={}){
  const next=[];
  const owned=new Set(save.achievements||[]);
  const conditions={
    'first-light':lights>=1,'bee-buster':save.career.kills>=25,
    'guardians-call':save.career.summons>=10,'untouchable':won&&hearts>=3,
    'garden-savior':won,'nightmare':won&&difficulty==='hard',
  };
  for(const rule of ACHIEVEMENTS)if(conditions[rule.id]&&!owned.has(rule.id)){
    owned.add(rule.id);next.push(rule);
  }
  save.achievements=[...owned].filter(id=>ACHIEVEMENTS.some(a=>a.id===id));
  return next;
}
