import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@brightlocal/ui-components/button";
import GameShell from "../components/GameShell";

const COLS = 10;
const ROWS = 20;

const SHAPES = {
  I: { color: "#22d3ee", rot: [
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
  ] },
  O: { color: "#facc15", rot: [
    [[1, 1], [1, 1]],
  ] },
  T: { color: "#c084fc", rot: [
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
    [[0, 1, 0], [1, 1, 0], [0, 1, 0]],
  ] },
  S: { color: "#34d399", rot: [
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
  ] },
  Z: { color: "#f87171", rot: [
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
  ] },
  J: { color: "#60a5fa", rot: [
    [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
    [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
  ] },
  L: { color: "#fb923c", rot: [
    [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
    [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
    [[1, 1, 0], [0, 1, 0], [0, 1, 0]],
  ] },
};
const TYPES = Object.keys(SHAPES);
const LINE_SCORES = [0, 100, 300, 500, 800];

const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));
const randType = () => TYPES[Math.floor(Math.random() * TYPES.length)];
const shapeAt = (type, rot) => SHAPES[type].rot[rot % SHAPES[type].rot.length];
const newPiece = (type) => ({ type, x: type === "O" ? 4 : 3, y: type === "I" ? -1 : 0, rot: 0 });

function collides(board, piece, dx = 0, dy = 0, drot = 0) {
  const rotations = SHAPES[piece.type].rot;
  const shape = rotations[(piece.rot + drot + rotations.length) % rotations.length];
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (!shape[y][x]) continue;
      const nx = piece.x + x + dx;
      const ny = piece.y + y + dy;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny < 0) continue;
      if (board[ny][nx]) return true;
    }
  }
  return false;
}

function lockPiece(board, piece) {
  const next = board.map((row) => [...row]);
  const shape = shapeAt(piece.type, piece.rot);
  const color = SHAPES[piece.type].color;
  for (let y = 0; y < shape.length; y++)
    for (let x = 0; x < shape[y].length; x++)
      if (shape[y][x]) {
        const ny = piece.y + y, nx = piece.x + x;
        if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) next[ny][nx] = color;
      }
  return next;
}

function clearLines(board) {
  const kept = board.filter((row) => row.some((c) => !c));
  const cleared = ROWS - kept.length;
  while (kept.length < ROWS) kept.unshift(Array(COLS).fill(null));
  return { board: kept, cleared };
}

const initState = () => ({
  board: emptyBoard(),
  piece: newPiece(randType()),
  next: randType(),
  score: 0,
  lines: 0,
  level: 1,
  best: 0,
  status: "IDLE",
});

/**
 * Tetris — 10×20 board, 7 standard pieces, line clears, level-based gravity.
 *
 * @param {Object}   props
 * @param {Function} [props.onBack]
 * @param {boolean}  [props.fullPage=true]
 */
