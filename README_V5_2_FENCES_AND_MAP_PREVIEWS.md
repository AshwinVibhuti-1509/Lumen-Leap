# Lumen Leap V5.2 — Garden fences and fixed world previews

Built from **LumenLeap_V5_1_Arena_Hearts_Lumo_Fix.zip**, which includes the previous V5 tree navigation, healing rewards, shop and wizard.

## What's fixed

- **All playable heroes** (Classic Frog, Orange Toad, Spider, Dragonfly) stay within the same 520-unit square. This is enforced inside `Player.update()` *as well as* `main.js`, including when hot-reloading an old position.
- **Bees and Lumo** cannot move outside the square either. Pursuit remains obstacle-aware.
- Each world now has a visible, solid-limit themed perimeter: **Twilight** glowing crystal pylons/energy rails; **Fantasy** white picket fence; **Forest** living thorny hedgerow; **Marsh** uneven, mossy rune-stones.
- Floor extends 4000 units, disguising distant empty sky from the follow camera. The perimeter remains at ~520 units to preserve existing mechanics.
- The World selection screen always shows the **fixed starting-garden overview from its own separate scene/camera**. It no longer follows the previous session's spider/dragonfly/frog. Changing the world also switches its fence style and scenery preview.
- **No houses** have been reintroduced. Trees and current world-specific features stay intact.
- Gold, shop inventory, hearts, Lumo cooldown, score and all existing saved progress stay unchanged.

## Installation

1. Back up your working project.
2. For the easiest route, extract the FULL ZIP and open the `LumenLeap` directory containing `package.json` in a **new WebStorm window**.
3. In that folder run `npm install`, `npm test`, `npm run build`, then `npm run dev`.
4. Open the exact localhost URL printed by Vite (it may be 5174 if another game is running).

For existing modified V5.1 projects, use the SMALL PATCH archive. It overwrites only the files listed below. The complete project also includes their tests.

## Files changed
- `src/components/GardenFence.js` **(new)**
- `src/components/Map.js`
- `src/components/Player.js`
- `src/components/Enemy.js`
- `src/components/Guardian.js`
- `src/components/lumenRules.js`
- `src/main.js`
- `tests/enemy-pursuit.test.mjs`, `tests/tree-hidden-chase.test.mjs`, `tests/tree-navigation.test.mjs`, `tests/v5-polish-regression.test.mjs`
- `tests/v5-fence-and-preview.test.mjs` **(new)**

## Playtest
- Try **Dragonfly** in all four worlds. Move toward +X, -X, +Y, and -Y fences: each must block movement.
- Wait by a fence. Bees should approach but should not cross it or appear outside it. Summon Lumo nearby and check he stays in the garden.
- Select each world in the menu; the preview must show an uncluttered centered garden with that world's specific fence, regardless of where the previous run finished.
- Confirm fireflies, portal, five-bee healing, Lumo's 15-second recharge, and Game Over all still work.

## Verification
Source syntax validated and Node automated tests passed in the build environment. The full Vite production build and WebGL rendering require your local `npm install`, because network access to the npm registry was unavailable during packaging. Please do not submit without completing one browser playthrough.
