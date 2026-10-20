import * as THREE from 'three';
import Camera from './components/Camera.js';
import Enemy from './components/Enemy.js';
import Map from './components/Map.js';
import Player from './components/Player.js';
import Renderer from './components/Renderer.js';
import Guardian from './components/Guardian.js';
import GardenDecor from './components/GardenDecor.js';
import Elixir from './components/Elixir.js';
import GameAudio from './components/GameAudio.js';
import { Firefly, EscapePortal } from './components/LumenObjects.js';
import GardenRestoration from './components/GardenRestoration.js';
import RealmMechanics from './components/RealmMechanics.js';
import FeedbackFX from './components/FeedbackFX.js';
import { ACHIEVEMENTS, addRecord, checkAchievements } from './components/Records.js';
import { circlesOverlap } from './components/collision.js';
import { touchesEnemyAt } from './components/contactRules.js';
import { THEMES, DIFFICULTIES, difficultyStats } from './components/gameSettings.js';
import { stageFor, stageIndex, stageDifficulty, waveSize } from './components/progression.js';
import { ITEMS, AVATARS, SAVE_KEY, normalizeSave, buyOrEquip, itemColor } from './components/shop.js';
import { selectFireflyLocations, REQUIRED_FIREFLIES, MAX_HEARTS,
  DAMAGE_INVULNERABILITY, GUARDIAN_DURATION, GUARDIAN_COOLDOWN,
  canTakeDamage, readyToSummon, isInsideArena, earnsHeartOnKill, KILLS_PER_HEART, nextKillCombo } from './components/lumenRules.js';
import './style.css';

// LUMEN LEAP: built from the JetBrains Academy Three.js tutorial.
// Competition additions: themed gardens, selectable difficulty, collecting,
// portal, guardian, hearts, elixir, effects, sound, and accessible game menus.
const SPAWNS = [
  {x:-125,y:-125},{x:-125,y:125},{x:125,y:-125},{x:125,y:125},
  {x:-260,y:0},{x:260,y:0},{x:0,y:-260},{x:0,y:260},
  {x:-265,y:-240},{x:-265,y:240},{x:265,y:-240},{x:265,y:240},
];
const SCORE_PER_SECOND=.1, SCORE_PER_KILL=10, SCORE_PER_FIREFLY=25;
const COINS_PER_BEE=3, GUARDIAN_KILL_LIMIT=4;
const COLLISION_GAP=6, ATTACK_DURATION=.22;
// Match visible bee bodies and their XY collision discs. Player still has
// damage invulnerability so a stationary frog doesn't instantly lose 3 hearts.
const VISIBLE_CONTACT_PADDING=15;
const ELIXIR_INTERVAL=120, ELIXIR_LIFETIME=40, ELIXIR_COLLECT_RADIUS=32;
const scene=new THREE.Scene(), clock=new THREE.Clock();
const ambient=new THREE.AmbientLight(0xffffff,1.72);scene.add(ambient);
const sun=new THREE.DirectionalLight(0x9ac6ff,1.35);
sun.position.set(-100,-100,200);sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-450;sun.shadow.camera.right=450;
sun.shadow.camera.top=450;sun.shadow.camera.bottom=-450;scene.add(sun);
const map=new Map(SPAWNS);scene.add(map);
const player=new Player(),camera=new Camera();player.add(camera);scene.add(player);
const guardian=new Guardian();scene.add(guardian);
const portal=new EscapePortal(0,0);scene.add(portal);
const audio=new GameAudio();
const fireflySpots=selectFireflyLocations((x,y,r)=>map.collidesWithHouse(x,y,r,COLLISION_GAP));
const decor=new GardenDecor(map.houses,SPAWNS,fireflySpots);scene.add(decor);
let fireflies=[];
function makeFireflies(){
  for(const obj of fireflies)scene.remove(obj);
  fireflies=fireflySpots.map((pos,i)=>new Firefly(pos.x,pos.y,i));
  for(const f of fireflies)scene.add(f);
}
makeFireflies();
const restoration=new GardenRestoration(fireflySpots);scene.add(restoration);
const realmMechanics=new RealmMechanics();scene.add(realmMechanics);
const feedback=new FeedbackFX();scene.add(feedback);

