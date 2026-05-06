import { useState, useEffect, useRef } from "react";
import { Button } from "@brightlocal/ui-components/button";
import GameShell from "../components/GameShell";
import { useButtonPress } from "../hooks/useButtonPress";
import { isBossActive } from "../lib/bossMode";

const rnd = (a, b) => a + Math.random() * (b - a);

const INV_COLS = 11, INV_ROWS = 5;
const INV_W = 32, INV_H = 24, INV_PAD_X = 10, INV_PAD_Y = 10;

const SHIELD_CELLS = [
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1],
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1],
];

const INV_SPRITES = [
  [[0,0,0,1,1,0,0,0],[0,0,1,1,1,1,0,0],[0,1,1,1,1,1,1,0],[1,1,0,1,1,0,1,1],[1,1,1,1,1,1,1,1],[0,0,1,0,0,1,0,0],[0,1,0,1,1,0,1,0],[0,0,1,0,0,1,0,0]],
  [[0,0,0,1,1,0,0,0],[0,0,1,1,1,1,0,0],[0,1,1,1,1,1,1,0],[1,1,0,1,1,0,1,1],[1,1,1,1,1,1,1,1],[0,1,0,1,1,0,1,0],[1,0,1,0,0,1,0,1],[0,1,0,0,0,0,1,0]],
  [[0,0,1,0,0,0,0,1,0,0],[0,0,0,1,0,0,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,1,1,0,1,1,0,1,1,0],[1,1,1,1,1,1,1,1,1,1],[1,0,1,1,1,1,1,1,0,1],[1,0,1,0,0,0,0,1,0,1],[0,0,0,1,1,1,1,0,0,0]],
  [[0,0,1,0,0,0,0,1,0,0],[1,0,0,1,0,0,1,0,0,1],[1,0,1,1,1,1,1,1,0,1],[1,1,1,0,1,1,0,1,1,1],[1,1,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,1,0],[0,0,1,0,0,0,0,1,0,0],[0,1,0,0,0,0,0,0,1,0]],
  [[0,0,0,0,1,1,0,0,0,0,0],[0,0,0,1,1,1,1,0,0,0,0],[0,0,1,1,1,1,1,1,0,0,0],[0,1,1,0,1,1,0,1,1,0,0],[1,1,1,1,1,1,1,1,1,1,0],[1,0,1,1,1,1,1,1,0,1,0],[1,0,1,0,0,0,0,1,0,1,0],[0,0,0,1,1,0,1,1,0,0,0]],
  [[0,0,0,0,1,1,0,0,0,0,0],[0,0,0,1,1,1,1,0,0,0,0],[0,0,1,1,1,1,1,1,0,0,0],[0,1,1,0,1,1,0,1,1,0,0],[1,1,1,1,1,1,1,1,1,1,0],[0,1,0,1,1,1,1,0,1,0,0],[1,0,0,1,0,0,1,0,0,1,0],[0,1,0,0,0,0,0,0,1,0,0]],
];
const INV_COLORS = ["#e879f9", "#e879f9", "#38bdf8", "#38bdf8", "#4ade80", "#4ade80", "#4ade80"];
const INV_PTS = [30, 30, 20, 20, 10, 10, 10];

function makeShields(sw, sh) {
  const shields = [];
  const count = 4;
  const gap = sw / (count + 1);
  for (let s = 0; s < count; s++) {
    const sx = Math.round(gap * (s + 1) - SHIELD_CELLS[0].length * 3);
    const sy = sh - 110;
    shields.push({ x: sx, y: sy, cells: SHIELD_CELLS.map((r) => [...r]) });
  }
  return shields;
}

function makeInvaders() {
  const invaders = [];
  for (let r = 0; r < INV_ROWS; r++)
    for (let c = 0; c < INV_COLS; c++)
      invaders.push({ col: c, row: r, alive: true, frame: 0 });
  return invaders;
}

/**
 * Reusable Space Invaders game component.
 *
 * @param {Object}   props
 * @param {number}   [props.width=480]
 * @param {number}   [props.height=520]
 * @param {Function} [props.onBack]
 * @param {boolean}  [props.fullPage=true]
 */
