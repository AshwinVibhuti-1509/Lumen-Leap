# LUMEN LEAP V3 — Contact, cover and three distinct worlds

Use the **complete V3 project** in a separate WebStorm window; do not mix individual JavaScript files from V2 and V3.

## Fixed
- Bees can damage an idle frog. Before player movement and again after each enemy update, the game checks world-coordinate contact with a visible-body allowance. The existing brief damage immunity prevents all hearts being removed at once.
- Trees have XY collision footprints, and both frog and bees route around them. Houses continue blocking movement.
- Hiding behind a tree can break a distant bee's sight line. Distant bees pause searching while Tode stays concealed, then resume pursuit when he reappears. Bees already close still see and can hit Tode. The HUD displays a tree-cover message when a bee cannot see the frog.
- Distinct biomes: Twilight now uses violet geode trees and luminous floor patches; Fantasy has bright candy-color spherical foliage and flower meadows; Forest has upright layered evergreen pines, mushrooms and softer mossy ground. Floating motes and foliage sway animate gently in every biome.
- Upward orientation fixed for tree trunks and pines; the previous vegetation used geometry pointed along Y despite this game using Z-up.

## Run
1. Extract this ZIP; open **LumenLeap** folder (the one with `package.json`) in WebStorm as a **new project**.
2. In a terminal inside LumenLeap run `npm install`, then `npm run dev`.
3. Open the exact localhost URL printed by Vite (often :5173, :5174 if earlier project is still running).
4. Select a theme and a difficulty on the opening screen.
5. Stand still and wait for a bee to reach you. A heart should disappear **without any keypress**. Movement into a bee also hurts. Hearts should not disappear instantly in a single cluster due to temporary damage immunity.
6. Try walking into a tree: Tode should stop at its trunk/canopy footprint. Approach a tree from the far side of a bee: if the tree blocks its view, a cover message will appear; an approaching bee should route around trees rather than walking straight through.
7. Restart and try the other two themes to see distinct trees, meadows, and floating particles.
8. Collect all three fireflies, trigger Lumo, enter the portal and confirm victory/restart still work.

## Notes
- A beta gameplay build, not a certified finished browser test. Asset rendering must be verified on your computer.
- Cover is simplified line-of-sight logic rather than complete enemy stealth AI.
- Existing original GLB game assets remain bundled. No third-party copyrighted art or audio was added.
