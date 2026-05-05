import { useState, useEffect, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const COLS = 20;
const ROWS = 20;
const CELL = 24;
const TICK = 130;

const DIR = { UP: [0,-1], DOWN: [0,1], LEFT: [-1,0], RIGHT: [1,0] };
const OPPOSITE = { UP:"DOWN", DOWN:"UP", LEFT:"RIGHT", RIGHT:"LEFT" };

const rand = () => ({ x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS) });

const initState = () => ({
  snake: [{ x:10, y:10 }, { x:9, y:10 }, { x:8, y:10 }],
  dir: "RIGHT",
  nextDir: "RIGHT",
  food: { x:15, y:10 },
  score: 0,
  best: 0,
  status: "IDLE", // IDLE | RUNNING | PAUSED | DEAD
});

export default function SnakeGame() {
  const [state, setState] = useState(initState());
  const stateRef = useRef(state);
  stateRef.current = state;

  const spawnFood = useCallback((snake) => {
    let pos;
    do { pos = rand(); }
    while (snake.some(s => s.x === pos.x && s.y === pos.y));
    return pos;
  }, []);

  const tick = useCallback(() => {
    setState(prev => {
      if (prev.status !== "RUNNING") return prev;
      const d = DIR[prev.nextDir];
      const head = { x: prev.snake[0].x + d[0], y: prev.snake[0].y + d[1] };
      const hitWall = head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS;
      const hitSelf = prev.snake.some(s => s.x === head.x && s.y === head.y);
      if (hitWall || hitSelf) {
        return { ...prev, status:"DEAD", best: Math.max(prev.best, prev.score) };
      }
      const ate = head.x === prev.food.x && head.y === prev.food.y;
      const newSnake = [head, ...prev.snake];
      if (!ate) newSnake.pop();
      const newScore = ate ? prev.score + 10 : prev.score;
      const newFood = ate ? spawnFood(newSnake) : prev.food;
      return { ...prev, snake: newSnake, dir: prev.nextDir, food: newFood, score: newScore };
    });
  }, [spawnFood]);

  useEffect(() => {
    if (state.status !== "RUNNING") return;
    const id = setInterval(tick, TICK);
    return () => clearInterval(id);
  }, [state.status, tick]);

  useEffect(() => {
    const onKey = (e) => {
      const map = { ArrowUp:"UP", ArrowDown:"DOWN", ArrowLeft:"LEFT", ArrowRight:"RIGHT",
                    w:"UP", s:"DOWN", a:"LEFT", d:"RIGHT" };
      const newDir = map[e.key];
      if (!newDir) {
        if (e.key === " ") {
          setState(p => p.status === "RUNNING" ? {...p, status:"PAUSED"}
                      : p.status === "PAUSED"  ? {...p, status:"RUNNING"}
                      : p);
        }
        return;
      }
      e.preventDefault();
      setState(prev => {
        if (prev.status === "IDLE") return { ...prev, status:"RUNNING", nextDir: newDir };
        if (prev.status !== "RUNNING") return prev;
        if (OPPOSITE[newDir] === prev.dir) return prev;
        return { ...prev, nextDir: newDir };
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const start = () => setState(p => ({ ...initState(), best: p.best, status:"RUNNING" }));
  const steer = (dir) => setState(prev => {
    if (prev.status === "IDLE") return { ...prev, status:"RUNNING", nextDir: dir };
    if (prev.status !== "RUNNING") return prev;
    if (OPPOSITE[dir] === prev.dir) return prev;
    return { ...prev, nextDir: dir };
  });

  const { snake, food, score, best, status } = state;

  const cellStyle = (x, y) => {
    const isHead = snake[0].x === x && snake[0].y === y;
    const bodyIdx = snake.findIndex((s,i) => i > 0 && s.x === x && s.y === y);
    const isFood = food.x === x && food.y === y;
    if (isHead) return "bg-emerald-400 rounded-sm shadow-[0_0_6px_rgba(52,211,153,0.8)]";
    if (bodyIdx > 0) {
      const t = bodyIdx / snake.length;
      return t < 0.4 ? "bg-emerald-500 rounded-sm" : "bg-emerald-700 rounded-sm";
    }
    if (isFood) return "bg-red-400 rounded-full shadow-[0_0_6px_rgba(248,113,113,0.8)] animate-pulse";
    return "";
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="bg-zinc-900 border-zinc-700 shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-xl tracking-widest font-mono uppercase">
              🐍 Snake
            </CardTitle>
            <div className="flex gap-3">
              <div className="text-center">
                <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider">Score</p>
                <Badge variant="outline" className="border-emerald-600 text-emerald-400 font-mono text-sm min-w-[56px] justify-center">
                  {score}
                </Badge>
              </div>
              <Separator orientation="vertical" className="h-10 bg-zinc-700" />
              <div className="text-center">
                <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider">Best</p>
                <Badge variant="outline" className="border-amber-600 text-amber-400 font-mono text-sm min-w-[56px] justify-center">
                  {best}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-4">
          {/* Board */}
          <div
            className="relative bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden"
            style={{ width: COLS*CELL, height: ROWS*CELL }}
          >
            {/* Grid lines */}
            <svg className="absolute inset-0 opacity-10" width={COLS*CELL} height={ROWS*CELL}>
              {Array.from({length:COLS+1},(_,i)=>(
                <line key={`v${i}`} x1={i*CELL} y1={0} x2={i*CELL} y2={ROWS*CELL} stroke="#6b7280" strokeWidth="0.5"/>
              ))}
              {Array.from({length:ROWS+1},(_,i)=>(
                <line key={`h${i}`} x1={0} y1={i*CELL} x2={COLS*CELL} y2={i*CELL} stroke="#6b7280" strokeWidth="0.5"/>
              ))}
            </svg>

            {/* Cells — only render snake + food */}
            {snake.map((s,i) => (
              <div key={`s${i}`}
                className={`absolute transition-none ${cellStyle(s.x, s.y)}`}
                style={{ left:s.x*CELL+1, top:s.y*CELL+1, width:CELL-2, height:CELL-2 }}
              />
            ))}
            <div
              className={`absolute ${cellStyle(food.x, food.y)}`}
              style={{ left:food.x*CELL+2, top:food.y*CELL+2, width:CELL-4, height:CELL-4 }}
            />

            {/* Overlays */}
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

          {/* D-pad */}
          <div className="grid grid-rows-3 grid-cols-3 gap-1 w-28">
            <div />
            <Button size="icon" variant="outline" className="h-9 w-9 border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white" onClick={() => steer("UP")}>▲</Button>
            <div />
            <Button size="icon" variant="outline" className="h-9 w-9 border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white" onClick={() => steer("LEFT")}>◄</Button>
            <Button size="icon" variant="outline" className="h-9 w-9 border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-zinc-500 cursor-default" disabled>●</Button>
            <Button size="icon" variant="outline" className="h-9 w-9 border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white" onClick={() => steer("RIGHT")}>►</Button>
            <div />
            <Button size="icon" variant="outline" className="h-9 w-9 border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white" onClick={() => steer("DOWN")}>▼</Button>
            <div />
          </div>

          {/* Controls row */}
          <div className="flex gap-2">
            <Button onClick={start} size="sm" variant="outline" className="border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs">
              New Game
            </Button>
            <Button
              onClick={() => setState(p => p.status === "RUNNING" ? {...p, status:"PAUSED"} : p.status === "PAUSED" ? {...p, status:"RUNNING"} : p)}
              size="sm" variant="outline"
              className="border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs"
              disabled={status !== "RUNNING" && status !== "PAUSED"}
            >
              {status === "PAUSED" ? "Resume" : "Pause"}
            </Button>
          </div>

          <p className="text-zinc-600 text-xs font-mono">WASD or arrow keys · Space to pause</p>
        </CardContent>
      </Card>
    </div>
  );
}