import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@brightlocal/ui-components/button";
import GameShell from "../components/GameShell";
import { isBossActive } from "../lib/bossMode";

const DIR = { UP: [0, -1], DOWN: [0, 1], LEFT: [-1, 0], RIGHT: [1, 0] };
const OPPOSITE = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };

const rand = (cols, rows) => ({
  x: Math.floor(Math.random() * cols),
  y: Math.floor(Math.random() * rows),
});

const initState = (cols, rows) => ({
  snake: [
    { x: Math.floor(cols / 2), y: Math.floor(rows / 2) },
    { x: Math.floor(cols / 2) - 1, y: Math.floor(rows / 2) },
    { x: Math.floor(cols / 2) - 2, y: Math.floor(rows / 2) },
  ],
  dir: "RIGHT",
  nextDir: "RIGHT",
  food: { x: Math.floor(cols * 0.75), y: Math.floor(rows / 2) },
  score: 0,
  best: 0,
  status: "IDLE",
});

/**
 * Reusable Snake game component.
 *
 * @param {Object}   props
 * @param {number}   [props.cols=20]     – Grid columns
 * @param {number}   [props.rows=20]     – Grid rows
 * @param {number}   [props.cellSize=24] – Pixel size per cell
 * @param {number}   [props.tickMs=130]  – Milliseconds per tick
 * @param {Function} [props.onBack]      – Back button handler
 * @param {boolean}  [props.fullPage=true]
 */