// Sound is opt-in after a user gesture; no copyrighted audio files are used.
const menu=document.createElement('section');menu.className='start-menu';
menu.innerHTML=`<div class="wizard-shell">
  <header class="wizard-header">
    <div class="wizard-brand"><span class="wizard-sigil">✦</span><span>LUMEN <em>LEAP</em><small>RESTORE THE LIGHT</small></span></div>
    <div class="wizard-progress" aria-label="Game setup progress"><span data-progress="0">01 <b>Challenge</b></span><span data-progress="1">02 <b>World</b></span><span data-progress="2">03 <b>Explorer</b></span></div>
    <div class="wizard-wallet" aria-live="polite">🪙 <strong id="menu-coins">0</strong> <span>GOLD</span></div>
  </header>
  <div class="wizard-page" data-step="0">
    <div class="wizard-intro"><div class="eyebrow">YOUR LEGEND BEGINS HERE</div><h1>How brave is your heart?</h1><p>Every rescued light awakens a tougher swarm. Pick the pace that's right for you.</p></div>
    <fieldset class="wizard-difficulties"><legend class="sr-only">Choose difficulty</legend>
      <label class="difficulty-card"><input type="radio" name="difficulty" value="easy"><span class="difficulty-icon">🌱</span><strong>Explorer</strong><small>Take in the magic</small><span class="difficulty-facts">2 starting bees · gentle pursuit · 8 max</span><span class="difficulty-pill">RELAXED</span></label>
      <label class="difficulty-card"><input type="radio" name="difficulty" value="normal" checked><span class="difficulty-icon">⚔️</span><strong>Adventurer</strong><small>The full journey</small><span class="difficulty-facts">4 starting bees · growing swarms · 13 max</span><span class="difficulty-pill">RECOMMENDED</span></label>
      <label class="difficulty-card"><input type="radio" name="difficulty" value="hard"><span class="difficulty-icon">🔥</span><strong>Nightmare</strong><small>Only the bold survive</small><span class="difficulty-facts">6 starting bees · fierce pursuit · 18 max</span><span class="difficulty-pill">CHALLENGE</span></label>
    </fieldset>
    <div class="wizard-info">❤️ Three hearts · 🦎 Lumo fights beside you · ✨ Three lights to rescue</div>
  </div>
  <div class="wizard-page" data-step="1" hidden>
    <div class="wizard-intro"><div class="eyebrow">CHOOSE YOUR DESTINATION</div><h1>Four gardens. Four stories.</h1><p>Every realm has different scenery and a unique gameplay interaction.</p></div>
    <div class="world-showcase"><div class="world-live"><canvas class="world-live-canvas" width="600" height="360" aria-label="Fixed overview of the selected world"></canvas><div class="world-live-caption"><span>✦ GARDEN OVERVIEW · ORIGINAL STARTING VIEW</span><strong class="world-live-name">Enchanted Twilight</strong><p class="world-live-description">Follow luminous flowers to reveal hidden sparks.</p></div></div>
    <fieldset class="world-list"><legend class="sr-only">Choose world</legend>
      <label class="world-option" data-world="twilight"><input type="radio" name="theme" value="twilight" checked><span class="world-thumbnail twilight-thumb">✧</span><span><strong>Enchanted Twilight</strong><small>Crystal blossoms & guiding lanterns</small></span><i>↗</i></label>
      <label class="world-option" data-world="fantasy"><input type="radio" name="theme" value="fantasy"><span class="world-thumbnail fantasy-thumb">✿</span><span><strong>Colorful Fantasy</strong><small>Bounce blooms & rainbow meadows</small></span><i>↗</i></label>
      <label class="world-option" data-world="forest"><input type="radio" name="theme" value="forest"><span class="world-thumbnail forest-thumb">♠</span><span><strong>Mystical Forest</strong><small>Stealth among ancient evergreens</small></span><i>↗</i></label>
      <label class="world-option" data-world="marsh"><input type="radio" name="theme" value="marsh"><span class="world-thumbnail marsh-thumb">☾</span><span><strong>Moonlit Marsh</strong><small>Lily-pad sanctuary & glowing pools</small></span><i>↗</i></label>
    </fieldset></div>
  </div>
  <div class="wizard-page" data-step="2" hidden>
    <div class="wizard-intro"><div class="eyebrow">LAST STOP BEFORE THE GARDEN</div><h1>Who will save the light?</h1><p>Choose an explorer name and orbit through your profile emblems. Cosmetic heroes are equipped at the Market.</p></div>
    <div class="profile-layout"><div class="orbit-card"><div class="orbit-label">CHOOSE YOUR EMBLEM</div><div class="avatar-orbit" tabindex="0" role="group" aria-label="Profile icons. Use left or right arrow keys, or select an orbiting icon."><div class="orbit-ring"></div><button type="button" class="avatar-prev" aria-label="Previous profile icon">‹</button><div class="avatar-center"><span class="avatar-center-icon" aria-live="polite">🐸</span><small class="avatar-center-name">Frog</small></div><button type="button" class="avatar-next" aria-label="Next profile icon">›</button><div class="avatar-planets"></div></div><div class="orbit-help">Hover to preview · Click to select · ← → to navigate</div></div>
      <div class="profile-fields"><label for="player-nickname">EXPLORER NAME</label><input id="player-nickname" type="text" maxlength="18" placeholder="What shall we call you?" autocomplete="off" aria-describedby="name-help"><small id="name-help">1–18 characters. Saved only on this browser.</small><label for="profile-avatar">SELECTED EMBLEM</label><select id="profile-avatar" aria-label="Choose avatar"></select><div class="identity-ticket"><span>EXPLORER PASS</span><strong class="ticket-name">Explorer</strong><small class="ticket-world">Enchanted Twilight · Adventurer</small></div></div></div>
  </div>
  <div class="wizard-footer"><button type="button" class="wizard-help">❔ HOW TO PLAY</button><div class="wizard-navigation"><button type="button" class="wizard-back secondary-button" hidden>← BACK</button><button type="button" class="wizard-next primary-button">CONTINUE →</button><button type="button" class="menu-start primary-button" hidden>START MY ADVENTURE →</button></div><div class="wizard-store-actions"><button type="button" class="wizard-records">🏆 RECORDS</button><button type="button" class="open-shop wizard-market">🛍️ SHOP & INVENTORY</button></div></div>
  <p class="wizard-footnote">An original Three.js adventure developed from the JetBrains Academy project · All cosmetics earned in-game</p>
</div>`;
document.body.append(menu);
// Persistent cosmetics and player identity are stored locally; never transmitted.
let save;
try { save=normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY)||'null')); }
catch { save=normalizeSave(null); }
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));}catch{/* private mode: session only */}}
const nameInput=menu.querySelector('#player-nickname');
const avatarSelect=menu.querySelector('#profile-avatar');
nameInput.value=save.name;
for(const icon of AVATARS){const opt=document.createElement('option');opt.value=icon;opt.textContent=`${icon}  ${icon==='🐸'?'Frog':icon==='🦎'?'Lizard':icon==='🕷️'?'Spider':icon==='🦋'?'Butterfly':icon==='🌳'?'Tree':icon==='🐝'?'Bee':icon==='🍄'?'Mushroom':'Starlight'}`;avatarSelect.append(opt);}
avatarSelect.value=save.avatar;
const avatarNames=['Frog','Lizard','Spider','Butterfly','Tree','Bee','Mushroom','Starlight'];
let wizardStep=0, avatarPreviewIndex=AVATARS.indexOf(save.avatar);
const wizardPages=[...menu.querySelectorAll('.wizard-page')];
const avatarCenter=menu.querySelector('.avatar-center-icon');
const avatarCenterName=menu.querySelector('.avatar-center-name');
const orbit=menu.querySelector('.avatar-orbit');
const planets=menu.querySelector('.avatar-planets');
const orbitButtons=AVATARS.map((icon,i)=>{
  const b=document.createElement('button');b.type='button';b.className='orbit-planet';b.textContent=icon;
  b.setAttribute('aria-label',`Select ${avatarNames[i]} avatar`);
  const theta=(-90+i*360/AVATARS.length)*Math.PI/180;
  b.style.setProperty('--orbit-x',`${Math.cos(theta)*41}%`);
  b.style.setProperty('--orbit-y',`${Math.sin(theta)*41}%`);
  b.style.left=`${50+Math.cos(theta)*37}%`;b.style.top=`${50+Math.sin(theta)*37}%`;
  b.addEventListener('pointerenter',()=>previewAvatar(i));
  b.addEventListener('focus',()=>previewAvatar(i));
  b.addEventListener('click',()=>commitAvatar(i));
  planets.append(b);return b;
});
function previewAvatar(index){avatarPreviewIndex=(index+AVATARS.length)%AVATARS.length;
  avatarCenter.textContent=AVATARS[avatarPreviewIndex];avatarCenterName.textContent=avatarNames[avatarPreviewIndex];
  for(let i=0;i<orbitButtons.length;i++)orbitButtons[i].classList.toggle('previewing',i===avatarPreviewIndex);
}
function commitAvatar(i){previewAvatar(i);avatarSelect.value=AVATARS[avatarPreviewIndex];syncProfile();updateTicket();}
function stepAvatar(d){commitAvatar(AVATARS.indexOf(avatarSelect.value)+d);}
menu.querySelector('.avatar-prev').addEventListener('click',()=>stepAvatar(-1));
menu.querySelector('.avatar-next').addEventListener('click',()=>stepAvatar(1));
orbit.addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea'))return;
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();stepAvatar(e.key==='ArrowRight'?1:-1);}});
orbit.addEventListener('pointerleave',()=>previewAvatar(AVATARS.indexOf(avatarSelect.value)));
function updateTicket(){menu.querySelector('.ticket-name').textContent=nameInput.value.trim()||'Explorer';
  const t=menu.querySelector('input[name="theme"]:checked')?.value||'twilight';
  const d=menu.querySelector('input[name="difficulty"]:checked')?.value||'normal';
  menu.querySelector('.ticket-world').textContent=`${THEMES[t].label} · ${DIFFICULTIES[d].label}`;
}
nameInput.addEventListener('input',updateTicket);
function setWizardStep(step){wizardStep=Math.max(0,Math.min(2,step));
  wizardPages.forEach((p,i)=>p.hidden=i!==wizardStep);
  menu.querySelectorAll('[data-progress]').forEach((x,i)=>x.classList.toggle('active',i===wizardStep));
  menu.querySelector('.wizard-back').hidden=wizardStep===0;
  menu.querySelector('.wizard-next').hidden=wizardStep===2;
  menu.querySelector('.menu-start').hidden=wizardStep!==2;
  updateTicket();
}
menu.querySelector('.wizard-back').addEventListener('click',()=>setWizardStep(wizardStep-1));
menu.querySelector('.wizard-next').addEventListener('click',()=>setWizardStep(wizardStep+1));
menu.querySelectorAll('input[name="theme"],input[name="difficulty"]').forEach(r=>r.addEventListener('change',updateTicket));
setWizardStep(0);previewAvatar(avatarPreviewIndex);
menu.querySelector('.wizard-records').addEventListener('click',()=>{renderRecords();recordsPanel.hidden=false;});

