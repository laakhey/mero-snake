# Mero Snake

The classic phone snake game, rebuilt for modern phones with Expo. Same stack and look as Mero Paisa.

## Features

- **Three modes**: Classic (walls all round), Endless (edges wrap) and Maze (five layouts: Box, Tunnel, Mill, Rails, Apartment).
- **Speed levels 1–9**, like the original phones. Faster levels score more for each bite.
- **Timed bonus stars** after every 5 foods. They are worth more the sooner you reach them and blink before they vanish.
- **Controls**: swipe anywhere, an on-screen D-pad, or both. Arrow keys / WASD and Space on a keyboard. Quick double turns are buffered, and you can never reverse into yourself.
- **Game feel**: 3-2-1 countdown, particle bursts and floating points, screen shake and flash on a crash, generated chiptune sound effects and haptics.
- **Four board skins**: Neon, Mero (indigo), Retro LCD (square pixels like the old phones) and Candy. Light, dark or system theme for the menus.
- **Top-10 leaderboard per mode and maze**, plus lifetime stats (games, food, bonuses, longest snake, time played). Everything is stored on the device.
- **Auto-pause** when the app goes to the background, the Android back button pauses first, and the screen stays awake while you play.
- **Attract mode**: a self-playing snake on the home screen.

## Run it

Requires Node 26 (`nvm use`) and yarn.

```bash
yarn install
yarn start      # scan the QR code with Expo Go
yarn web        # play in the browser
yarn verify     # typecheck + lint + tests
```

## Publishing (EAS)

The project is `@laakhey/mero-snake` on EAS. Build profiles in `eas.json` map to update channels of the same name (`preview`, `production`).

```bash
npx eas-cli@latest build --profile preview --platform android   # installable APK
npx eas-cli@latest update --channel preview --environment preview --message "..."  # ship JS/asset changes
```

Updates only reach builds with the same runtime version (`appVersion` policy, so bump `version` in `app.json` when native code changes). Release builds pick up a new update within two cold launches.

## Project layout

| Path | What lives there |
| --- | --- |
| `src/game/engine.ts` | Pure game rules: movement, turn buffer, collisions, food, bonus, scoring. Fully unit tested. |
| `src/game/mazes.ts` | Maze layouts, drawn relative to the board size. |
| `src/game/use-snake-game.ts` | Countdown, fixed-timestep loop, pause/resume, sound and haptics. |
| `src/game/records.ts` | Leaderboard and stats helpers. |
| `src/components/board.tsx` | SVG renderer for the board, snake, food and bonus. |
| `src/app/` | Screens: home, play, high scores, settings, how to play. |
| `tools/` | Scripts that generate the sound effects and the icon source. |

Regenerate assets with `python3 tools/make-sounds.py` and the ImageMagick commands noted in `AGENTS.md`.