export default function SnakeGame({
  cols = 20,
  rows = 20,
  cellSize = 24,
  tickMs = 130,
  onBack,
  fullPage = true,
}) {
  const [state, setState] = useState(() => initState(cols, rows));

  const spawnFood = useCallback(
    (snake) => {
      let pos;
      do { pos = rand(cols, rows); }
      while (snake.some((s) => s.x === pos.x && s.y === pos.y));
      return pos;
    },
    [cols, rows],
  );

  const tick = useCallback(() => {
    if (isBossActive()) return;
    setState((prev) => {
      if (prev.status !== "RUNNING") return prev;
      const d = DIR[prev.nextDir];
      const head = { x: prev.snake[0].x + d[0], y: prev.snake[0].y + d[1] };
      const hitWall = head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows;
      const hitSelf = prev.snake.some((s) => s.x === head.x && s.y === head.y);
      if (hitWall || hitSelf) {
        return { ...prev, status: "DEAD", best: Math.max(prev.best, prev.score) };
      }
      const ate = head.x === prev.food.x && head.y === prev.food.y;
      const newSnake = [head, ...prev.snake];
      if (!ate) newSnake.pop();
      return {
        ...prev,
        snake: newSnake,
        dir: prev.nextDir,
        score: ate ? prev.score + 10 : prev.score,
        food: ate ? spawnFood(newSnake) : prev.food,
      };
    });
  }, [cols, rows, spawnFood]);

  useEffect(() => {
    if (state.status !== "RUNNING") return;
    const id = setInterval(tick, tickMs);
    return () => clearInterval(id);
  }, [state.status, tick, tickMs]);

  useEffect(() => {
    const onKey = (e) => {
      const map = {
        ArrowUp: "UP", ArrowDown: "DOWN", ArrowLeft: "LEFT", ArrowRight: "RIGHT",
        w: "UP", s: "DOWN", a: "LEFT", d: "RIGHT",
      };
      const newDir = map[e.key];
      if (newDir) {
        e.preventDefault();
        setState((prev) => {
          if (prev.status === "IDLE") return { ...prev, status: "RUNNING", nextDir: newDir };
          if (prev.status !== "RUNNING") return prev;
          if (OPPOSITE[newDir] === prev.dir) return prev;
          return { ...prev, nextDir: newDir };
        });
      } else if (e.key === " ") {
        setState((p) =>
          p.status === "RUNNING" ? { ...p, status: "PAUSED" }
          : p.status === "PAUSED" ? { ...p, status: "RUNNING" }
          : p,
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const start = () => setState((p) => ({ ...initState(cols, rows), best: p.best, status: "RUNNING" }));
  const steer = (dir) =>
    setState((prev) => {
      if (prev.status === "IDLE") return { ...prev, status: "RUNNING", nextDir: dir };
      if (prev.status !== "RUNNING") return prev;
      if (OPPOSITE[dir] === prev.dir) return prev;
      return { ...prev, nextDir: dir };
    });

  const { snake, food, score, best, status } = state;

  const cellClass = (x, y) => {
    const isHead = snake[0].x === x && snake[0].y === y;
    if (isHead) return "bg-emerald-400 rounded-sm shadow-[0_0_6px_rgba(52,211,153,0.8)]";
    const bi = snake.findIndex((s, i) => i > 0 && s.x === x && s.y === y);
    if (bi > 0) return bi / snake.length < 0.4 ? "bg-emerald-500 rounded-sm" : "bg-emerald-700 rounded-sm";
    if (food.x === x && food.y === y) return "bg-red-400 rounded-full shadow-[0_0_6px_rgba(248,113,113,0.8)] animate-pulse";
    return "";
  };

  const W = cols * cellSize;
  const H = rows * cellSize;

  return (
    <GameShell
      title="🐍 Snake"
      onBack={onBack}
      fullPage={fullPage}
      stats={[
        { label: "Score", value: score, borderColor: "border-emerald-600", textColor: "text-emerald-400" },
        { label: "Best", value: best, borderColor: "border-amber-600", textColor: "text-amber-400" },
      ]}
      controls={
        <>
          <div className="grid grid-rows-3 grid-cols-3 gap-1 w-28">
            <div />
            <Button iconOnly variant="outline" className="size-9 rounded-md border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white" onClick={() => steer("UP")}>▲</Button>
            <div />
            <Button iconOnly variant="outline" className="size-9 rounded-md border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white" onClick={() => steer("LEFT")}>◄</Button>
            <Button iconOnly variant="outline" className="size-9 rounded-md border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-zinc-500 cursor-default" disabled>●</Button>
            <Button iconOnly variant="outline" className="size-9 rounded-md border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white" onClick={() => steer("RIGHT")}>►</Button>
            <div />
            <Button iconOnly variant="outline" className="size-9 rounded-md border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white" onClick={() => steer("DOWN")}>▼</Button>
            <div />
          </div>
        </>
      }
      actions={
        <>
          <Button onClick={start} size="sm" variant="outline" className="border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs">
            New Game
          </Button>
          <Button
            onClick={() => setState((p) => p.status === "RUNNING" ? { ...p, status: "PAUSED" } : p.status === "PAUSED" ? { ...p, status: "RUNNING" } : p)}
            size="sm" variant="outline"
            className="border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs"
            disabled={status !== "RUNNING" && status !== "PAUSED"}
          >
            {status === "PAUSED" ? "Resume" : "Pause"}
          </Button>
        </>
      }
      hint="WASD or arrows · Space to pause"
    >
      {/* Board */}
      <div
        className="relative bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden"
        style={{ width: W, height: H }}
      >
        <svg className="absolute inset-0 opacity-10" width={W} height={H}>
          {Array.from({ length: cols + 1 }, (_, i) => (
            <line key={`v${i}`} x1={i * cellSize} y1={0} x2={i * cellSize} y2={H} stroke="#6b7280" strokeWidth="0.5" />
          ))}
          {Array.from({ length: rows + 1 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * cellSize} x2={W} y2={i * cellSize} stroke="#6b7280" strokeWidth="0.5" />
          ))}
        </svg>

        {snake.map((s, i) => (
          <div
            key={`s${i}`}
            className={`absolute transition-none ${cellClass(s.x, s.y)}`}
            style={{ left: s.x * cellSize + 1, top: s.y * cellSize + 1, width: cellSize - 2, height: cellSize - 2 }}
          />
        ))}
        <div
          className={`absolute ${cellClass(food.x, food.y)}`}
          style={{ left: food.x * cellSize + 2, top: food.y * cellSize + 2, width: cellSize - 4, height: cellSize - 4 }}
        />

        {status === "IDLE" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
            <p className="text-white font-mono text-lg mb-1">Ready?</p>
            <p className="text-zinc-400 font-mono text-sm">Press any arrow key or tap a button below</p>
          </div>
        )}
        {status === "PAUSED" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/70 backdrop-blur-sm">
            <p className="text-white font-mono text-2xl">PAUSED</p>
            <p className="text-zinc-400 font-mono text-sm mt-1">Space to resume</p>
          </div>
        )}
        {status === "DEAD" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm gap-3">
            <p className="text-red-400 font-mono text-2xl font-bold">GAME OVER</p>
            <p className="text-zinc-300 font-mono text-sm">Score: {score}</p>
            <Button onClick={start} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono mt-1">
              Play Again
            </Button>
          </div>
        )}
      </div>
    </GameShell>
  );
}
