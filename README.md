# 🕹️ Arcade

A small browser arcade collection of six classic games, built with React + Vite and styled with Tailwind on top of the BrightLocal design system.

| Game           | Style              | Implementation       |
| -------------- | ------------------ | -------------------- |
| 🐍 Snake          | Grid, tile-based   | DOM grid             |
| 🚀 Asteroids      | Vector, physics    | Canvas 2D            |
| 👾 Space Invaders | Sprite, formation  | Canvas 2D            |
| 👻 Pac-Man        | Maze, tile-based   | Canvas 2D            |
| 💣 Minesweeper    | Click-grid, logic  | DOM grid             |
| 🧱 Tetris         | Falling-block      | DOM grid             |

---

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
npm run preview  # serve dist/ locally
```

Requires Node 18+.

---

## Tech stack

- **React 18** — function components, hooks only
- **Vite 6** — dev server and bundler
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **BrightLocal design system** — `@brightlocal/ui-components`, `@brightlocal/tokens`
- **`clsx` + `tailwind-merge`** — exposed as `cn()` in `src/lib/utils.js`

No ESLint / Prettier / test runner configured.

---

## Project structure

```
src/
├── App.jsx                  # mounts <ArcadeApp />
├── ArcadeApp.jsx            # game-selector menu + game routing
├── main.jsx                 # React entry point
├── index.css                # tailwind + BL token imports
├── components/
│   └── GameShell.jsx        # shared game chrome (header/stats/controls/hint)
├── hooks/
│   └── useButtonPress.js    # virtual-button → keyboard-key mapping
├── games/
│   ├── SnakeGame.jsx
│   ├── AsteroidsGame.jsx
│   ├── SpaceInvadersGame.jsx
│   ├── PacmanGame.jsx
│   ├── MinesweeperGame.jsx
│   └── TetrisGame.jsx
└── lib/
    └── utils.js             # cn() = twMerge(clsx(…))
```

`ArcadeApp.jsx` keeps the selected game in local state (`useState`) and renders the matching `<GameComponent onBack={…} />`. There's no router — back means "unmount the game and remount the selector."

---

## Architecture

### `GameShell`

Every game returns its content wrapped in `<GameShell>`, which renders:

- Header: optional ← Back button, title, and a row of stat badges.
- Body: `children` (the board / canvas), `controls` (d-pad / fire button), `actions` (New Game / Pause).
- Footer: a small hint line ("WASD or arrows · Space to pause", etc.).

```jsx
<GameShell
  title="🐍 Snake"
  onBack={onBack}
  stats={[
    { label: "Score", value: score, borderColor: "border-emerald-600", textColor: "text-emerald-400" },
    { label: "Best",  value: best,  borderColor: "border-amber-600",   textColor: "text-amber-400" },
  ]}
  controls={…}
  actions={…}
  hint="WASD or arrows · Space to pause"
>
  {/* board */}
</GameShell>
```

### `useButtonPress`

Wires an on-screen button to a keyboard key. The game already listens for that key on `window`, so the virtual button just flips a flag in the shared `keysRef`. Also handles the IDLE → RUNNING transition on first press.

```jsx
const keysRef = useRef({});
const gameRef = useRef(null);
const fireBp  = useButtonPress(" ", keysRef, { gameRef, onStart: markRunning });

return <Button {...fireBp}>FIRE</Button>;
```

Returns `onMouseDown / onMouseUp / onMouseLeave / onTouchStart / onTouchEnd` handlers.

### Two render strategies

- **DOM-grid games** (Snake, Minesweeper, Tetris) keep their full state in React `useState` and re-render on every tick.
- **Canvas games** (Asteroids, Space Invaders, Pac-Man) keep mutable game state in a `gameRef`, run a `requestAnimationFrame` loop, and only push to React state via an `emitUi()` helper that diffs a key string (`"score,lives,level,status"`) so the surrounding `GameShell` re-renders only when displayed values actually change.

### Game state machine

All games share a small status enum:

```
IDLE  →  RUNNING  ↔  PAUSED        (Snake, Tetris)
                  ↘  GAMEOVER / DEAD / WON
```

`IDLE` shows a "Press any key" overlay. The first relevant input transitions to `RUNNING`.

---

## Controls reference

| Game             | Move / Aim                | Action / Fire   | Pause |
| ---------------- | ------------------------- | --------------- | ----- |
| Snake            | Arrows / WASD             | —               | Space |
| Asteroids        | ←/→ rotate, ↑ thrust      | Space (fire)    | —     |
| Space Invaders   | ←/→                       | Space / ↑       | —     |
| Pac-Man          | Arrows / WASD             | —               | —     |
| Minesweeper      | Mouse: click reveal       | Right-click flag | —    |
| Tetris           | ←/→ move, ↓ soft, ↑ rotate| Space hard drop | P     |

All games also have on-screen touch buttons.

---

## Adding a new game

1. Create `src/games/MyGame.jsx`. It must accept `{ onBack, fullPage }` and return `<GameShell title="…" onBack={onBack} fullPage={fullPage} … />`.
2. Pick a render strategy:
   - **Tile / turn-based** → keep state in `useState`, drive ticks with `setInterval` or `requestAnimationFrame`.
   - **Real-time / physics** → keep state in `useRef`, use `requestAnimationFrame`, and surface only display values to React via an `emitUi()` diff helper.
3. Add an entry to the `GAMES` array in `src/ArcadeApp.jsx` and the matching `BORDER` / `TXT` / `BTN` color maps. **Important:** Tailwind's JIT will only emit a class if it appears as a literal string in source — that's why these maps use full literal class names rather than building strings dynamically.
4. Wire up the route at the bottom of `ArcadeApp.jsx`:
   ```jsx
   if (game === "mygame") return <MyGame onBack={back} />;
   ```

---

## Known issues / future work

- **High scores don't persist** — `best` lives in component state and resets on reload. A `localStorage` wrapper would fix this for all six games at once.
- **Pac-Man ghost pass-through** — collision is checked after both entities move, so player and ghost swapping tiles in the same tick miss each other.
- **Pac-Man ghosts share a single chase strategy** (greedy Manhattan + 15% randomness) instead of per-ghost personalities.
- **Pac-Man maze has no tunnel wrap** despite a gap that suggests one.
- **Icon-only buttons lack `aria-label`** — screen readers announce raw glyphs ("▲", "►", "↻").
- **No tests, no linter.**

---

## License

Personal/internal project — no license specified.