function syncProfile(){save.name=nameInput.value.trim().slice(0,18)||'Explorer';save.avatar=avatarSelect.value;persist();}
nameInput.addEventListener('change',syncProfile);avatarSelect.addEventListener('change',syncProfile);
const shopPanel=document.createElement('section');shopPanel.className='shop-overlay';shopPanel.hidden=true;
shopPanel.innerHTML=`<div class="shop-card"><div class="shop-header"><div><div class="eyebrow">LUMEN LEAP · COLLECTION</div><h2>🛍️ The Moonlight Market</h2><p>Spend gold earned from defeating bees. Cosmetics stay unlocked on this browser.</p></div><button type="button" class="secondary-button close-shop">✕ Close</button></div><div class="shop-wallet"></div><button class="secondary-button open-records" type="button">🏆 ACHIEVEMENTS & RECORDS</button><div class="shop-categories" role="tablist" aria-label="Shop categories"><button type="button" class="shop-tab" data-kind="frog">🐸 Frog Skins</button><button type="button" class="shop-tab" data-kind="lizard">🦎 Lumo Skins</button><button type="button" class="shop-tab" data-kind="character">✨ Playable Heroes</button></div><div class="shop-items"></div><p class="shop-status" role="status"></p></div>`;
document.body.append(shopPanel);
function updateWallet(){menu.querySelector('#menu-coins').textContent=save.coins;shopPanel.querySelector('.shop-wallet').textContent=`🪙 ${save.coins} gold · Best score: ${save.best}`;}
let activeShopCategory='frog';
function renderShop(){updateWallet();shopPanel.querySelectorAll('.shop-tab').forEach(b=>{const on=b.dataset.kind===activeShopCategory;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));b.setAttribute('role','tab');});const list=shopPanel.querySelector('.shop-items');list.replaceChildren();
for(const item of ITEMS.filter(item=>item.kind===activeShopCategory)){const card=document.createElement('div');card.className='shop-item';
const owned=save.unlocked.includes(item.id),equipped=save.equipped[item.kind]===item.id;
const heading=document.createElement('div');heading.className='shop-item-heading';heading.textContent=`${item.icon} ${item.label}`;
const type=document.createElement('small');type.textContent=item.kind==='character'?'PLAYABLE HERO':item.kind==='frog'?'FROG SKIN':'LUMO SKIN';
const button=document.createElement('button');button.type='button';button.className=equipped?'shop-equipped':'shop-purchase';button.textContent=equipped?'✓ Equipped':owned?'Equip':`🪙 ${item.price}`;button.disabled=equipped;
button.addEventListener('click',()=>{const res=buyOrEquip(save,item.id);shopPanel.querySelector('.shop-status').textContent=res.message;if(res.ok){persist();applyCosmetics();}renderShop();});
card.append(heading,type,button);list.append(card);
}}
shopPanel.querySelector('.open-records').addEventListener('click',()=>{renderRecords();recordsPanel.hidden=false;});
function applyCosmetics(){player.applyAppearance(save.equipped.character,save.equipped.frog,itemColor(save.equipped.frog));guardian.setSkin(itemColor(save.equipped.lizard));}
shopPanel.querySelectorAll('.shop-tab').forEach(b=>b.addEventListener('click',()=>{activeShopCategory=b.dataset.kind;renderShop();}));
menu.querySelector('.open-shop').addEventListener('click',()=>{syncProfile();renderShop();shopPanel.hidden=false;});
shopPanel.querySelector('.close-shop').addEventListener('click',()=>{shopPanel.hidden=true;updateWallet();});
updateWallet();

// A concise accessible field guide from every setup slide and during play.
const guide=document.createElement('section');guide.className='guide-overlay';guide.hidden=true;
guide.innerHTML=`<div class="guide-card" role="dialog" aria-modal="true" aria-label="How to play Lumen Leap"><div class="guide-top"><div><div class="eyebrow">THE FIELD MANUAL · PRESS H</div><h2>Welcome to the garden</h2><p>Every light you rescue changes the world around you.</p></div><button type="button" class="secondary-button guide-close" aria-label="Close guide">✕ CLOSE</button></div><div class="guide-grid"><article><strong>01 · HOP</strong><p>Use ↑ ↓ ← →. Trees block your path and conceal you from distant bees. The glowing garden border marks the playable area.</p></article><article><strong>02 · MAGIC PULSE</strong><p>Press Space to knock away nearby bees. Defeat enemies quickly to build a score combo and earn gold. Every fifth bee defeat restores one missing heart (maximum three).</p></article><article><strong>03 · LUMO</strong><p>Press E to summon Lumo for 5 seconds. He defeats up to four enemies and recharges in 15 seconds.</p></article><article><strong>04 · RESTORE</strong><p>Rescue all three fireflies. Watch the garden bloom, survive three stages, and return to the portal.</p></article><article><strong>05 · SECRET POWERS</strong><p>Twilight: lantern blessings. Fantasy: bounce blooms. Forest: tree cover. Marsh: lily-pad sanctuary.</p></article><article><strong>06 · COLLECT</strong><p>Find elixirs to recover hearts, spend earned gold on skins and heroes, and unlock achievements.</p></article></div><div class="guide-bottom"><button type="button" class="primary-button guide-got-it">GOT IT · LET'S PLAY</button></div></div>`;
document.body.append(guide);
let guidePausedGame=false;
function showGuide(){if(!guide.hidden)return;guidePausedGame=gameState==='playing';if(guidePausedGame)pauseGame();guide.hidden=false;}
function guideClose(){guide.hidden=true;if(guidePausedGame&&gameState==='paused')pauseGame();guidePausedGame=false;}
menu.querySelector('.wizard-help').addEventListener('click',showGuide);
for(const b of guide.querySelectorAll('.guide-close,.guide-got-it'))b.addEventListener('click',guideClose);

// Top-five PERSONAL browser records, not an online leaderboard.
const recordsPanel=document.createElement('section');recordsPanel.className='guide-overlay';recordsPanel.hidden=true;
recordsPanel.innerHTML=`<div class="guide-card records-card" role="dialog" aria-modal="true" aria-label="Local records"><div class="guide-top"><div><div class="eyebrow">LUMEN LEAP · YOUR CHRONICLES</div><h2>🏆 Garden legends</h2><p>Best five runs on this browser.</p></div><button class="secondary-button records-close" type="button">✕ CLOSE</button></div><div class="records-list"></div><div class="achievements-list"></div></div>`;
document.body.append(recordsPanel);
recordsPanel.querySelector('.records-close').addEventListener('click',()=>{recordsPanel.hidden=true;});
function renderRecords(){
  const list=recordsPanel.querySelector('.records-list');list.replaceChildren();
  if(!save.records?.length){const p=document.createElement('p');p.textContent='No records yet. Rescue the garden to create your first record!';list.append(p);}
  for(const [i,record] of (save.records||[]).entries()){
    const row=document.createElement('div');row.className='records-row';
    const number=document.createElement('span');number.textContent=`#${i+1}`;
    const name=document.createElement('div');const label=document.createElement('strong');label.textContent=`${record.avatar} ${record.name}`;
    const meta=document.createElement('small');meta.textContent=`${record.won?'✓ Completed':'◇ Attempt'} · ${THEMES[record.realm]?.label||'Garden'} · ${DIFFICULTIES[record.difficulty]?.label||'Adventurer'} · ${record.duration}s`;
    name.append(label,document.createElement('br'),meta);
    const points=document.createElement('strong');points.textContent=record.score.toLocaleString();row.append(number,name,points);list.append(row);
  }
  const badges=recordsPanel.querySelector('.achievements-list');badges.replaceChildren();
  for(const a of ACHIEVEMENTS){const div=document.createElement('div');div.className='achievement'+(!save.achievements.includes(a.id)?' locked':'');
    const title=document.createElement('b');title.textContent=`${a.icon} ${a.title} ${save.achievements.includes(a.id)?'✓':'🔒'}`;
    const desc=document.createElement('small');desc.textContent=a.description;div.append(title,desc);badges.append(div);
  }
}