export default function TetrisGame({ onBack, fullPage = true }) {
  const [g, setG] = useState(initState);
  const gRef = useRef(g);
  gRef.current = g;

  const start = () => setG((p) => ({ ...initState(), best: p.best, status: "RUNNING" }));

  const move = useCallback((dx, dy) => {
    setG((p) => {
      if (p.status !== "RUNNING") return p;
      if (!collides(p.board, p.piece, dx, dy)) {
        return { ...p, piece: { ...p.piece, x: p.piece.x + dx, y: p.piece.y + dy }, score: dy > 0 ? p.score + 1 : p.score };
      }
      return p;
    });
  }, []);

  const rotate = useCallback(() => {
    setG((p) => {
      if (p.status !== "RUNNING") return p;
      const rotations = SHAPES[p.piece.type].rot;
      if (rotations.length === 1) return p;
      const kicks = [0, -1, 1, -2, 2];
      for (const dx of kicks) {
        if (!collides(p.board, p.piece, dx, 0, 1)) {
          return {
            ...p,
            piece: {
              ...p.piece,
              x: p.piece.x + dx,
              rot: (p.piece.rot + 1) % rotations.length,
            },
          };
        }
      }
      return p;
    });
  }, []);

  const settlePiece = (p) => {
    const locked = lockPiece(p.board, p.piece);
    const { board, cleared } = clearLines(locked);
    const score = p.score + LINE_SCORES[cleared] * p.level;
    const lines = p.lines + cleared;
    const level = Math.floor(lines / 10) + 1;
    const piece = newPiece(p.next);
    if (collides(board, piece)) {
      return { ...p, board, score, lines, level, status: "GAMEOVER", best: Math.max(p.best, score) };
    }
    return { ...p, board, piece, next: randType(), score, lines, level };
  };

  const tickDrop = useCallback(() => {
    setG((p) => {
      if (p.status !== "RUNNING") return p;
      if (!collides(p.board, p.piece, 0, 1)) {
        return { ...p, piece: { ...p.piece, y: p.piece.y + 1 } };
      }
      return settlePiece(p);
    });
  }, []);

  const hardDrop = useCallback(() => {
    setG((p) => {
      if (p.status !== "RUNNING") return p;
      let dy = 0;
      while (!collides(p.board, p.piece, 0, dy + 1)) dy++;
      const dropped = { ...p, piece: { ...p.piece, y: p.piece.y + dy }, score: p.score + dy * 2 };
      return settlePiece(dropped);
    });
  }, []);

  const togglePause = () =>
    setG((p) =>
      p.status === "RUNNING" ? { ...p, status: "PAUSED" } : p.status === "PAUSED" ? { ...p, status: "RUNNING" } : p,
    );

  // gravity tick
  useEffect(() => {
    if (g.status !== "RUNNING") return;
    const ms = Math.max(90, 850 - (g.level - 1) * 75);
    const id = setInterval(tickDrop, ms);
    return () => clearInterval(id);
  }, [g.status, g.level, tickDrop]);

  // keyboard
  useEffect(() => {
    const onKey = (e) => {
      const status = gRef.current.status;
      if (status === "IDLE" && (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === " ")) {
        setG((p) => ({ ...p, status: "RUNNING" }));
      }
      switch (e.key) {
        case "ArrowLeft": e.preventDefault(); move(-1, 0); break;
        case "ArrowRight": e.preventDefault(); move(1, 0); break;
        case "ArrowDown": e.preventDefault(); move(0, 1); break;
        case "ArrowUp": e.preventDefault(); rotate(); break;
        case " ": e.preventDefault(); hardDrop(); break;
        case "p": case "P": togglePause(); break;
        default: break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, rotate, hardDrop]);

  // overlay piece on board for render
  const cells = g.board.map((row) => [...row]);
  if (g.status !== "GAMEOVER") {
    const shape = shapeAt(g.piece.type, g.piece.rot);
    const color = SHAPES[g.piece.type].color;
    for (let y = 0; y < shape.length; y++)
      for (let x = 0; x < shape[y].length; x++) {
        if (!shape[y][x]) continue;
        const ny = g.piece.y + y, nx = g.piece.x + x;
        if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) cells[ny][nx] = color;
      }
  }

  // next piece preview
  const nextShape = shapeAt(g.next, 0);
  const nextColor = SHAPES[g.next].color;

  return (
    <GameShell
      title="🧱 Tetris"
      onBack={onBack}
      fullPage={fullPage}
      stats={[
        { label: "Score", value: g.score, borderColor: "border-violet-600", textColor: "text-violet-400" },
        { label: "Lines", value: g.lines, borderColor: "border-sky-600", textColor: "text-sky-400" },
        { label: "Lvl", value: g.level, borderColor: "border-emerald-600", textColor: "text-emerald-400" },
        { label: "Best", value: g.best, borderColor: "border-amber-600", textColor: "text-amber-400" },
      ]}
      controls={
        <div className="flex items-center gap-4">
          <div className="grid grid-cols-3 gap-1">
            <div />
            <Button iconOnly variant="outline" className="size-9 rounded-md border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white" onClick={rotate}>↻</Button>
            <div />
            <Button iconOnly variant="outline" className="size-9 rounded-md border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white" onClick={() => move(-1, 0)}>◄</Button>
            <Button iconOnly variant="outline" className="size-9 rounded-md border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white" onClick={() => move(0, 1)}>▼</Button>
            <Button iconOnly variant="outline" className="size-9 rounded-md border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white" onClick={() => move(1, 0)}>►</Button>
          </div>
          <Button onClick={hardDrop} className="h-14 w-16 rounded-full bg-violet-900 hover:bg-violet-800 border-2 border-violet-700 text-white font-mono text-xs font-bold" variant="outline">
            DROP
          </Button>
        </div>
      }
      actions={
        <>
          <Button onClick={start} size="sm" variant="outline" className="border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs rounded-md">
            New Game
          </Button>
          <Button onClick={togglePause} size="sm" variant="outline" disabled={g.status !== "RUNNING" && g.status !== "PAUSED"} className="border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs rounded-md">
            {g.status === "PAUSED" ? "Resume" : "Pause"}
          </Button>
        </>
      }
      hint="← → Move · ↑ Rotate · ↓ Soft drop · Space Hard drop · P Pause"
    >
      <div className="flex items-start gap-4">
        <div className="relative bg-zinc-950 border border-zinc-800 rounded-lg p-1">
          <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${COLS}, 1.25rem)`, gridTemplateRows: `repeat(${ROWS}, 1.25rem)` }}>
            {cells.flatMap((row, y) =>
              row.map((c, x) => (
                <div
                  key={`${x},${y}`}
                  className="size-5 rounded-[2px]"
                  style={{
                    backgroundColor: c || "#18181b",
                    boxShadow: c ? "inset 0 0 0 1px rgba(255,255,255,0.1)" : undefined,
                  }}
                />
              )),
            )}
          </div>
          {g.status === "IDLE" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm rounded-lg gap-2">
              <p className="text-violet-400 font-mono text-xl font-bold">TETRIS</p>
              <p className="text-zinc-400 font-mono text-xs text-center px-2">Press a key or<br/>tap a button</p>
            </div>
          )}
          {g.status === "PAUSED" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/70 backdrop-blur-sm rounded-lg">
              <p className="text-white font-mono text-2xl">PAUSED</p>
              <p className="text-zinc-400 font-mono text-xs mt-1">P to resume</p>
            </div>
          )}
          {g.status === "GAMEOVER" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/85 backdrop-blur-sm rounded-lg gap-2">
              <p className="text-rose-400 font-mono text-2xl font-bold">GAME OVER</p>
              <p className="text-zinc-300 font-mono text-sm">Score: {g.score}</p>
              <Button onClick={start} size="sm" className="bg-violet-700 hover:bg-violet-600 text-white font-mono mt-1 rounded-md">
                Play Again
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 items-center">
          <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider">Next</p>
          <div className="bg-zinc-950 border border-zinc-800 rounded-md p-2">
            <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${nextShape[0].length}, 1rem)` }}>
              {nextShape.flatMap((row, y) =>
                row.map((c, x) => (
                  <div
                    key={`n${x},${y}`}
                    className="size-4 rounded-[2px]"
                    style={{
                      backgroundColor: c ? nextColor : "transparent",
                      boxShadow: c ? "inset 0 0 0 1px rgba(255,255,255,0.1)" : undefined,
                    }}
                  />
                )),
              )}
            </div>
          </div>
        </div>
      </div>
    </GameShell>
  );
}
