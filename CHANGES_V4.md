# Lumen Leap V4 — progression, rewards, characters, story

Built on the previously working V3 garden-cover project; original assets preserved.

## Game systems

- Stage progression automatically changes when the three fireflies are rescued. Enemy pursuit speed, spawn delay, active caps, and swarm waves all increase; selected difficulty remains a separate multiplier.
- Each standard defeated bee awards 3 gold; Stinger 5; Armored 4. Rewards persist in browser localStorage. No real-money purchasing or data transfer.
- Shop includes frog color variants, Lumo color variants, and three original low-poly playable alternatives. User may equip owned cosmetics between rounds.
- Lumo's active duration is now 5 seconds, max 4 kills per summon, cooldown 60 seconds.
- Player can enter an 18-character nickname and select a profile avatar; player input is rendered as text, not interpreted as HTML.
- Four-part introductory story automatically advances and can be skipped. Stage banners, Tode dialogue, gold rings after kills, and victory stats add feedback.
- Moonlit Marsh is a fourth visual biome. Later stages mix in faster Stingers and slower tougher Armored bees, using original bee GLB with identification rings.

## Tests

`npm test` — automated logic checks (shop/state sanitization, progression, encounter waves, original V3 tests).
`npm run build` — production Vite build (must be run locally with npm dependencies installed).

This is a playtest build: real WebGL appearance, audio, click/keyboard workflows, and balance require interactive browser confirmation.