for(const modal of [guide,recordsPanel,shopPanel])modal.addEventListener('click',e=>{if(e.target===modal){if(modal===guide)guideClose();else modal.hidden=true;}});

// Short in-engine-style story presentation. Can be skipped at any moment.
const intro=document.createElement('section');intro.className='story-overlay';intro.hidden=true;
intro.innerHTML=`<div class="story-scene"><div class="story-stars" aria-hidden="true"><span>✧</span><span>✦</span><span>✧</span><span>✦</span></div><div class="story-art">🐸</div><div class="eyebrow">A GARDEN TALE · A LUMEN LEAP ORIGINAL</div><h2 class="story-heading"></h2><p class="story-copy"></p><div class="story-progress"></div><div class="story-actions"><button type="button" class="secondary-button story-skip">SKIP INTRO »</button><button type="button" class="primary-button story-next">NEXT →</button></div></div>`;
document.body.append(intro);
const CHAPTERS=[
{icon:'🌌',title:'Once upon a twilight…',copy:'Three magical lights kept the garden alive.'},
{icon:'🐝',title:'Then the swarm came.',copy:'The fireflies vanished, and the garden slowly went dark.'},
{icon:'🐸',title:'One little hero hopped forward.',copy:'Tode promised to bring each lost light home.'},
{icon:'🦎',title:'And he was not alone.',copy:'Lumo, his brave lizard friend, would answer when called.'},
];
let chapterIndex=0,chapterTimer=null;
function cancelStory(){if(chapterTimer!==null){clearTimeout(chapterTimer);chapterTimer=null;}}
function showChapter(){const c=CHAPTERS[chapterIndex];intro.querySelector('.story-art').textContent=c.icon;intro.querySelector('.story-scene').classList.remove('story-enter');void intro.offsetWidth;intro.querySelector('.story-scene').classList.add('story-enter');
intro.querySelector('.story-heading').textContent=c.title;intro.querySelector('.story-copy').textContent=c.copy;
intro.querySelector('.story-progress').textContent=`${chapterIndex+1} / ${CHAPTERS.length}`;
intro.querySelector('.story-next').textContent=chapterIndex===CHAPTERS.length-1?'START ADVENTURE →':'NEXT →';
cancelStory();chapterTimer=setTimeout(nextChapter,3600);}
function nextChapter(){cancelStory();if(intro.hidden)return;chapterIndex++;if(chapterIndex>=CHAPTERS.length){intro.hidden=true;beginGame();return;}showChapter();}
function startStory(){syncProfile();audio.ready();menu.hidden=true;intro.hidden=false;gameState='story';chapterIndex=0;showChapter();}
intro.querySelector('.story-next').addEventListener('click',nextChapter);
intro.querySelector('.story-skip').addEventListener('click',()=>{cancelStory();intro.hidden=true;beginGame();});

const hud=document.createElement('div');hud.className='lumen-hud';
hud.innerHTML=`<div class="brand-small">✦ LUMEN <span>LEAP</span></div><div class="hud-profile"></div><div class="hud-stage"></div><div class="hud-coins"></div>
  <div class="hud-difficulty"></div><div class="hud-health" aria-label="Health"></div>
  <div class="hud-fireflies"></div><div class="hud-defeated"></div><div class="hud-heart-progress"></div><div class="hud-combo"></div><div class="hud-elixir"></div><div class="hud-cover"></div>`;
document.body.append(hud);
const status=document.createElement('div');status.className='lumen-objective';document.body.append(status);
const scoreLabel=document.createElement('div');scoreLabel.className='score';document.body.append(scoreLabel);
const controls=document.createElement('div');controls.className='controls-strip';
controls.innerHTML='↑ ↓ ← →  HOP &nbsp; SPACE  PULSE &nbsp; E  LUMO &nbsp; P  PAUSE &nbsp; <button class="guide-shortcut" type="button">❔ GUIDE (H)</button>';document.body.append(controls);controls.querySelector('.guide-shortcut').addEventListener('click',showGuide);
const guardianLabel=document.createElement('div');guardianLabel.className='guardian-indicator';document.body.append(guardianLabel);
const soundControls=document.createElement('div');soundControls.className='sound-controls';
soundControls.innerHTML='<button type="button" class="sound-button" aria-label="Toggle sound effects">🔊 Sound on</button><button type="button" class="music-button" aria-label="Toggle original music">♫ Music off</button>';
document.body.append(soundControls);
const toast=document.createElement('div');toast.className='lumen-toast';toast.setAttribute('role','status');document.body.append(toast);
const stageBanner=document.createElement('div');stageBanner.className='stage-banner';stageBanner.hidden=true;stageBanner.innerHTML='<strong></strong><span></span>';document.body.append(stageBanner);
const speechBubble=document.createElement('div');speechBubble.className='tode-speech';speechBubble.hidden=true;document.body.append(speechBubble);
const DIALOGUE={kill:['Buzz off, buddy!','Hop one, swarm zero!','Who ordered the bee-free garden?'],
  firefly:['One spark closer!','Shine bright, little friend!','The garden remembers!'],
  summon:['Lumo, time to shine!','Backup! With scales!','Lumo, I choose you!'],
  hurt:['Okay, that stung!','Not my favorite hug!','Ouch! Frog down, not out!'],
  portal:['Home stretch, here I come!','That’s our way out!','Portal power!'],
  win:['A ribbit-worthy victory!','We did it!'],
  stage:['The swarm means business!','Frogs never back down!'],
  heal:['Five bees down, one heart up!','That feels better!','A little hop of healing!']};
let dialogueEnd=0,stageBannerEnd=0,dialogueIndex=0;
function say(kind){const lines=DIALOGUE[kind];if(!lines)return;
  const text=lines[(dialogueIndex++)%lines.length];speechBubble.textContent=text;speechBubble.hidden=false;dialogueEnd=elapsed+2.5;}
function showStageBanner(index){const stage=stageFor(index);stageBanner.querySelector('strong').textContent=index===3?'🌌 FINAL ESCAPE':`✦ LEVEL ${index+1} · ${stage.title}`;
  stageBanner.querySelector('span').textContent=stage.subtitle;stageBanner.hidden=false;stageBannerEnd=elapsed+3;}
function updateMessages(){if(!speechBubble.hidden){const pt=player.position.clone().add(new THREE.Vector3(0,0,72)).project(camera);
  speechBubble.style.left=`${Math.max(12,Math.min(window.innerWidth-180,(pt.x+1)*window.innerWidth/2))}px`;
  speechBubble.style.top=`${Math.max(50,(1-pt.y)*window.innerHeight/2)}px`;if(elapsed>dialogueEnd)speechBubble.hidden=true;}
  if(!stageBanner.hidden&&elapsed>stageBannerEnd)stageBanner.hidden=true;}
const damageFlash=document.createElement('div');damageFlash.className='damage-flash';document.body.append(damageFlash);
const overlay=document.createElement('section');overlay.className='game-over lumen-overlay';overlay.hidden=true;
overlay.innerHTML=`<div class="lumen-result" role="status">
  <div class="lumen-result-symbol">✨</div><h1 class="lumen-result-heading"></h1>
  <p class="lumen-result-message"></p><p class="lumen-result-score"></p>
  <div class="result-stats"></div>
  <div class="result-buttons"><button type="button" class="primary-button lumen-restart">PLAY AGAIN ↻</button>
  <button type="button" class="secondary-button change-world">CHANGE WORLD</button></div>
  <p class="lumen-result-hint">Press Space to replay</p></div>`;
