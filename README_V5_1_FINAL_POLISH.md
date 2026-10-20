# Lumen Leap V5.1 — Arena & rewards polish

This is built from **LumenLeap_V5_Ready_Tree_Fix_Combined**. Keep your existing V5 project as a backup.

## Changes
- Frog and other playable characters cannot hop outside the 520-unit half-extent arena. The green ground extends beyond the arena so the follow-camera never reveals an abrupt edge. The perimeter has a thin colored border.
- No houses spawn; trees remain physical cover and obstacles. The field guide is updated.
- Every **five total bee defeats** (from attacks or Lumo) restores one missing heart (max 3). If hearts are full, the fifth bee grants only normal gold/score. If the milestone is missed at full hearts, it is not banked.
- Lumo duration remains **5 seconds** and recharge is reduced to **15 seconds** (from summon time).
- The score combo retains the **4-second window** and **4× cap**. The combo announcer is no longer overwritten by ordinary kill toasts. Firefly dialogue is no longer immediately overwritten by stage dialogue; victory text is shown on the results screen.
- Healing progress appears in the HUD only if a heart is missing.

## Install
Open this `LumenLeap` folder as a **new project** in WebStorm, next to your preserved original V5 project.

Run from the folder containing `package.json`:

```powershell
npm install
npm test
npm run build
npm run dev
```

Use the localhost address displayed by the dev server.

## Manual smoke tests
1. Hold Right until Tode reaches the luminous border. Verify that X never passes 500 and the ground doesn't drop into sky. Repeat on each side, and with Spider and Dragonfly.
2. Start a game in any realm. Verify **no houses** appear; trees still stop movement and bees navigate around them.
3. Lose one heart, defeat five bees (including possible Lumo kills), and check heart increases by one. At three hearts, five further kills should not increase health above three.
4. Summon Lumo, wait 5 seconds, then verify that it can be summoned again **15 seconds after the first summon**, not 15 seconds after it disappears.
5. Quickly defeat 2–4 bees: check the Combo ×2/×3/×4 banner and HUD indicator; leave 4+ seconds between defeats to see reset.
6. Collect the first firefly: its dialogue should stay visible. Trigger a summon and take damage to verify other speech bubbles.
7. Complete all three stages, escape through the portal, use the shop, restart, and verify gold/save persistence.

## Notes
Automated logic tests and a Vite production build cover source integration, but 3D gameplay must be verified on your own browser. Contest submissions should use a public playable deployment, not localhost.
