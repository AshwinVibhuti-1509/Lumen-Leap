# LUMEN LEAP — The Enchanted Garden (V4)

Competition extension of the JetBrains Academy Three.js project. The stable V3 source was used as the base.

## Start

1. Extract this ZIP to a new folder (do not merge into your working V3).
2. Open **LumenLeap** (the folder containing `package.json`) as a new WebStorm project.
3. Run `npm install` and `npm run dev` in that folder.
4. Open the exact localhost URL printed by Vite. An existing project may be on port 5173, making this one run on 5174.
5. Run `npm test` for the included logic checks and `npm run build` for production compilation.

## The adventure

- On the start menu, choose one of **four visual themes** and Explorer, Adventurer, or Nightmare difficulty.
- Enter a nickname and select a profile avatar. Profile details are saved in this browser.
- Open **Inventory & Shop** to spend gold on frog skins, Lumo cosmetics, or alternate heroes (Orange Toad, Garden Spider, Sky Dragonfly). All currency is earned in-game; no payment features.
- Start the **skippable, four-scene story introduction**. The Next button and Skip button both work.
- Rescue **3 fireflies**. Each rescue increases the level and triggers a new bee wave. Once all three are rescued, reach the active portal in the center to win.
- Each bee earns **3 gold**, stinger earns **5**, armored earns **4**. Every fourth defeat may bring reinforcements. Gold, unlocks, best score, and identity are saved with localStorage. Never enter personal or sensitive information as a nickname.
- Lumo (press **E**) now lasts **5 seconds**, defeats at most **4 bees** per summon, and has a **60-second cooldown**.
- Bees become more dangerous each stage; elite **Stinger** (red aura, faster) and **Armored** (blue aura, slower, two pulse hits) bees appear in later stages. The original bee model is retained. 
- Trees and houses block paths. Trees can hide the frog from distant bees. You have 3 hearts and can find healing elixirs.
- Original Tode lines display above the player in response to achievements, injury, attack, and summoning.

## Controls

- **Arrows** — Hop / move (tap or hold)
- **Space** — Attack / restart after Game Over or victory
- **E** — Summon Lumo
- **P** — Pause / resume
- UI buttons work by click or tap.

## Important notes

- Gameplay modes and difficulty are selected before the round, and **levels advance automatically** as you collect fireflies. These are complementary systems.
- Cosmetic unlocks persist in one browser using localStorage. Clearing browser storage or changing device resets saved data. No server or login is required.
- The new alternate characters are **original low-poly procedural models**, not downloaded licensed models. They share the existing hop controls and collision behaviour.
- This build passed Node.js unit checks and JavaScript syntax validation, but still needs WebStorm browser testing with WebGL before submission.

## Final browser test

1. Try each theme and make sure the start menu is usable.
2. Open the shop, earn gold in a round, return to Change World, buy and equip a cosmetic, refresh and verify it remains unlocked.
3. Choose a spider or dragonfly hero and check movement, attacks, and hit detection.
4. Complete a game: rescue firefly 1/2/3; see level banners, swarms, portal, and victory.
5. Stand still and let a bee approach: hearts must reduce without key presses.
6. Summon Lumo: it should disappear at 5 seconds (or when 4 kills reached). Verify cooldown.
7. Test P pause, Space restart, and menu Changes.
8. Run `npm run build` before uploading.

## Attribution

Created as an extension of the JetBrains Academy "Build a Game with an AI Coding Agent" course. Models used are from the provided tutorial. Original gameplay extension and procedural assets are in the source code.
