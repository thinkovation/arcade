import { useState, useEffect, useRef } from "react";
import { Button } from "@brightlocal/ui-components/button";
import GameShell from "../components/GameShell";
import { useButtonPress } from "../hooks/useButtonPress";

const MAZE = [
  "###############",
  "#o.....#.....o#",
  "#.##.#.#.#.##.#",
  "#.#.........#.#",
  "#.#.##.#.##.#.#",
  "#......#......#",
  "##.##.# #.##.##",
  "#......G......#",
  "#.##.#####.##.#",
  "#.............#",
  "#.##.#.#.#.##.#",
  "#o.....P.....o#",
  "###############",
];
const COLS = MAZE[0].length;
const ROWS = MAZE.length;

const DIRS = { UP: [0, -1], DOWN: [0, 1], LEFT: [-1, 0], RIGHT: [1, 0] };
const REVERSE = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
const DIR_ANGLE = { RIGHT: 0, DOWN: Math.PI / 2, LEFT: Math.PI, UP: -Math.PI / 2 };
const GHOST_COLORS = ["#ef4444", "#f472b6", "#06b6d4"];

const isWall = (grid, x, y) => !grid[y] || grid[y][x] === undefined || grid[y][x] === "#";

function buildState() {
  const grid = MAZE.map((row) => row.split(""));
  let player = null;
  const ghostStarts = [];
  let dotCount = 0;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const c = grid[y][x];
      if (c === "P") { player = { x, y }; grid[y][x] = " "; }
      else if (c === "G") { ghostStarts.push({ x, y }); grid[y][x] = " "; }
      else if (c === "." || c === "o") dotCount++;
    }
  }
  // 3 ghosts spawning around the central G tile
  const spawn = ghostStarts[0];
  const ghosts = [
    { ...spawn, dir: "UP", color: GHOST_COLORS[0], home: { ...spawn } },
    { x: spawn.x - 1, y: spawn.y, dir: "LEFT", color: GHOST_COLORS[1], home: { x: spawn.x - 1, y: spawn.y } },
    { x: spawn.x + 1, y: spawn.y, dir: "RIGHT", color: GHOST_COLORS[2], home: { x: spawn.x + 1, y: spawn.y } },
  ];
  return {
    grid,
    player: { ...player, dir: "LEFT", nextDir: "LEFT", home: { ...player } },
    ghosts,
    dotCount,
    score: 0,
    best: 0,
    lives: 3,
    level: 1,
    status: "IDLE",
    frightTimer: 0,
    lastMove: 0,
  };
}

function stepPlayer(p, grid) {
  const can = (d) => {
    const [dx, dy] = DIRS[d];
    return !isWall(grid, p.x + dx, p.y + dy);
  };
  let dir = p.dir;
  if (p.nextDir && can(p.nextDir)) dir = p.nextDir;
  if (!can(dir)) return p;
  const [dx, dy] = DIRS[dir];
  return { ...p, dir, x: p.x + dx, y: p.y + dy };
}

function stepGhost(g, player, grid, frightened) {
  const opts = ["UP", "DOWN", "LEFT", "RIGHT"].filter((d) => {
    if (d === REVERSE[g.dir]) return false;
    const [dx, dy] = DIRS[d];
    return !isWall(grid, g.x + dx, g.y + dy);
  });
  let dir;
  if (opts.length === 0) {
    dir = REVERSE[g.dir];
    if (isWall(grid, g.x + DIRS[dir][0], g.y + DIRS[dir][1])) return g;
  } else if (frightened || Math.random() < 0.15) {
    dir = opts[Math.floor(Math.random() * opts.length)];
  } else {
    let best = Infinity;
    for (const d of opts) {
      const [dx, dy] = DIRS[d];
      const dist = Math.abs(g.x + dx - player.x) + Math.abs(g.y + dy - player.y);
      if (dist < best) { best = dist; dir = d; }
    }
  }
  const [dx, dy] = DIRS[dir];
  return { ...g, dir, x: g.x + dx, y: g.y + dy };
}

/**
 * Pac-Man clone — discrete-tile maze with dots, power pellets, and 3 chasing ghosts.
 *
 * @param {Object}   props
 * @param {number}   [props.cellSize=24]
 * @param {number}   [props.tickMs=170]
 * @param {Function} [props.onBack]
 * @param {boolean}  [props.fullPage=true]
 */
