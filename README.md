# ✨ Lumen Leap — Restore the Light

**A browser-based 3D adventure set in your choice of four enchanted gardens.**

**[▶ Play Lumen Leap](https://lumen-leap.netlify.app/)** · **[Source repository](https://github.com/AshwinVibhuti-1509/Lumen-Leap)**

> Three fireflies are missing, bees patrol the garden, and the exit portal is dormant. Rescue the lights, summon Lumo when the swarm gets too close, and make it back to the portal.

## 🎮 Gameplay

- **Choose your challenge:** Explorer, Adventurer, or Nightmare; swarms become more demanding as you progress.
- **Explore four realms:** Enchanted Twilight, Colorful Fantasy, Mystical Forest, and Moonlit Marsh, each with a distinct atmosphere and environmental interaction.
- **Rescue three fireflies** to restore the garden through three stages and activate the escape portal.
- **Survive the swarm:** hop, avoid trees and themed perimeter fences, attack bees, and manage three hearts.
- **Summon Lumo:** a lizard guardian that helps clear nearby enemies for a short time and recharges between summons.
- **Unlock cosmetics:** earn in-game gold from enemies and spend it on frog skins, Lumo skins, and alternate playable heroes.
- **Track progress:** combos, achievements, best runs, and cosmetic unlocks are saved locally in your browser.

## ⌨️ Controls

| Input | Action |
|---|---|
| Arrow keys | Hop / move (tap or hold) |
| Space | Magic pulse attack |
| E | Summon Lumo when ready |
| P | Pause / resume |
| H | Open the How to Play guide |

A guide is also available on the setup screens. The game includes optional sound effects and synthesized music.

## 🧰 Tech stack

**JavaScript (ES modules)** · **Three.js / WebGL** · **Vite** · **HTML & CSS** · **Node.js test runner** · **Netlify**

## 🚀 Run locally

**Prerequisite:** Install a supported version of Node.js and npm.

```bash
git clone https://github.com/AshwinVibhuti-1509/Lumen-Leap.git
cd Lumen-Leap
npm ci
npm run dev
```

Open the **Local** address printed by Vite (typically `http://localhost:5173/`).

Run the test suite and create a deployable build:

```bash
npm test
npm run build
npm run preview
```

The production build is written to `dist/`. On Netlify, use `npm run build` as the build command and `dist` as the publish directory.

## 🗂️ Project structure

```text
Lumen-Leap/
├── public/models/          # Course-derived 3D assets
├── src/
│   ├── components/         # Player, enemies, guardian, world, rules, UI effects
│   ├── main.js             # Game loop, UI flow, and gameplay integration
│   └── style.css           # Menus and in-game presentation
├── tests/                  # Node test-runner checks
├── index.html
└── package.json
```

## 🌱 What was added beyond the course?

Lumen Leap is an extension of the JetBrains Academy **Build a Game with an AI Coding Agent** course project. The extension adds a firefly-rescue objective and ending, four garden themes, a three-stage progression loop, a summonable guardian, collectible gold and cosmetics, alternate heroes, a health system, a skippable introduction, interactive UI, and local achievements/records.

This repository is **not** an unmodified tutorial submission. The original tutorial and retained assets are credited in [ATTRIBUTION.md](ATTRIBUTION.md).

## 🤖 AI-assisted development

The game was developed through iterative AI-assisted coding, debugging, design, and hands-on playtesting. See [AI_USAGE.md](AI_USAGE.md) for the tools used and the parts of the workflow they supported.

## 📜 Credits and license

- **Original course/base and retained 3D assets:** JetBrains Academy, [game-course](https://github.com/jetbrains-academy/game-course) (MIT License; copyright © 2025 JetBrains Academy).
- **Three.js** and **Vite:** project dependencies, each subject to its own open-source license; see [ATTRIBUTION.md](ATTRIBUTION.md).
- **Additional 3D decorations and effects:** generated procedurally in the project's JavaScript source.
- **Audio:** synthesized in the browser using the Web Audio API; no external music recordings included.

See [LICENSE](LICENSE) and [ATTRIBUTION.md](ATTRIBUTION.md) for details.

## 📌 Notes

- Currency, unlocked cosmetics, and local records are stored with `localStorage` in the current browser. They are **not synced** across devices and are **not** a global leaderboard.
- The online demo and this repository should contain the same release before the competition submission is finalized.