document.body.append(overlay);
const pauseOverlay=document.createElement('section');pauseOverlay.className='pause-overlay';pauseOverlay.hidden=true;
pauseOverlay.innerHTML='<div class="pause-card"><h2>⏸ Adventure paused</h2><p>The fireflies will wait for you.</p><button class="primary-button resume-button" type="button">RESUME ADVENTURE</button><p>Or press P</p></div>';
document.body.append(pauseOverlay);
const heartsLabel=hud.querySelector('.hud-health'),fireflyLabel=hud.querySelector('.hud-fireflies');
const defeatedLabel=hud.querySelector('.hud-defeated'),difficultyLabel=hud.querySelector('.hud-difficulty');
const elixirLabel=hud.querySelector('.hud-elixir');
const coverLabel=hud.querySelector('.hud-cover');
const profileLabel=hud.querySelector('.hud-profile'),stageLabel=hud.querySelector('.hud-stage'),coinLabel=hud.querySelector('.hud-coins');
const themeInputs=[...menu.querySelectorAll('input[name="theme"]')];
const difficultyInputs=[...menu.querySelectorAll('input[name="difficulty"]')];
let chosenTheme='twilight',chosenDifficulty='normal';
let enemies=[],enemySpeed=19,enemySpawnDelay=4.2,attackRadius=65,maxEnemies=13;
let spawnTimer=0,spawnCursor=0,attackVisual=null,attackVisibleTime=0;
let survivalScore=0,killScore=0,collected=0,defeated=0,hearts=MAX_HEARTS,immunity=0,elapsed=0;
let lastSummon=-GUARDIAN_COOLDOWN,guardianRemaining=0,gameState='menu',toastRemaining=0;
let elixir=null,elixirTimer=0,elixirAge=0;
let guardianKills=0;
let combo=0,lastKillAt=-100, bonusUntil=0,activeBonus='';
let lastHeartRewardAt=-1;
const unlockedNotice=document.createElement('div');unlockedNotice.className='achievement-toast';unlockedNotice.setAttribute('role','status');document.body.append(unlockedNotice);
let unlockedNoticeTime=0;
function refreshAchievements(options={}){
  const awards=checkAchievements(save,{lights:collected,hearts,difficulty:chosenDifficulty,...options});
  if(awards.length){persist();unlockedNotice.textContent=`🏅 ACHIEVEMENT UNLOCKED: ${awards.map(a=>a.title).join(' · ')}`;unlockedNoticeTime=4;unlockedNotice.classList.add('visible');}
}
function updateRestoration(){
  restoration.setLevel(collected);
  const theme=THEMES[chosenTheme],factor=collected/3;
  ambient.intensity=theme.ambient*(.76+.24*factor);
  sun.intensity=theme.sunIntensity*(.78+.22*factor);
  scene.fog.color.setHex(theme.fog).lerp(new THREE.Color(theme.sky),factor*.25);
  document.body.style.setProperty('--restoration-glow',String(factor));
}

const floatingCoins=[];

function applyTheme(name){
  chosenTheme=Object.hasOwn(THEMES,name)?name:'twilight';
  const theme=THEMES[chosenTheme];
  scene.background=new THREE.Color(theme.sky);
  scene.fog=new THREE.Fog(theme.fog,chosenTheme==='fantasy'?650:chosenTheme==='marsh'?570:510,1250);
  ambient.intensity=theme.ambient;sun.color.setHex(theme.sun);sun.intensity=theme.sunIntensity;
  map.setTheme(theme, chosenTheme);decor.setTheme(chosenTheme);
  document.body.dataset.theme=chosenTheme;
  realmMechanics.setWorld(chosenTheme);
  if(typeof collected!=='undefined')updateRestoration();
  document.documentElement.style.setProperty('--theme-accent',theme.accent);
}
applyTheme(chosenTheme);
for(const input of themeInputs){input.addEventListener('change',()=>{if(input.checked){applyTheme(input.value);syncWorldPreview();}});}
for(const input of difficultyInputs){input.addEventListener('change',()=>{if(input.checked)chosenDifficulty=input.value;});}
function notify(message,seconds=2.5){toast.textContent=message;toastRemaining=seconds;toast.classList.add('visible');}
function score(){return Math.floor(survivalScore+killScore);}
function setDifficulty(){
  const stats=stageDifficulty(difficultyStats(chosenDifficulty,score()),collected);
  enemySpeed=stats.enemySpeed;enemySpawnDelay=stats.spawnDelay;maxEnemies=stats.maxEnemies;
  attackRadius=stats.attackRadius;player.movementSpeed=stats.playerSpeed;
  player.attackCooldown=stats.attackCooldown;
  for(const enemy of enemies)enemy.movementSpeed=enemySpeed*(enemy.variant==='stinger'?1.35:enemy.variant==='armored'?.82:1);
}
function clearAttack(){if(!attackVisual)return;
  scene.remove(attackVisual);attackVisual.geometry.dispose();attackVisual.material.dispose();attackVisual=null;attackVisibleTime=0;
}
function removeElixir(){if(elixir){scene.remove(elixir);elixir=null;elixirAge=0;}}
function spawnEnemy(){
  if(enemies.length>=maxEnemies)return false;
  for(let attempt=0;attempt<SPAWNS.length;attempt++){
    const p=SPAWNS[spawnCursor];spawnCursor=(spawnCursor+1)%SPAWNS.length;
    const radius=24;
    if(Math.hypot(p.x-player.position.x,p.y-player.position.y)<115)continue;
    if(!map.isInsideFence(p.x,p.y,radius + 6) || map.collidesWithHouse(p.x,p.y,radius,6))continue;
    if(enemies.some(e=>circlesOverlap(p.x,p.y,radius,e.position.x,e.position.y,e.collisionRadius,8)))continue;
    const kind=collected>=2 && Math.random()<.28 ? 'stinger' : collected>=1 && Math.random()<.22 ? 'armored' : 'bee';
    const enemy=new Enemy(p.x,p.y,kind);enemy.movementSpeed=enemySpeed*(kind==='stinger'?1.35:kind==='armored'?.82:1);
    enemies.push(enemy);scene.add(enemy);return true;
  }
  return false;
}
function destroyEnemy(enemy){const idx=enemies.indexOf(enemy);if(idx<0)return;
  scene.remove(enemy);enemies.splice(idx,1);defeated++;
  combo=nextKillCombo(elapsed,lastKillAt,combo);
  lastKillAt=elapsed;
  killScore+=SCORE_PER_KILL*combo;
  save.career.kills++;refreshAchievements();
  feedback.burst(enemy.position.x,enemy.position.y,enemy.variant==='stinger'?0xff6574:0xffd67b);
  if(combo>=2 && lastHeartRewardAt!==elapsed)notify(`⚡ SWARM COMBO ×${combo} · +${SCORE_PER_KILL*combo} SCORE`,1.6);
  const reward=enemy.variant==='stinger'?5:enemy.variant==='armored'?4:COINS_PER_BEE;
  save.coins=Math.min(999999,save.coins+reward);persist();updateWallet();
  // Reward feedback: a small golden coin rises from every defeated bee.
  const coin=new THREE.Mesh(new THREE.TorusGeometry(7,2.5,6,14),
    new THREE.MeshBasicMaterial({color:0xffda65,transparent:true,opacity:1,depthWrite:false}));
  coin.position.set(enemy.position.x,enemy.position.y,27);scene.add(coin);
  floatingCoins.push({object:coin,age:0});
  // A milestone reward is only granted when a heart is actually missing.
  // Gold and score are always awarded, including at full health.
  const heartAwarded = earnsHeartOnKill(defeated, hearts);
  if(heartAwarded) {
    hearts=Math.min(MAX_HEARTS, hearts+1);
    lastHeartRewardAt=elapsed;
    audio.effect('pickup');
    feedback.burst(player.position.x,player.position.y,0xff739c);
    notify(`❤️ ${KILLS_PER_HEART} BEE BONUS! +1 HEART (${hearts}/${MAX_HEARTS})`, 2.8);
  }
  if(defeated%4===0){ // Small reinforcements reward busy players with more action.
    const n=chosenDifficulty==='hard'?3:chosenDifficulty==='easy'?1:2;
    for(let i=0;i<n;i++)spawnEnemy();
  }
  // One pulse can defeat several bees; do not overwrite the healing line.
  if(heartAwarded) say('heal');
  else if(lastHeartRewardAt!==elapsed) say(combo>=3 ? 'stage' : 'kill');
}
function clearCoinEffects(){for(const fx of floatingCoins){scene.remove(fx.object);fx.object.geometry.dispose();fx.object.material.dispose();}floatingCoins.length=0;}
function updateCoinEffects(dt){for(let i=floatingCoins.length-1;i>=0;i--){const fx=floatingCoins[i];fx.age+=dt;
  fx.object.position.z+=dt*37;fx.object.rotation.z+=dt*4;fx.object.material.opacity=Math.max(0,1-fx.age/1.1);
  if(fx.age>=1.1){scene.remove(fx.object);fx.object.geometry.dispose();fx.object.material.dispose();floatingCoins.splice(i,1);}}}