export default function PacmanGame({ cellSize = 24, tickMs = 170, onBack, fullPage = true }) {
  const W = COLS * cellSize, H = ROWS * cellSize;
  const canvasRef = useRef(null);
  const keysRef = useRef({});
  const gameRef = useRef(null);
  const rafRef = useRef(null);
  const frameRef = useRef(0);
  const [ui, setUi] = useState({ score: 0, best: 0, lives: 3, status: "IDLE" });

  const markRunning = () => setUi((u) => ({ ...u, status: "RUNNING" }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    gameRef.current = buildState();

    let lastUiKey = "";
    const emitUi = () => {
      const g = gameRef.current;
      const key = `${g.score},${g.lives},${g.status}`;
      if (key !== lastUiKey) {
        lastUiKey = key;
        setUi({ score: g.score, best: g.best, lives: g.lives, status: g.status });
      }
    };

    const resetPositions = () => {
      const g = gameRef.current;
      g.player = { ...g.player, x: g.player.home.x, y: g.player.home.y, dir: "LEFT", nextDir: "LEFT" };
      g.ghosts = g.ghosts.map((gh) => ({ ...gh, x: gh.home.x, y: gh.home.y, dir: "UP" }));
      g.frightTimer = 0;
    };

    const tickLogic = () => {
      const g = gameRef.current;
      if (g.status !== "RUNNING") return;

      // queue input
      const q = keysRef.current;
      if (q["ArrowUp"] || q.w) g.player.nextDir = "UP";
      else if (q["ArrowDown"] || q.s) g.player.nextDir = "DOWN";
      else if (q["ArrowLeft"] || q.a) g.player.nextDir = "LEFT";
      else if (q["ArrowRight"] || q.d) g.player.nextDir = "RIGHT";

      g.player = stepPlayer(g.player, g.grid);

      const cell = g.grid[g.player.y][g.player.x];
      if (cell === ".") { g.grid[g.player.y][g.player.x] = " "; g.score += 10; g.dotCount--; }
      else if (cell === "o") { g.grid[g.player.y][g.player.x] = " "; g.score += 50; g.dotCount--; g.frightTimer = 30; }

      const frightened = g.frightTimer > 0;
      // ghosts move slower when frightened
      if (!frightened || frameRef.current % 2 === 0) {
        g.ghosts = g.ghosts.map((gh) => stepGhost(gh, g.player, g.grid, frightened));
      }
      if (g.frightTimer > 0) g.frightTimer--;

      // collisions
      for (let i = 0; i < g.ghosts.length; i++) {
        const gh = g.ghosts[i];
        if (gh.x === g.player.x && gh.y === g.player.y) {
          if (frightened) {
            g.score += 200;
            g.ghosts[i] = { ...gh, x: gh.home.x, y: gh.home.y, dir: "UP" };
          } else {
            g.lives--;
            g.best = Math.max(g.best, g.score);
            if (g.lives <= 0) { g.status = "GAMEOVER"; }
            else { resetPositions(); }
            break;
          }
        }
      }

      if (g.dotCount <= 0 && g.status === "RUNNING") {
        g.status = "WON";
        g.best = Math.max(g.best, g.score);
      }

      emitUi();
    };

    const drawWall = (x, y) => {
      ctx.fillStyle = "#1e3a8a";
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 1;
      ctx.strokeRect(x * cellSize + 0.5, y * cellSize + 0.5, cellSize - 1, cellSize - 1);
    };

    const render = () => {
      const g = gameRef.current;
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, W, H);

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const c = g.grid[y][x];
          if (c === "#") drawWall(x, y);
          else if (c === ".") {
            ctx.fillStyle = "#fde68a";
            ctx.beginPath();
            ctx.arc(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (c === "o") {
            const r = 5 + Math.sin(frameRef.current * 0.18) * 1.2;
            ctx.fillStyle = "#fef3c7";
            ctx.shadowColor = "#fcd34d"; ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      // pacman
      const px = g.player.x * cellSize + cellSize / 2;
      const py = g.player.y * cellSize + cellSize / 2;
      const mouth = (Math.sin(frameRef.current * 0.4) * 0.5 + 0.5) * 0.6 + 0.05;
      const a = DIR_ANGLE[g.player.dir];
      ctx.fillStyle = "#facc15";
      ctx.shadowColor = "#facc15"; ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(px, py, cellSize / 2 - 2, a + mouth, a - mouth + Math.PI * 2);
      ctx.lineTo(px, py);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // ghosts
      const frightened = g.frightTimer > 0;
      const blinking = frightened && g.frightTimer < 8 && Math.floor(frameRef.current / 6) % 2 === 0;
      for (const gh of g.ghosts) {
        const gx = gh.x * cellSize + cellSize / 2;
        const gy = gh.y * cellSize + cellSize / 2;
        const r = cellSize / 2 - 2;
        ctx.fillStyle = frightened ? (blinking ? "#ffffff" : "#3b82f6") : gh.color;
        ctx.beginPath();
        ctx.arc(gx, gy - 2, r, Math.PI, 0);
        ctx.lineTo(gx + r, gy + r - 2);
        const seg = (r * 2) / 4;
        for (let i = 0; i < 4; i++) {
          ctx.lineTo(gx + r - (i + 0.5) * seg, gy + r - 5);
          ctx.lineTo(gx + r - (i + 1) * seg, gy + r - 2);
        }
        ctx.closePath();
        ctx.fill();
        // eyes
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(gx - r / 2.5, gy - r / 4, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(gx + r / 2.5, gy - r / 4, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#000";
        const [edx, edy] = DIRS[gh.dir];
        ctx.beginPath(); ctx.arc(gx - r / 2.5 + edx * 1.2, gy - r / 4 + edy * 1.2, 1.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(gx + r / 2.5 + edx * 1.2, gy - r / 4 + edy * 1.2, 1.4, 0, Math.PI * 2); ctx.fill();
      }

      // overlays
      if (g.status === "IDLE" || g.status === "GAMEOVER" || g.status === "WON") {
        ctx.fillStyle = "rgba(9,9,11,0.78)";
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = "center";
        if (g.status === "IDLE") {
          ctx.fillStyle = "#facc15"; ctx.font = "bold 26px monospace";
          ctx.fillText("PAC-MAN", W / 2, H / 2 - 14);
          ctx.fillStyle = "#a1a1aa"; ctx.font = "12px monospace";
          ctx.fillText("Arrow keys or buttons to start", W / 2, H / 2 + 14);
        } else if (g.status === "GAMEOVER") {
          ctx.fillStyle = "#f87171"; ctx.font = "bold 28px monospace";
          ctx.fillText("GAME OVER", W / 2, H / 2 - 16);
          ctx.fillStyle = "#e4e4e7"; ctx.font = "14px monospace";
          ctx.fillText(`Score: ${g.score}`, W / 2, H / 2 + 8);
        } else {
          ctx.fillStyle = "#34d399"; ctx.font = "bold 28px monospace";
          ctx.fillText("YOU WIN!", W / 2, H / 2 - 16);
          ctx.fillStyle = "#e4e4e7"; ctx.font = "14px monospace";
          ctx.fillText(`Score: ${g.score}`, W / 2, H / 2 + 8);
        }
      }
    };

    let lastMove = performance.now();
    const loop = (now) => {
      frameRef.current++;
      if (now - lastMove >= tickMs) {
        tickLogic();
        lastMove = now;
      }
      render();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [W, H, cellSize, tickMs]);

  useEffect(() => {
    const down = (e) => {
      const map = { ArrowUp: "ArrowUp", ArrowDown: "ArrowDown", ArrowLeft: "ArrowLeft", ArrowRight: "ArrowRight",
        w: "w", a: "a", s: "s", d: "d" };
      if (map[e.key]) {
        keysRef.current[map[e.key]] = true;
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
        if (gameRef.current?.status === "IDLE") { gameRef.current.status = "RUNNING"; markRunning(); }
      }
    };
    const up = (e) => { keysRef.current[e.key] = false; };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  const newGame = () => {
    const prev = gameRef.current;
    const fresh = buildState();
    fresh.best = Math.max(prev?.best ?? 0, prev?.score ?? 0);
    fresh.status = "RUNNING";
    gameRef.current = fresh;
    setUi({ score: 0, best: fresh.best, lives: 3, status: "RUNNING" });
  };

  const bpOpts = { gameRef, onStart: markRunning };
  const upBp = useButtonPress("ArrowUp", keysRef, bpOpts);
  const downBp = useButtonPress("ArrowDown", keysRef, bpOpts);
  const leftBp = useButtonPress("ArrowLeft", keysRef, bpOpts);
  const rightBp = useButtonPress("ArrowRight", keysRef, bpOpts);

  return (
    <GameShell
      title="👻 Pac-Man"
      onBack={onBack}
      fullPage={fullPage}
      stats={[
        { label: "Score", value: ui.score, borderColor: "border-amber-600", textColor: "text-amber-400" },
        { label: "Lives", value: ui.lives, borderColor: "border-rose-600", textColor: "text-rose-400" },
        { label: "Best", value: ui.best, borderColor: "border-emerald-600", textColor: "text-emerald-400" },
      ]}
      controls={
        <div className="grid grid-rows-3 grid-cols-3 gap-1 w-32">
          <div />
          <Button iconOnly variant="outline" className="size-10 rounded-md border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white select-none" {...upBp}>▲</Button>
          <div />
          <Button iconOnly variant="outline" className="size-10 rounded-md border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white select-none" {...leftBp}>◄</Button>
          <Button iconOnly variant="outline" className="size-10 rounded-md border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-zinc-500 cursor-default" disabled>●</Button>
          <Button iconOnly variant="outline" className="size-10 rounded-md border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white select-none" {...rightBp}>►</Button>
          <div />
          <Button iconOnly variant="outline" className="size-10 rounded-md border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white select-none" {...downBp}>▼</Button>
          <div />
        </div>
      }
      actions={
        <Button onClick={newGame} size="sm" variant="outline" className="border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs rounded-md">
          New Game
        </Button>
      }
      hint="WASD or arrows · Eat all dots · o = ghost-eater"
    >
      <canvas ref={canvasRef} width={W} height={H} className="rounded-lg border border-zinc-800" />
    </GameShell>
  );
}
