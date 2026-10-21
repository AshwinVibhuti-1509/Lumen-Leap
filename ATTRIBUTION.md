# Attribution and third-party assets

This document identifies externally sourced files and libraries in **Lumen Leap — Restore the Light**, and distinguishes them from the new game extension.

## JetBrains Academy course and base game

- **Source:** [JetBrains Academy — Build a Game with an AI Coding Agent](https://github.com/jetbrains-academy/game-course)
- **License:** [MIT License](https://github.com/jetbrains-academy/game-course/blob/main/LICENSE)
- **Original copyright:** Copyright (c) 2025 JetBrains Academy
- **Use in this repository:** Three.js course foundation, original Tode-themed project material, and the following bundled assets.

| Bundled file | Upstream location | Attribution / license |
|---|---|---|
| `public/models/tode.glb` | [`game/public/models/tode.glb`](https://github.com/jetbrains-academy/game-course/blob/main/game/public/models/tode.glb) | JetBrains Academy course repository, MIT |
| `public/models/enemy.glb` | [`game/public/models/enemy.glb`](https://github.com/jetbrains-academy/game-course/blob/main/game/public/models/enemy.glb) | JetBrains Academy course repository, MIT |
| `public/models/small_house.glb` | [`game/public/models/small_house.glb`](https://github.com/jetbrains-academy/game-course/blob/main/game/public/models/small_house.glb) | JetBrains Academy course repository, MIT; kept in the project, but houses are not part of the current playable maps |
| `public/tode.svg` | [`game/public/tode.svg`](https://github.com/jetbrains-academy/game-course/blob/main/game/public/tode.svg) | JetBrains Academy course repository, MIT |

The repository's `LICENSE` preserves the JetBrains Academy MIT notice, as required for copies or substantial portions of MIT-licensed software.

## JavaScript dependencies

- [Three.js](https://github.com/mrdoob/three.js) — 3D rendering and loading; **MIT License**.
- [Vite](https://github.com/vitejs/vite) — development server and build tool; **MIT License**.

The exact package versions are recorded in `package-lock.json`.

## Assets and audio created for the extension

- Garden vegetation, themed fences, effects, pickups, particles, and simplified alternate character meshes are implemented procedurally in this repository's source code.
- In-game sounds and music are generated using Web Audio API oscillators in `src/components/GameAudio.js`; **no third-party audio recording** is bundled.

## AI development disclosure

See [AI_USAGE.md](AI_USAGE.md). AI-generated or AI-assisted code and visual ideas were reviewed and iterated through gameplay testing. No media or source code from other competition entrants was incorporated.

> **Before submission:** If you add any new downloaded textures, models, sound recordings, fonts, or other assets later, add their author, source URL, and license to this file.
