# CLAUDE.md

Guidance for Claude Code working in this repo. Optimized for fast orientation, not as a tutorial — the README covers human onboarding.

## What this is

A React + Vite single-page app that hosts six self-contained arcade games (Snake, Asteroids, Space Invaders, Pac-Man, Minesweeper, Tetris). No backend, no router, no persistence. Selecting a game unmounts the menu and mounts the game; the back button does the reverse.

## Commands

```bash
npm run dev      # Vite dev server (http://localhost:5173)
npm run build    # → dist/
npm run preview  # serve dist/
```

There is **no test runner, no linter, no formatter, no type checker**. Verification = `npm run build` succeeds + manual play in the browser. If you change game logic, actually run `npm run dev` and play it before declaring done.

## Layout

```
src/
├── App.jsx, main.jsx, index.css       # entry
├── ArcadeApp.jsx                      # game-selector + routing
├── components/GameShell.jsx           # shared game chrome
├── hooks/useButtonPress.js            # virtual-button → key mapping
├── games/{Snake,Asteroids,SpaceInvaders,Pacman,Minesweeper,Tetris}Game.jsx
└── lib/utils.js                       # cn() = twMerge(clsx(...))
```

Every game file is self-contained — no cross-game imports, no shared game state. Touching one game does not touch any other.

## The two render strategies (important)

Games fall into one of two patterns. Match the existing pattern of the file you're editing; don't mix them.

**Pattern A — DOM-grid (Snake, Minesweeper, Tetris):** entire game state in `useState`, driven by `setInterval` (or React render). Re-render on every tick. Good for tile/turn-based.

**Pattern B — Canvas (Asteroids, Space Invaders, Pac-Man):** mutable game state in `gameRef.current`, a single `requestAnimationFrame` loop reads/writes it directly, and a small `emitUi()` helper pushes only display values into React state by diffing a key string like `` `${score},${lives},${level},${status}` ``. The React tree only re-renders when *displayed* values change.

If you add React state to a Pattern B game and update it from inside the rAF loop, you will tank the frame rate. The diff key is the gate — keep it.

## Conventions you'll trip over

**Game status enum.** All games use `"IDLE" | "RUNNING" | "PAUSED" | "GAMEOVER" | "DEAD" | "WON"` (not all values in every game). `IDLE` shows a "press any key" overlay; the first relevant input flips to `RUNNING`. Both keyboard listeners and `useButtonPress` perform this transition.

**Keyboard input lives on `window`.** Each game adds its own `keydown`/`keyup` listener in `useEffect`. Virtual on-screen buttons don't dispatch synthetic key events — they flip flags in `keysRef.current` that the game loop reads. `useButtonPress(key, keysRef, { gameRef, onStart })` is the helper.

**Tailwind JIT requires literal class strings.** `src/ArcadeApp.jsx` has `BORDER`, `TXT`, `BTN` lookup objects that spell out every variant (`"hover:border-emerald-600"`, etc.) instead of building strings like `` `hover:border-${color}-600` ``. **Don't "simplify" these into template literals — Tailwind won't emit the classes and the styles will silently disappear.** Same gotcha applies anywhere else dynamic Tailwind classes look tempting.

**`GameShell` is the contract.** Every game returns a `<GameShell title onBack stats controls actions hint>{board}</GameShell>`. `stats` is an array of `{ label, value, borderColor, textColor }`. Match the shape — don't reinvent the chrome.

**`cn()` exists but is unused.** `src/lib/utils.js` exports `cn(...inputs) = twMerge(clsx(inputs))`. None of the existing files import it; they pass long string literals to `className` directly. If you add it, do so deliberately, not as a drive-by refactor.

**High scores are not persisted.** `best` lives in component state and resets on reload or back-to-menu. This is a known gap (see "Known issues" in README). Don't assume it's persisted.

**`useRef` import in `SnakeGame.jsx` is unused.** Pre-existing. Leaving it alone — not your problem unless asked.

## Adding a new game

1. New file at `src/games/MyGame.jsx`. Props: `{ onBack, fullPage = true, ...gameSpecificDefaults }`. Return `<GameShell …>`.
2. Pick render strategy A or B (above) — match the closest existing game.
3. In `src/ArcadeApp.jsx`:
   - Add to the `GAMES` array (`{ id, emoji, label, color, desc }`).
   - **Add the color to all three of `BORDER`, `TXT`, `BTN` with literal class strings.** Skipping any one of these = no styling.
   - Add `if (game === "mygame") return <MyGame onBack={back} />;` to the routing block.
4. Run `npm run dev` and click through it.

## Known stale state

The repo previously had duplicate prototypes at the root (`3games.jsx`, `snake.jsx`, `ArcadeApp.jsx`, `components/`, `games/`, `hooks/`) and `dist/` was tracked in git. Both have been cleaned up. If you see references to root-level paths in old commits or diffs, that's history — the canonical source is under `src/`.

## Things to NOT do without asking

- Don't add a router, state-management library, persistence layer, or test framework — the project is deliberately minimal.
- Don't extract the duplicated Tailwind class strings into shared constants on your own initiative — they're verbose but explicit, and the user has not asked for that refactor.
- Don't refactor a Pattern B canvas game to use React state for game data. You'll regret it; so will the frame rate.
- Don't commit unless the user asks.
