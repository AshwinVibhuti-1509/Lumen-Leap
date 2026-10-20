# Lumen Leap V5 — Restore the Light + Tree Navigation Fix

This is a consolidated copy of Lumen Leap V5 with the V5-specific tree navigation correction already applied. Do not install the V4 patch into this project.

1. Extract this ZIP to a new folder. Keep your working V4 untouched.
2. In WebStorm choose File > Open and select the extracted `LumenLeap` folder (the one containing package.json). Choose New Window.
3. In the WebStorm terminal run `npm install`, then `npm test`, then `npm run build`, then `npm run dev`.
4. Open the exact Local URL shown by Vite (it may be port 5174/5175 if V4 is still running).
5. Test all 3 intro screens (Difficulty > World > Explorer), shop categories, icons, the game guide, trees, bee pursuit, damage while standing still, Lumo, fireflies, restoration transitions, victory, restart, and local save data.
6. Stop the server before preparing a production upload. Deploy the `dist/` output using a static host and retest on the public URL.

The logic test suite checks code behavior, but does not guarantee full WebGL rendering. Verify visuals and gameplay in a browser before submission.
