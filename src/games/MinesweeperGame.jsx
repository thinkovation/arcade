import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@brightlocal/ui-components/button";
import GameShell from "../components/GameShell";
import { isBossActive, subscribeBoss } from "../lib/bossMode";

const DIFFICULTIES = {
  easy: { cols: 9, rows: 9, mines: 10, label: "Easy" },
  medium: { cols: 12, rows: 12, mines: 22, label: "Medium" },
  hard: { cols: 16, rows: 16, mines: 45, label: "Hard" },
};

const NUM_COLOR = [
  "",
  "text-sky-400",
  "text-emerald-400",
  "text-rose-400",
  "text-violet-400",
  "text-amber-400",
  "text-cyan-400",
  "text-fuchsia-400",
  "text-zinc-300",
];

const makeEmptyGrid = (cols, rows) =>
  Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ mine: false, revealed: false, flagged: false, count: 0 })),
  );

function placeMines(grid, cols, rows, mineCount, safeX, safeY) {
  const exclude = new Set();
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = safeX + dx, ny = safeY + dy;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) exclude.add(`${nx},${ny}`);
    }
  }
  const candidates = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++)
      if (!exclude.has(`${x},${y}`)) candidates.push([x, y]);
  const placed = Math.min(mineCount, candidates.length);
  for (let i = 0; i < placed; i++) {
    const j = i + Math.floor(Math.random() * (candidates.length - i));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    const [x, y] = candidates[i];
    grid[y][x].mine = true;
  }
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x].mine) continue;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && grid[ny][nx].mine) n++;
        }
      grid[y][x].count = n;
    }
  }
  return placed;
}

function floodReveal(grid, cols, rows, x, y) {
  const stack = [[x, y]];
  let count = 0;
  while (stack.length) {
    const [cx, cy] = stack.pop();
    if (cx < 0 || cx >= cols || cy < 0 || cy >= rows) continue;
    const cell = grid[cy][cx];
    if (cell.revealed || cell.flagged || cell.mine) continue;
    cell.revealed = true;
    count++;
    if (cell.count === 0) {
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          stack.push([cx + dx, cy + dy]);
        }
    }
  }
  return count;
}

/**
 * Minesweeper — click to reveal, right-click to flag. First click is always safe.
 *
 * @param {Object}   props
 * @param {Function} [props.onBack]
 * @param {boolean}  [props.fullPage=true]
 */