function endRound(won){
  if(gameState!=='playing')return;
  gameState=won?'won':'lost';save.best=Math.max(save.best,score());
  if(won)save.career.wins++;
  refreshAchievements({won});
  addRecord(save,{name:save.name,avatar:save.avatar,score:score(),realm:chosenTheme,difficulty:chosenDifficulty,duration:elapsed,won});
  persist();updateWallet();
  player.enabled=false;player.heldDirection=null;player.inputQueue.length=0;
  player.visible=false;
  guardian.exit();guardianRemaining=0;clearAttack();audio.effect(won?'win':'hit');
  overlay.querySelector('.lumen-result-symbol').textContent=won?'✨':'🌙';
  overlay.querySelector('.lumen-result-heading').textContent=won?'The garden is saved!':'The lights are fading…';
  overlay.querySelector('.lumen-result-message').textContent=won?'All three fireflies are safe. You reached the enchanted portal!':`The bees caught Tode. You rescued ${collected}/3 lights.`;
  overlay.querySelector('.lumen-result-score').textContent=`${save.avatar} ${save.name} · FINAL SCORE: ${score()}`;
  if(won) overlay.querySelector('.lumen-result-message').textContent += '  ·  A ribbit-worthy victory!';
  overlay.querySelector('.result-stats').innerHTML=`<span>✨ ${collected}/3 fireflies</span><span>🐝 ${defeated} defeated</span><span>❤️ ${hearts} hearts</span><span>⏱ ${Math.floor(elapsed)}s</span>`;
  overlay.hidden=false;
}
function beginGame(){
  menu.hidden=true;overlay.hidden=true;pauseOverlay.hidden=true;gameState='playing';
  chosenDifficulty=difficultyInputs.find(i=>i.checked)?.value??'normal';
  guide.hidden=true;recordsPanel.hidden=true;
  applyTheme(themeInputs.find(i=>i.checked)?.value??'twilight');
  player.reset();player.visible=true;applyCosmetics();hearts=MAX_HEARTS;immunity=0;
  survivalScore=0;killScore=0;collected=0;defeated=0;elapsed=0;
  spawnTimer=0;spawnCursor=0;lastSummon=-GUARDIAN_COOLDOWN;guardianRemaining=0;
  guardian.exit();portal.visible=false;clearAttack();clearCoinEffects();removeElixir();elixirTimer=0;makeFireflies();
  guardianKills=0;combo=0;lastKillAt=-100;lastHeartRewardAt=-1;bonusUntil=0;activeBonus='';player.jumpHeight=30;realmMechanics.cooldowns.clear();
  restoration.setLevel(0);feedback.clearAll();unlockedNotice.classList.remove('visible');unlockedNoticeTime=0;
  updateRestoration();speechBubble.hidden=true;stageBanner.hidden=true;
  for(const enemy of enemies)scene.remove(enemy);enemies=[];setDifficulty();
  const count=difficultyStats(chosenDifficulty).startingEnemies;
  for(let i=0;i<count;i++)spawnEnemy();
  clock.start();audio.ready();showStageBanner(0);
  notify('✨ Find all three lights, then return to the portal!',3.5);updateHud();
}
function openMenu(){
  cancelStory();intro.hidden=true;shopPanel.hidden=true;overlay.hidden=true;pauseOverlay.hidden=true;menu.hidden=false;gameState='menu';updateWallet();setWizardStep(0);
  player.enabled=false;player.heldDirection=null;guardian.exit();clearAttack();
}
function pauseGame(){if(gameState==='playing'){
    gameState='paused';pauseOverlay.hidden=false;player.enabled=false;player.heldDirection=null;player.inputQueue.length=0;
  }else if(gameState==='paused'){
    gameState='playing';pauseOverlay.hidden=true;player.enabled=true;clock.start();
  }}