export default function SpaceInvadersGame({ width = 480, height = 520, onBack, fullPage = true }) {
  const W = width, H = height;
  const canvasRef = useRef(null);
  const keysRef = useRef({});
  const gameRef = useRef(null);
  const rafRef = useRef(null);
  const starsRef = useRef(
    Array.from({ length: 80 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.2 + 0.2, twinkle: Math.random() * Math.PI * 2 })),
  );
  const [ui, setUi] = useState({ score: 0, best: 0, lives: 3, wave: 1, status: "IDLE" });

  const markRunning = () => setUi((u) => ({ ...u, status: "RUNNING" }));

  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas.getContext("2d");
    const gs = {
      player: { x: W / 2, y: H - 40, w: 36, h: 18 },
      invaders: makeInvaders(), shields: makeShields(W, H),
      bullets: [], enemyBullets: [],
      ufo: null, ufoTimer: 0,
      score: 0, best: 0, lives: 3, wave: 1, status: "IDLE",
      invDir: 1, invX: 0, invY: 0, invDrop: false,
      marchTimer: 0, marchInterval: 60, marchFrame: 0,
      shootTimer: 0, playerShotCool: 0, tick: 0,
    };
    gameRef.current = gs;

    let lastUiKey = "";
    const emitUi = () => {
      const k = `${gs.score},${gs.lives},${gs.wave},${gs.status}`;
      if (k !== lastUiKey) { lastUiKey = k; setUi({ score: gs.score, best: gs.best, lives: gs.lives, wave: gs.wave, status: gs.status }); }
    };

    const resetWave = (wave) => {
      gs.invaders = makeInvaders(); gs.invX = 0; gs.invY = 0; gs.invDir = 1; gs.invDrop = false;
      gs.bullets = []; gs.enemyBullets = []; gs.ufo = null; gs.ufoTimer = rnd(400, 700);
      gs.marchInterval = Math.max(8, 60 - wave * 5); gs.wave = wave;
    };

    const playerShoot = () => {
      if (gs.playerShotCool > 0) return;
      if (gs.bullets.filter((b) => b.owner === "player").length >= 2) return;
      gs.bullets.push({ x: gs.player.x, y: gs.player.y - gs.player.h / 2, vy: -8, owner: "player", life: 120 });
      gs.playerShotCool = 18;
    };

    const shieldHit = (bx, by, bw, bh) => {
      for (const sh of gs.shields) {
        const cellW = 6, cellH = 6;
        for (let r = 0; r < sh.cells.length; r++) {
          for (let c = 0; c < sh.cells[r].length; c++) {
            if (!sh.cells[r][c]) continue;
            const cx = sh.x + c * cellW, cy = sh.y + r * cellH;
            if (bx < cx + cellW && bx + bw > cx && by < cy + cellH && by + bh > cy) { sh.cells[r][c] = 0; return true; }
          }
        }
      }
      return false;
    };

    const update = () => {
      if (gs.status !== "RUNNING" || isBossActive()) return;
      gs.tick++;
      const k = keysRef.current, pl = gs.player;
      const spd = 3.5;
      if ((k["ArrowLeft"] || k["a"]) && pl.x - pl.w / 2 > 0) pl.x -= spd;
      if ((k["ArrowRight"] || k["d"]) && pl.x + pl.w / 2 < W) pl.x += spd;
      if (k[" "] || k["ArrowUp"]) playerShoot();
      if (gs.playerShotCool > 0) gs.playerShotCool--;

      gs.marchTimer++;
      const alive = gs.invaders.filter((i) => i.alive);
      const dynInterval = Math.max(4, gs.marchInterval - Math.floor((INV_COLS * INV_ROWS - alive.length) * 0.4));
      if (gs.marchTimer >= dynInterval) {
        gs.marchTimer = 0; gs.marchFrame ^= 1;
        gs.invaders.forEach((i) => { if (i.alive) i.frame = gs.marchFrame; });
        if (gs.invDrop) { gs.invY += 12; gs.invDrop = false; }
        else {
          gs.invX += 14 * gs.invDir;
          let minC = INV_COLS, maxC = -1;
          alive.forEach((i) => { if (i.col < minC) minC = i.col; if (i.col > maxC) maxC = i.col; });
          const leftEdge = gs.invX + minC * (INV_W + INV_PAD_X);
          const rightEdge = gs.invX + (maxC + 1) * (INV_W + INV_PAD_X) - INV_PAD_X;
          if (leftEdge <= 0 || rightEdge >= W) { gs.invDir *= -1; gs.invDrop = true; }
        }
      }

      gs.shootTimer++;
      const shootInterval = Math.max(20, 70 - gs.wave * 4);
      if (gs.shootTimer >= shootInterval && alive.length > 0) {
        gs.shootTimer = 0;
        const cols = [...new Set(alive.map((i) => i.col))];
        const rc = cols[Math.floor(Math.random() * cols.length)];
        const colInvaders = alive.filter((i) => i.col === rc).sort((a, b) => b.row - a.row);
        if (colInvaders.length) {
          const fi = colInvaders[0];
          const ix = gs.invX + fi.col * (INV_W + INV_PAD_X) + INV_W / 2;
          const iy = gs.invY + fi.row * (INV_H + INV_PAD_Y) + INV_H;
          gs.enemyBullets.push({ x: ix, y: 40 + iy, vy: 3 + gs.wave * 0.3, life: 200 });
        }
      }

      gs.ufoTimer--;
      if (gs.ufoTimer <= 0 && !gs.ufo) { const dir = Math.random() > 0.5 ? 1 : -1; gs.ufo = { x: dir > 0 ? -30 : W + 30, y: 26, vx: dir * 2.2, hp: 1 }; gs.ufoTimer = rnd(500, 900); }
      if (gs.ufo) { gs.ufo.x += gs.ufo.vx; if (gs.ufo.x < -60 || gs.ufo.x > W + 60) gs.ufo = null; }

      gs.bullets.forEach((b) => { b.y += b.vy; b.life--; });
      gs.bullets = gs.bullets.filter((b) => b.life > 0 && b.y > 0 && b.y < H);
      gs.enemyBullets.forEach((b) => { b.y += b.vy; b.life--; });
      gs.enemyBullets = gs.enemyBullets.filter((b) => b.life > 0 && b.y < H);

      gs.bullets = gs.bullets.filter((b) => {
        if (b.owner !== "player") return true;
        if (gs.ufo && Math.abs(b.x - gs.ufo.x) < 22 && Math.abs(b.y - gs.ufo.y) < 12) { gs.score += 100; gs.ufo = null; return false; }
        for (let i = gs.invaders.length - 1; i >= 0; i--) {
          const inv = gs.invaders[i]; if (!inv.alive) continue;
          const ix = gs.invX + inv.col * (INV_W + INV_PAD_X), iy = 40 + gs.invY + inv.row * (INV_H + INV_PAD_Y);
          if (b.x >= ix && b.x <= ix + INV_W && b.y >= iy && b.y <= iy + INV_H) { inv.alive = false; gs.score += INV_PTS[inv.row]; return false; }
        }
        if (shieldHit(b.x - 2, b.y - 4, 4, 8)) return false;
        return true;
      });

      gs.enemyBullets = gs.enemyBullets.filter((b) => {
        if (shieldHit(b.x - 2, b.y - 4, 4, 8)) return false;
        if (Math.abs(b.x - pl.x) < pl.w / 2 + 2 && Math.abs(b.y - pl.y) < pl.h / 2 + 4) {
          gs.lives--; if (gs.lives <= 0) { gs.status = "GAMEOVER"; gs.best = Math.max(gs.best, gs.score); }
          return false;
        }
        return true;
      });

      const bottom = alive.some((i) => { const iy = 40 + gs.invY + i.row * (INV_H + INV_PAD_Y) + INV_H; return iy >= pl.y - pl.h / 2; });
      if (bottom) { gs.status = "GAMEOVER"; gs.best = Math.max(gs.best, gs.score); }
      if (alive.length === 0) { resetWave(gs.wave + 1); gs.bullets = []; gs.enemyBullets = []; }
      emitUi();
    };

    const drawInvader = (ctx, type, x, y, frame, color) => {
      const si = type * 2 + frame;
      const sprite = INV_SPRITES[si] || INV_SPRITES[0];
      const pw = Math.floor(INV_W / sprite[0].length), ph = Math.floor(INV_H / sprite.length);
      ctx.fillStyle = color;
      sprite.forEach((row, r) => row.forEach((cell, c) => { if (cell) ctx.fillRect(x + c * pw, y + r * ph, pw, ph); }));
    };

    const render = () => {
      ctx.fillStyle = "#09090b"; ctx.fillRect(0, 0, W, H);
      starsRef.current.forEach((s) => { const tw = Math.sin(gs.tick * 0.04 + s.twinkle); ctx.globalAlpha = 0.08 + tw * 0.06; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 0.5, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1;
      for (const sh of gs.shields) { const cellW = 6, cellH = 6; ctx.fillStyle = "#4ade80"; sh.cells.forEach((row, r) => row.forEach((cell, c) => { if (cell) ctx.fillRect(sh.x + c * cellW, sh.y + r * cellH, cellW - 1, cellH - 1); })); }
      gs.invaders.forEach((inv) => { if (!inv.alive) return; const ix = gs.invX + inv.col * (INV_W + INV_PAD_X); const iy = 40 + gs.invY + inv.row * (INV_H + INV_PAD_Y); const type = Math.floor(inv.row / 2); drawInvader(ctx, type, ix, iy, inv.frame, INV_COLORS[inv.row] || "#fff"); });
      if (gs.ufo) {
        ctx.fillStyle = "#f43f5e"; const ux = gs.ufo.x, uy = gs.ufo.y;
        ctx.beginPath(); ctx.ellipse(ux, uy, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(ux, uy - 5, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fda4af"; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(ux + i * 8, uy, 2, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = "#fda4af"; ctx.font = "9px monospace"; ctx.textAlign = "center"; ctx.fillText("100", ux, uy - 16);
      }
      ctx.shadowColor = "#a5f3fc"; ctx.shadowBlur = 6;
      gs.bullets.forEach((b) => { ctx.fillStyle = "#e0f2fe"; ctx.fillRect(b.x - 2, b.y - 6, 4, 12); });
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fca5a5";
      gs.enemyBullets.forEach((b) => { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(gs.tick * 0.15); ctx.fillRect(-2, -5, 4, 10); ctx.restore(); });
      const pl = gs.player;
      ctx.shadowColor = "#34d399"; ctx.shadowBlur = 8; ctx.fillStyle = "#34d399";
      ctx.fillRect(pl.x - pl.w / 2, pl.y - pl.h / 2 + 4, pl.w, pl.h - 4);
      ctx.fillRect(pl.x - 3, pl.y - pl.h / 2 - 4, 6, 10);
      ctx.beginPath(); ctx.moveTo(pl.x - pl.w / 2, pl.y + pl.h / 2); ctx.lineTo(pl.x - pl.w / 2 - 6, pl.y + pl.h / 2); ctx.lineTo(pl.x - pl.w / 3, pl.y); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(pl.x + pl.w / 2, pl.y + pl.h / 2); ctx.lineTo(pl.x + pl.w / 2 + 6, pl.y + pl.h / 2); ctx.lineTo(pl.x + pl.w / 3, pl.y); ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#27272a"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, H - 20); ctx.lineTo(W, H - 20); ctx.stroke();
      for (let i = 0; i < gs.lives; i++) { ctx.fillStyle = "#34d399"; ctx.fillRect(10 + i * 20, H - 14, 12, 8); ctx.fillRect(14 + i * 20, H - 18, 4, 6); }
      ctx.fillStyle = "#3f3f46"; ctx.font = "11px monospace"; ctx.textAlign = "right"; ctx.fillText(`WAVE ${gs.wave}`, W - 12, H - 8);
      if (gs.status === "IDLE") {
        ctx.fillStyle = "rgba(9,9,11,0.72)"; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = "center"; ctx.fillStyle = "#f9fafb"; ctx.font = "bold 24px monospace"; ctx.fillText("SPACE INVADERS", W / 2, H / 2 - 20);
        ctx.fillStyle = "#a1a1aa"; ctx.font = "13px monospace"; ctx.fillText("Press any key or use controls below", W / 2, H / 2 + 12);
      } else if (gs.status === "GAMEOVER") {
        ctx.fillStyle = "rgba(9,9,11,0.78)"; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = "center"; ctx.fillStyle = "#f87171"; ctx.font = "bold 28px monospace"; ctx.fillText("GAME OVER", W / 2, H / 2 - 28);
        ctx.fillStyle = "#e4e4e7"; ctx.font = "15px monospace"; ctx.fillText(`Score: ${gs.score}`, W / 2, H / 2 + 8);
        ctx.fillStyle = "#71717a"; ctx.font = "12px monospace"; ctx.fillText('Click "New Game" to play again', W / 2, H / 2 + 34);
      }
    };

    const loop = () => { update(); render(); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [W, H]);

  useEffect(() => {
    const down = (e) => {
      keysRef.current[e.key] = true;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", " "].includes(e.key)) e.preventDefault();
      if (gameRef.current?.status === "IDLE") { gameRef.current.status = "RUNNING"; markRunning(); }
    };
    const up = (e) => { keysRef.current[e.key] = false; };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  const newGame = () => {
    const g = gameRef.current; if (!g) return;
    const best = Math.max(g.best, g.score);
    Object.assign(g, {
      player: { x: W / 2, y: H - 40, w: 36, h: 18 },
      invaders: makeInvaders(), shields: makeShields(W, H),
      bullets: [], enemyBullets: [], ufo: null, ufoTimer: rnd(400, 700),
      score: 0, best, lives: 3, wave: 1, status: "RUNNING",
      invDir: 1, invX: 0, invY: 0, invDrop: false,
      marchTimer: 0, marchInterval: 60, marchFrame: 0,
      shootTimer: 0, playerShotCool: 0, tick: 0,
    });
    setUi({ score: 0, best, lives: 3, wave: 1, status: "RUNNING" });
  };

  const bpOpts = { gameRef, onStart: markRunning };
  const leftBp = useButtonPress("ArrowLeft", keysRef, bpOpts);
  const rightBp = useButtonPress("ArrowRight", keysRef, bpOpts);
  const fireBp = useButtonPress(" ", keysRef, bpOpts);

  return (
    <GameShell
      title="👾 Space Invaders"
      onBack={onBack}
      fullPage={fullPage}
      stats={[
        { label: "Wave", value: ui.wave, borderColor: "border-fuchsia-600", textColor: "text-fuchsia-400" },
        { label: "Score", value: ui.score, borderColor: "border-emerald-600", textColor: "text-emerald-400" },
        { label: "Best", value: ui.best, borderColor: "border-amber-600", textColor: "text-amber-400" },
      ]}
      controls={
        <div className="flex items-center gap-4">
          <Button iconOnly variant="outline" className="size-11 rounded-md border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white select-none text-lg" {...leftBp}>◄</Button>
          <Button className="h-14 w-20 rounded-full bg-red-900 hover:bg-red-800 border-2 border-red-700 text-white font-mono text-sm font-bold select-none" variant="outline" {...fireBp}>FIRE</Button>
          <Button iconOnly variant="outline" className="size-11 rounded-md border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white select-none text-lg" {...rightBp}>►</Button>
        </div>
      }
      actions={
        <Button onClick={newGame} size="sm" variant="outline" className="border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs">
          New Game
        </Button>
      }
      hint="← → Move · Space to fire · UFO = 100pts"
    >
      <canvas ref={canvasRef} width={W} height={H} className="rounded-lg border border-zinc-800" />
    </GameShell>
  );
}
