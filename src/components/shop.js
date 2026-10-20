import { careerDefaults, normalizeCareer, normalizeRecords, ACHIEVEMENTS } from './Records.js';
/** Cosmetic-only currency: no payments, no external services. */
export const SAVE_KEY = 'lumen-leap-v4-local-save';
export const ITEMS = Object.freeze([
  {id:'classic',kind:'frog',label:'Classic Tode',price:0,color:0x38c777,icon:'🐸'},
  {id:'sunset',kind:'frog',label:'Sunset Orange',price:30,color:0xff914d,icon:'🟠'},
  {id:'midnight',kind:'frog',label:'Midnight Tode',price:60,color:0x6d94e6,icon:'🌙'},
  {id:'golden',kind:'frog',label:'Golden Tode',price:120,color:0xf1ca51,icon:'✨'},
  {id:'lumo',kind:'lizard',label:'Emerald Lumo',price:0,color:0x4ce8d6,icon:'🦎'},
  {id:'crystal',kind:'lizard',label:'Crystal Lumo',price:50,color:0x9a8dfb,icon:'💎'},
  {id:'lumoGold',kind:'lizard',label:'Golden Lumo',price:90,color:0xffd86d,icon:'🌟'},
  {id:'toad',kind:'character',label:'Orange Toad',price:80,color:0xf49046,icon:'🐸'},
  {id:'spider',kind:'character',label:'Garden Spider',price:140,color:0xaa7bea,icon:'🕷️'},
  {id:'dragonfly',kind:'character',label:'Sky Dragonfly',price:180,color:0x61dbe9,icon:'🦋'},
]);
export const AVATARS=Object.freeze(['🐸','🦎','🕷️','🦋','🌳','🐝','🍄','✨']);
export function blankSave(){ return {coins:0,unlocked:['classic','lumo'],equipped:{frog:'classic',lizard:'lumo',character:'classic'},name:'Explorer',avatar:'🐸',best:0,career:careerDefaults(),records:[],achievements:[]}; }
export function normalizeSave(value){
  const state=blankSave();
  if(!value||typeof value!=='object')return state;
  state.coins=Math.min(999999,Math.max(0,Math.floor(Number(value.coins)||0)));
  state.best=Math.min(9999999,Math.max(0,Math.floor(Number(value.best)||0)));
  state.name=String(value.name??'Explorer').trim().slice(0,18)||'Explorer';
  state.career=normalizeCareer(value.career);
  state.records=normalizeRecords(value.records);
  state.achievements=Array.isArray(value.achievements) ? [...new Set(value.achievements)].filter(id=>ACHIEVEMENTS.some(a=>a.id===id)) : [];
  state.avatar=AVATARS.includes(value.avatar)?value.avatar:'🐸';
  state.unlocked=[...new Set(['classic','lumo',...(Array.isArray(value.unlocked)?value.unlocked:[])])].filter(id=>ITEMS.some(i=>i.id===id));
  for(const kind of ['frog','lizard','character']){
    const choice=value.equipped?.[kind];
    if(state.unlocked.includes(choice) && ITEMS.some(i=>i.id===choice&&(i.kind===kind||kind==='character'&&choice==='classic')))state.equipped[kind]=choice;
  }
  return state;
}
export function buyOrEquip(save,id){
  const item=ITEMS.find(i=>i.id===id);if(!item)return {ok:false,message:'Unknown item'};
  if(!save.unlocked.includes(id)){
    if(save.coins<item.price)return {ok:false,message:`Need ${item.price-save.coins} more gold`};
    save.coins-=item.price;save.unlocked.push(id);
  }
  save.equipped[item.kind]=id;
  if(item.kind==='frog')save.equipped.character='classic';
  if(item.kind==='character')save.equipped.frog='classic';
  return {ok:true,message:`${item.label} equipped!`};
}
export function itemColor(id){return ITEMS.find(i=>i.id===id)?.color??0x38c777;}