menu.querySelector('.menu-start').addEventListener('click',startStory);
overlay.querySelector('.lumen-restart').addEventListener('click',beginGame);
overlay.querySelector('.change-world').addEventListener('click',openMenu);
pauseOverlay.querySelector('.resume-button').addEventListener('click',pauseGame);
soundControls.querySelector('.sound-button').addEventListener('click',e=>{
  audio.enabled=!audio.enabled;if(audio.enabled)audio.ready();
  e.currentTarget.textContent=audio.enabled?'🔊 Sound on':'🔇 Sound off';
});
soundControls.querySelector('.music-button').addEventListener('click',e=>{
  audio.music=!audio.music;audio.ready();e.currentTarget.textContent=audio.music?'♫ Music on':'♫ Music off';
});
function attack(){
  if(gameState!=='playing')return;
  clearAttack();audio.effect('attack');
  attackVisual=new THREE.Mesh(new THREE.CircleGeometry(attackRadius,48),
    new THREE.MeshBasicMaterial({color:0xffe48b,transparent:true,opacity:.56,depthWrite:false,side:THREE.DoubleSide}));
  attackVisual.position.set(player.position.x,player.position.y,.55);attackVisibleTime=ATTACK_DURATION;
  scene.add(attackVisual);feedback.pulse(player.position.x,player.position.y,attackRadius);
  let killed=0;for(const enemy of [...enemies]){
    if(Math.hypot(enemy.position.x-player.position.x,enemy.position.y-player.position.y)<=attackRadius+enemy.collisionRadius){if(enemy.hitPoints>1){enemy.hitPoints--;continue;}destroyEnemy(enemy);killed++;}
  }
  // Preserve milestone-heart and combo announcements (do not overwrite them).
  if(killed>0 && lastHeartRewardAt!==elapsed && combo<2)
    notify(`🪙 Gold earned! ${killed} bee${killed>1?'s':''} defeated.`,1.5);
}
player.onAttack=attack;
function summonGuardian(){if(gameState!=='playing'||guardianRemaining>0||!readyToSummon(elapsed,lastSummon))return;
  guardian.enter(player.position.x,player.position.y);guardianRemaining=GUARDIAN_DURATION;
  guardianKills=0;lastSummon=elapsed;save.career.summons++;refreshAchievements();persist();audio.effect('guardian');notify('🦎 LUMO HAS ARRIVED! 5 seconds, up to 4 bees!',2.8);say('summon');
}
function takeDamage(){if(gameState!=='playing'||!canTakeDamage(immunity,hearts))return;
  hearts--;immunity=DAMAGE_INVULNERABILITY;audio.effect('hit');say('hurt');
  damageFlash.classList.remove('flash');void damageFlash.offsetWidth;damageFlash.classList.add('flash');
  notify(hearts>0?`💔 Ouch! ${hearts} heart${hearts===1?'':'s'} remaining.`:'The final heart was lost!',1.8);
  if(hearts<=0)endRound(false);
}
function touchingBee(x = player.position.x, y = player.position.y) {
  return enemies.some(enemy => touchesEnemyAt(
    x, y, player.collisionRadius, enemy, VISIBLE_CONTACT_PADDING));
}
function checkPassiveContact() {
  // Independent of keyboard input, including while Tode stands still.
  if (immunity <= 0 && touchingBee()) takeDamage();
}
function isMoveAllowed(x,y){
  if(immunity<=0 && touchingBee(x,y)) takeDamage();
  if(gameState!=='playing')return false;
  return isInsideArena(x,y,player.collisionRadius) &&
    map.isInsideFence(x,y,player.collisionRadius) &&
    !map.collidesWithHouse(x,y,player.collisionRadius,COLLISION_GAP) &&
    !decor.getObstacles().some(tree => tree.collidesWithCircle(x,y,player.collisionRadius,COLLISION_GAP));
}
function inspectFireflies(){
  for(const firefly of fireflies){if(firefly.collected)continue;
    if(Math.hypot(player.position.x-firefly.position.x,player.position.y-firefly.position.y)>37)continue;
    firefly.collected=true;scene.remove(firefly);collected++;killScore+=SCORE_PER_FIREFLY;
    audio.effect('pickup');feedback.burst(firefly.position.x,firefly.position.y,0xffe69a);
    updateRestoration();refreshAchievements();
    notify(`✨ FIREFLY RESCUED! THE GARDEN BLOOMS · ${collected}/${REQUIRED_FIREFLIES}`,2.1);say('firefly');
    setDifficulty();const wave=waveSize(collected,chosenDifficulty);for(let j=0;j<wave;j++)spawnEnemy();showStageBanner(collected);
    // Keep the firefly speech visible; stage information is already in its banner.
    if(collected===REQUIRED_FIREFLIES){portal.visible=true;notify('🌌 PORTAL UNLOCKED! RETURN TO (0,0).',4.5);say('portal');}
  }
  if(portal.visible&&Math.hypot(player.position.x-portal.position.x,player.position.y-portal.position.y)<30)endRound(true);
}
function spawnElixir(){
  if(elixir||hearts>=MAX_HEARTS)return;
  const candidates=[...fireflySpots,{x:150,y:100},{x:-150,y:-100},{x:200,y:-100},{x:-100,y:200}];
  for(const p of candidates.sort(()=>Math.random()-.5)){
    if(Math.hypot(player.position.x-p.x,player.position.y-p.y)<65)continue;
    if(map.collidesWithHouse(p.x,p.y,17,5))continue;
    elixir=new Elixir(p.x,p.y);scene.add(elixir);elixirAge=0;
    notify('🧪 A healing elixir has appeared! Follow the pink glow.',3.6);break;
  }
}
function updateElixir(dt){
  elixirTimer+=dt;
  if(elixirTimer>=ELIXIR_INTERVAL){elixirTimer=0;spawnElixir();}
  if(!elixir)return;
  elixirAge+=dt;elixir.update(elapsed);
  if(Math.hypot(player.position.x-elixir.position.x,player.position.y-elixir.position.y)<ELIXIR_COLLECT_RADIUS){
    hearts=Math.min(MAX_HEARTS,hearts+1);audio.effect('pickup');notify('🧪 HEALED! +1 heart.',2.4);
    removeElixir();return;
  }
  if(elixirAge>ELIXIR_LIFETIME)removeElixir();
}
function updateHud(){
  heartsLabel.textContent='HEALTH  '+'♥ '.repeat(hearts)+'♡ '.repeat(MAX_HEARTS-hearts);
  heartsLabel.classList.toggle('warning',hearts===1);
  fireflyLabel.textContent=`✦  LIGHTS   ${collected} / ${REQUIRED_FIREFLIES}`;
  defeatedLabel.textContent=`🐝  ${defeated} defeated · ${enemies.length} nearby`;
  hud.querySelector('.hud-heart-progress').textContent=hearts<MAX_HEARTS ?
    `❤️ ${KILLS_PER_HEART - defeated%KILLS_PER_HEART} more bee defeats = +1 heart` : ''; 
  if(elapsed-lastKillAt>4)combo=0;
  hud.querySelector('.hud-combo').textContent=combo>=2?`⚡ COMBO ×${combo} · ${Math.max(0,Math.ceil(4-(elapsed-lastKillAt)))}s`:'';
  const hiddenFrom = enemies.filter(bee => decor.isHiddenFrom(bee.position, player.position)).length;
  coverLabel.textContent=hiddenFrom>0 ? `🌳 Tree cover · hidden from ${hiddenFrom} bee${hiddenFrom===1?'':'s'}` :
    `🌳 Trees give cover · garden border blocks escape`;
  coverLabel.classList.toggle('active',hiddenFrom>0);
  elixirLabel.textContent=elixir?'🧪 HEALING ELIXIR AVAILABLE':hearts<MAX_HEARTS?`🧪 Next healing elixir in ${Math.max(0,Math.ceil(ELIXIR_INTERVAL-elixirTimer))}s`:'🧪 Healing available when hurt';
  difficultyLabel.textContent=`${THEMES[chosenTheme].label} · ${DIFFICULTIES[chosenDifficulty].label}`;
  profileLabel.textContent=`${save.avatar} ${save.name}`;coinLabel.textContent=`🪙 ${save.coins} GOLD`;
  stageLabel.textContent=`LEVEL ${Math.min(3,collected+1)} · ${stageFor(collected).title}`;
  const target=portal.visible?portal.position:fireflies.filter(f=>!f.collected).sort((a,b)=>
    Math.hypot(a.position.x-player.position.x,a.position.y-player.position.y)-
    Math.hypot(b.position.x-player.position.x,b.position.y-player.position.y))[0]?.position;
  if(target){const dx=target.x-player.position.x,dy=target.y-player.position.y;
    const arrow=`${dy>20?'↑':dy< -20?'↓':''}${dx>20?'→':dx< -20?'←':''}`||'●';
    status.textContent=portal.visible?`🌌 PORTAL OPEN  ·  GO ${arrow} TO ESCAPE`:
      `✨ FIND THE NEXT FIREFLY  ${arrow}  ·  ${Math.round(Math.hypot(dx,dy))}m`;
  }
  const cooldown=Math.max(0,GUARDIAN_COOLDOWN-(elapsed-lastSummon));
  guardianLabel.textContent=guardianRemaining>0?`🦎 LUMO PROTECTING YOU · ${Math.ceil(guardianRemaining)}s`:
    cooldown<=0?'🦎 E — SUMMON LUMO  ·  READY':`🦎 LUMO RECHARGING  ·  ${Math.ceil(cooldown)}s`;
  guardianLabel.classList.toggle('recharging',guardianRemaining<=0&&cooldown>0);
  scoreLabel.textContent=`✦  ${score()}`;
}
window.addEventListener('keydown',event=>{
  if(event.code==='Escape'){if(!guide.hidden||!recordsPanel.hidden||!shopPanel.hidden){guideClose();recordsPanel.hidden=true;shopPanel.hidden=true;return;}}
  if(event.code==='KeyH'&&!event.repeat){event.preventDefault();if(guide.hidden)showGuide();else guideClose();return;}
  if(!guide.hidden||!recordsPanel.hidden||!shopPanel.hidden)return;
  if(gameState==='menu'||gameState==='story')return;
  if(event.code==='KeyP'&&!event.repeat){event.preventDefault();pauseGame();return;}
  if(gameState==='won'||gameState==='lost'){
    if(event.code==='Space'&&!event.repeat){event.preventDefault();beginGame();}return;
  }
  if(gameState!=='playing')return;
  if(event.code==='KeyE'&&!event.repeat){event.preventDefault();summonGuardian();}
});
const renderer=new Renderer();
const worldPreviewCanvas=menu.querySelector('.world-live-canvas');
const worldPreviewCtx=worldPreviewCanvas.getContext('2d');
// A fixed, pristine map uses its OWN scene and camera. Never copy the live
// camera following the last playable hero (which caused the sky-only previews).
const overviewScene=new THREE.Scene();
const overviewMap=new Map(SPAWNS);
const overviewDecor=new GardenDecor(overviewMap.houses,SPAWNS,fireflySpots);
overviewScene.add(overviewMap,overviewDecor);
// Starting-state collectibles remain fixed in this showroom scene even if the
// real game has rescued them, or the hero is standing at the edge of the map.
for(const [i,spot] of fireflySpots.entries()){
  const previewLight=new Firefly(spot.x,spot.y,i);
  previewLight.update(i*1.4);
  overviewScene.add(previewLight);
}
const overviewAmbient=new THREE.AmbientLight(0xffffff,1.7);
const overviewSun=new THREE.DirectionalLight(0xffffff,1.3);
overviewSun.position.set(-100,-100,220);
overviewScene.add(overviewAmbient,overviewSun);
const overviewCamera=new THREE.PerspectiveCamera(52,window.innerWidth/window.innerHeight,0.1,9000);
overviewCamera.up.set(0,0,1);
overviewCamera.position.set(570,-680,760);
overviewCamera.lookAt(0,0,0); // always the garden starting clearing
function renderGame(){
  if(!menu.hidden && wizardStep===1 && worldPreviewCtx){
    renderer.render(overviewScene,overviewCamera);
    try{worldPreviewCtx.drawImage(renderer.domElement,0,0,worldPreviewCanvas.width,worldPreviewCanvas.height);}catch(error){
      console.warn('Overview preview unavailable:',error);
    }
  }else{
    renderer.render(scene,camera);
  }
}
function syncWorldPreview(){
  const t=THEMES[chosenTheme];
  menu.querySelector('.world-live-name').textContent=t.label;
  menu.querySelector('.world-live-description').textContent=({
    twilight:'Follow luminous flowers to reveal hidden sparks.',
    fantasy:'Bounce through blossoms for a burst of magic.',
    forest:'Ancient pines hide you from the swarm.',
    marsh:'Rest on moonlit lily-pad sanctuaries.',
  })[chosenTheme];
  overviewScene.background=new THREE.Color(t.sky);
  overviewScene.fog=new THREE.Fog(t.fog,660,1800);
  overviewAmbient.intensity=t.ambient;
  overviewSun.color.setHex(t.sun);overviewSun.intensity=t.sunIntensity;
  overviewMap.setTheme(t,chosenTheme);
  overviewDecor.setTheme(chosenTheme);
}
player.enabled=false;
updateHud();syncWorldPreview();
renderer.setAnimationLoop(()=>{
  if(gameState!=='playing'){
    renderGame();return;
  }
  const seconds=Math.min(clock.getDelta(),.25),dt=Math.min(seconds,.05);
  elapsed+=seconds;survivalScore+=seconds*SCORE_PER_SECOND;immunity=Math.max(0,immunity-dt);
  setDifficulty();
  spawnTimer+=seconds;
  if(spawnTimer>=enemySpawnDelay){spawnTimer%=enemySpawnDelay;spawnEnemy();}
  // First contact check: ensures stationary players are still vulnerable.
  checkPassiveContact();
  if(gameState!=='playing'){renderGame();return;}
  player.update(dt,isMoveAllowed);
  if(gameState!=='playing'){renderGame();return;}
  const realmEffect=realmMechanics.apply(player.position.x,player.position.y,elapsed);
  if(realmEffect){
    if(realmEffect.type==='lantern' && elapsed>bonusUntil){immunity=Math.max(immunity,realmEffect.duration);notify('✧ LANTERN BLESSING · 3 seconds of protection',1.9);feedback.burst(player.position.x,player.position.y,0xffeac0);}
    if(realmEffect.type==='bounce'&&elapsed>bonusUntil){bonusUntil=elapsed+realmEffect.duration;activeBonus='bounce';notify('🌸 BOUNCE BLOOM · SUPER HOPS!',2);feedback.burst(player.position.x,player.position.y,0xffa8d2);}
    if(realmEffect.type==='sanctuary'){immunity=Math.max(immunity,0.27);}
  }
  player.jumpHeight=activeBonus==='bounce'&&elapsed<bonusUntil?47:30;
  if(elapsed>=bonusUntil)activeBonus='';
  const displayHero=immunity<=0||Math.floor(elapsed*10)%2===0;
  if(player.model)player.model.visible=save.equipped.character==='classic'&&displayHero;
  if(player.alternateModel)player.alternateModel.visible=displayHero;
  for(const f of fireflies)if(!f.collected)f.update(elapsed);
  inspectFireflies();
  if(gameState!=='playing'){renderGame();return;}
  portal.update(elapsed);decor.update(elapsed);restoration.update(elapsed,dt);realmMechanics.update(elapsed);feedback.update(dt);
  if(guardianRemaining>0){guardianRemaining=Math.max(0,guardianRemaining-dt);
    guardian.update(dt,elapsed,player,enemies,(enemy)=>{if(guardianKills>=GUARDIAN_KILL_LIMIT)return;guardianKills++;destroyEnemy(enemy);if(guardianKills>=GUARDIAN_KILL_LIMIT){guardianRemaining=0;guardian.exit();}});
    guardian.aura.material.opacity=guardianRemaining<2?.6*guardianRemaining/2:.6;
    if(guardianRemaining===0){guardian.exit();notify('🦎 Lumo is resting. Recharge in progress.',1.8);}
  }
  const obstacles = [...map.houses, ...decor.getObstacles()];
  for(const enemy of [...enemies]){
    if(!enemies.includes(enemy))continue;
    // Tree cover hides Tode's current location from bees on the far side.
    // A tree breaks line of sight; it does NOT freeze enemy navigation.
    // Bees investigate Tode's last visible location, routing around trees
    // and other obstacles. When they see him again, they resume pursuit.
    const hidden=decor.isHiddenFrom(enemy.position,player.position);
    if(!hidden){
      enemy.lastSeenPosition={x:player.position.x,y:player.position.y};
    }
    const pursuitTarget=hidden
      ? (enemy.lastSeenPosition ?? {x:player.position.x,y:player.position.y})
      : player.position;
    enemy.update(dt,player,enemies,COLLISION_GAP,obstacles,pursuitTarget);
    checkPassiveContact();
    if(gameState!=='playing')break;
  }
  if(gameState!=='playing'){renderGame();return;}
  updateElixir(seconds);
  if(attackVisual){attackVisibleTime-=dt;if(attackVisibleTime<=0)clearAttack();}
  if(toastRemaining>0){toastRemaining-=dt;if(toastRemaining<=0)toast.classList.remove('visible');}
  updateCoinEffects(dt);audio.update(elapsed);updateHud();updateMessages();
  if(unlockedNoticeTime>0){unlockedNoticeTime-=dt;if(unlockedNoticeTime<=0)unlockedNotice.classList.remove('visible');}
  renderGame();
});
window.addEventListener('resize',()=>{camera.resize();renderer.resize();overviewCamera.aspect=window.innerWidth/window.innerHeight;overviewCamera.updateProjectionMatrix();});
