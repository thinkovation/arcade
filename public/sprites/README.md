# Player sprites

Drop sprite frames here to override the procedural Pac-Man drawing. The game
loads them by URL at runtime — no code change needed; just refresh the page.

## Files

| File                          | Purpose                                  |
| ----------------------------- | ---------------------------------------- |
| `pacman-open.png`             | Mouth-open frame (also used as static)   |
| `pacman-closed.png`           | Mouth-closed frame                       |

Both files are optional:

- **Both present** → chomp animation alternates every ~130ms.
- **Only one present** → that frame is drawn static (no chomp).
- **Neither present** → falls back to the original procedural yellow arc.

## Spec

- **Format:** PNG with transparency (alpha channel).
- **Size:** any square dimensions; drawn at `cellSize - 4` px (20px by default,
  since `cellSize = 24`). 64×64 or 128×128 source gives crisp downscaling.
- **Orientation:** sprite must face **right** (mouth on the right edge) in its
  natural orientation. The renderer rotates it to face the movement direction
  via `DIR_ANGLE` in [`src/games/PacmanGame.jsx`](../../src/games/PacmanGame.jsx).
- **Background:** transparent — the sprite is drawn over the maze.

## Swapping the sprite

Just overwrite the PNGs and reload. Vite's `public/` directory is served at the
site root, so the URLs `/sprites/pacman-open.png` and `/sprites/pacman-closed.png`
resolve to these files in both dev and production builds.
