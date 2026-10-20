# Lumen Leap V5 — Restore the Light

**A complete V5 playtest build based on the working V4 project.** Do not overwrite your working V4 copy.

## Run
1. Extract the `LumenLeap` folder.
2. In WebStorm, File > Open, select **that** folder (the one with `package.json`), and select **New Window**.
3. In its terminal: `npm install`, then `npm run dev`.
4. Open the exact localhost URL Vite prints (which may be 5174 if V4 is still running).
5. Run `npm test`, and before submission run `npm run build`.

## What is new
- Three-step onboarding: **1 Challenge → 2 World → 3 Explorer**. Coins are top-right; HOW TO PLAY and SHOP & INVENTORY remain accessible on each screen. There is also a RECORDS button.
- World chooser offers a **live preview of the currently selected game scene**. It is drawn from the Three.js canvas (after the world changes); if your browser blocks WebGL canvas copying, the scenic illustration acts as a fallback.
- Animated profile emblem orbit: hover/focus to preview; click or arrow buttons to save selection. Native dropdown supports keyboard and touch users.
- The Moonlight Market is split into three tabs: Frog Skins / Lumo Skins / Playable Heroes. Existing V4 unlocks and gold are preserved on the same browser and origin.
- Three rescue-driven garden restoration phases: flower clusters bloom around rescued lights, while sky fog and light intensities recover.
- Realm-specific interactions: Twilight magic lanterns grant short protection; Fantasy bounce blooms enhance hop height; Forest has the existing tree-cover system; Marsh lily pads offer small safe zones.
- Improved hit effects with expanding rings and enemy spark bursts, plus up-to-4× quick-kill **score** combos. Gold is not multiplied.
- A dedicated interactive How to Play screen accessible from the main menu and in-game (H, or Guide button).
- Six achievements with unlock announcements, and the player's top five **local** results. These are stored in browser localStorage, not an online leaderboard.
- An enhanced, skippable original 4-scene story introduction.

## Playtest checklist — REQUIRED BEFORE SUBMISSION
- [ ] Menu opens at Challenge (Explorer / Adventurer / Nightmare), and Continue advances to World.
- [ ] All four world thumbnails work; selecting a world visibly changes the live preview and the game environment.
- [ ] Continue advances to Explorer. Mouse hover previews profile icons; clicking or using arrow buttons changes the saved emblem; nickname saves.
- [ ] Gold balance appears at the upper-right on all three screens.
- [ ] Shop remains at the lower-right on all three screens; tabs contain correctly classified items.
- [ ] Guide opens and closes from the lower-left, and H opens it during play.
- [ ] Start plays an optional story; Next and Skip both lead to gameplay.
- [ ] Frog movement, bees, damage, Lumo, inventory, coins, 3 hearts and pause still work.
- [ ] Defeating nearby bees creates attack particles; quick kills award a score combo.
- [ ] Rescuing each firefly unlocks an achievement and visibly restores another flower patch.
- [ ] Twilight lanterns, Fantasy bloom boosts, Forest cover, and Marsh lily pads work as described.
- [ ] Player can rescue all three fireflies, enter the portal, win and restart.
- [ ] After an end-game, the top five local records appear in RECORDS, and achievements persist on refresh.
- [ ] Test with browser dev tools open (F12): no runtime errors; test at 1366×768 and narrow-width.
- [ ] `npm test` and `npm run build` pass on the computer used for submission.

## Known constraints
- Profile and purchases are device/browser-local. No online records or real-money payments.
- A full WebGL playthrough and Vite build were **not** executed in the packaging environment because npm dependencies were unavailable there. Run the above checklist in your browser before publishing.
- A realm's magic markers are small interactive objects; some may be beyond the camera view until you explore.

## Important technical locations
- `src/main.js` — menu, score, gameplay integration, stage progression.
- `src/style.css` — wizard, shop, story, HUD and responsive styles.
- `src/components/Records.js` — local achievements and leaderboard rules.
- `src/components/GardenRestoration.js` — stage-triggered flower growth and lights.
- `src/components/RealmMechanics.js` — environmental powers.
- `src/components/FeedbackFX.js` — combat visual effects.
- `src/components/shop.js` — local save migration and store.

This is an original modification of the JetBrains Academy tutorial. Game assets are included from the user's prior course project. No assets from the community reference videos are included.
