This is an Expo (SDK 58) / React Native game built on the same stack as `../mero-paisa`. Prioritise mobile-first patterns, performance and cross-platform behaviour (iOS, Android, web).

## Expo has changed — do not trust your training data

Read the `expo` major version in `package.json` and check the matching docs (`https://docs.expo.dev/versions/v58.0.0/`, `https://docs.expo.dev/llms.txt`) before touching an Expo API.

## Commands

Use **yarn** (v1) and Node 26 (`nvm use`).

```bash
npx expo install <package>  # always, instead of yarn add, for SDK-compatible versions
yarn start | yarn web
yarn verify                 # typecheck + lint + tests: run before declaring any task done
```

## Rules

- **Game rules live in `src/game/engine.ts` and stay pure** (no React, timers or `Math.random` inside; callers pass `rng`) and unit tested. That keeps them replayable and testable.
- **`use-snake-game.ts` only drives time and side effects**; add new rules to the engine, not the hook.
- **The loop is a fixed timestep on `requestAnimationFrame`** with frame gaps capped (`MAX_FRAME_MS`). Never catch up a long gap, or the snake teleports into a wall after a tab switch.
- **Every maze must keep the spawn row clear.** Engine tests check each `MAZES` entry, so a new maze gets that check for free.
- **Board size is fixed (`BOARD` in `engine.ts`) and scaled to fit**, so scores stay comparable across phones. Changing it invalidates the leaderboards.
- **Persisted keys are permanent**: the AsyncStorage keys in `src/providers/settings.tsx`, skin ids in `SKINS` and maze ids in `MAZES`. Add new ones, never rename or remove. Players' saved data refers to them.
- **Settings loading must tolerate unknown or missing values** (merge onto defaults, fall back on unknown skins), because older and newer builds share storage.
- **Colours, spacing and type come from `src/theme/tokens.ts`**. Board colours come from the active `Skin`, never hard-coded, so every skin, including the pixel Retro LCD one, keeps working.
- **Gestures use `PanResponder`** (as in Mero Paisa), not a native gesture library, so they work in Expo Go, builds and web.
- **Animated values come from `useState(() => new Animated.Value(..))`, not `useRef(..).current`.** The React-compiler lint rules reject reading refs during render.
- **Don't use `useKeepAwake`**: on web it throws if released before the lock is granted. Use the guarded `KeepAwake` component in `play.tsx`.
- **Sound and haptics never throw into the game.** Wrap new calls the way `sound.ts` and `haptics.ts` do.
- **Icon-only controls need an `accessibilityLabel`** and touch targets of at least 48pt.
- Assets are generated, not hand-edited: `python3 tools/make-sounds.py` for `assets/sounds/`; `tools/icon.svg` → PNGs with ImageMagick (`magick -background none -density 600 tools/icon.svg -resize 1024x1024 assets/images/icon.png`, then derive favicon, splash and the Android foreground). ImageMagick's SVG renderer ignores gradients and `H`/`V` path commands, so keep the source to flat shapes.
- Update `README.md` and this file when a major feature or rule changes.