export default function MinesweeperGame({ onBack, fullPage = true }) {
  const [diffKey, setDiffKey] = useState("easy");
  const diff = DIFFICULTIES[diffKey];
  const [grid, setGrid] = useState(() => makeEmptyGrid(diff.cols, diff.rows));
  const [status, setStatus] = useState("IDLE");
  const [flagsPlaced, setFlagsPlaced] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [bests, setBests] = useState({ easy: null, medium: null, hard: null });
  const startedAtRef = useRef(null);
  const minesPlacedRef = useRef(false);

  const reset = useCallback((d = diff) => {
    setGrid(makeEmptyGrid(d.cols, d.rows));
    setStatus("IDLE");
    setFlagsPlaced(0);
    setRevealed(0);
    setSeconds(0);
    startedAtRef.current = null;
    minesPlacedRef.current = false;
  }, [diff]);

  // tick the timer while running
  useEffect(() => {
    if (status !== "RUNNING") return;
    const id = setInterval(() => {
      if (isBossActive()) return;
      if (startedAtRef.current) {
        setSeconds(Math.floor((performance.now() - startedAtRef.current) / 1000));
      }
    }, 250);
    return () => clearInterval(id);
  }, [status]);

  // Shift startedAt forward by the time spent in boss mode so the timer
  // truly pauses rather than jumping forward when the overlay closes.
  useEffect(() => {
    let bossEnteredAt = null;
    return subscribeBoss((active) => {
      if (active) {
        bossEnteredAt = performance.now();
      } else if (bossEnteredAt != null && startedAtRef.current) {
        startedAtRef.current += performance.now() - bossEnteredAt;
        bossEnteredAt = null;
      }
    });
  }, []);

  const changeDifficulty = (key) => {
    if (key === diffKey) return;
    setDiffKey(key);
    reset(DIFFICULTIES[key]);
  };

  const reveal = (x, y) => {
    if (status === "GAMEOVER" || status === "WON") return;
    const cell = grid[y][x];
    if (cell.flagged || cell.revealed) return;

    const next = grid.map((row) => row.map((c) => ({ ...c })));
    let placed = false;
    if (!minesPlacedRef.current) {
      placeMines(next, diff.cols, diff.rows, diff.mines, x, y);
      minesPlacedRef.current = true;
      startedAtRef.current = performance.now();
      placed = true;
    }

    if (next[y][x].mine) {
      // explode all mines
      for (let yy = 0; yy < diff.rows; yy++)
        for (let xx = 0; xx < diff.cols; xx++)
          if (next[yy][xx].mine) next[yy][xx].revealed = true;
      next[y][x].exploded = true;
      setGrid(next);
      setStatus("GAMEOVER");
      return;
    }

    const newlyRevealed = floodReveal(next, diff.cols, diff.rows, x, y);
    const totalRevealed = revealed + newlyRevealed;
    setGrid(next);
    setRevealed(totalRevealed);
    if (placed) setStatus("RUNNING");

    const safeCells = diff.cols * diff.rows - diff.mines;
    if (totalRevealed >= safeCells) {
      const elapsed = Math.floor((performance.now() - startedAtRef.current) / 1000);
      setSeconds(elapsed);
      setStatus("WON");
      setBests((b) => ({ ...b, [diffKey]: b[diffKey] == null ? elapsed : Math.min(b[diffKey], elapsed) }));
    }
  };

  const flag = (x, y) => {
    if (status === "GAMEOVER" || status === "WON") return;
    const cell = grid[y][x];
    if (cell.revealed) return;
    const next = grid.map((row) => row.map((c) => ({ ...c })));
    next[y][x].flagged = !cell.flagged;
    setGrid(next);
    setFlagsPlaced((n) => n + (next[y][x].flagged ? 1 : -1));
  };

  const minesRemaining = diff.mines - flagsPlaced;
  const best = bests[diffKey];

  return (
    <GameShell
      title="💣 Minesweeper"
      onBack={onBack}
      fullPage={fullPage}
      stats={[
        { label: "Mines", value: minesRemaining, borderColor: "border-rose-600", textColor: "text-rose-400" },
        { label: "Time", value: seconds, borderColor: "border-sky-600", textColor: "text-sky-400" },
        { label: "Best", value: best == null ? "—" : best, borderColor: "border-amber-600", textColor: "text-amber-400" },
      ]}
      actions={
        <>
          {Object.entries(DIFFICULTIES).map(([key, d]) => (
            <Button
              key={key}
              size="sm"
              variant="outline"
              onClick={() => changeDifficulty(key)}
              className={`font-mono text-xs rounded-md border-zinc-600 ${
                diffKey === key
                  ? "bg-rose-900/40 text-rose-300 border-rose-700"
                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              }`}
            >
              {d.label}
            </Button>
          ))}
          <Button onClick={() => reset()} size="sm" variant="outline" className="border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs rounded-md">
            New Game
          </Button>
        </>
      }
      hint="Click reveal · Right-click flag · First click is always safe"
    >
      <div
        className="relative bg-zinc-950 border border-zinc-800 rounded-lg p-2 select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          className="grid gap-0.5"
          style={{ gridTemplateColumns: `repeat(${diff.cols}, 1.75rem)`, gridTemplateRows: `repeat(${diff.rows}, 1.75rem)` }}
        >
          {grid.map((row, y) =>
            row.map((cell, x) => (
              <button
                key={`${x},${y}`}
                onClick={() => reveal(x, y)}
                onContextMenu={(e) => { e.preventDefault(); flag(x, y); }}
                className={[
                  "size-7 flex items-center justify-center font-mono text-sm font-bold rounded-sm transition-colors",
                  cell.revealed
                    ? cell.exploded
                      ? "bg-rose-700 text-white"
                      : cell.mine
                      ? "bg-zinc-800 text-rose-400"
                      : `bg-zinc-800 ${cell.count > 0 ? NUM_COLOR[cell.count] : ""}`
                    : "bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-600 border border-zinc-600",
                ].join(" ")}
              >
                {cell.revealed
                  ? cell.mine
                    ? "💣"
                    : cell.count > 0
                    ? cell.count
                    : ""
                  : cell.flagged
                  ? "🚩"
                  : ""}
              </button>
            )),
          )}
        </div>

        {status === "GAMEOVER" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm gap-3 rounded-lg">
            <p className="text-rose-400 font-mono text-2xl font-bold">BOOM</p>
            <p className="text-zinc-300 font-mono text-sm">You hit a mine</p>
            <Button onClick={() => reset()} size="sm" className="bg-rose-700 hover:bg-rose-600 text-white font-mono mt-1 rounded-md">
              Try Again
            </Button>
          </div>
        )}
        {status === "WON" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm gap-3 rounded-lg">
            <p className="text-emerald-400 font-mono text-2xl font-bold">CLEARED</p>
            <p className="text-zinc-300 font-mono text-sm">Time: {seconds}s</p>
            <Button onClick={() => reset()} size="sm" className="bg-emerald-700 hover:bg-emerald-600 text-white font-mono mt-1 rounded-md">
              Play Again
            </Button>
          </div>
        )}
      </div>
    </GameShell>
  );
}
