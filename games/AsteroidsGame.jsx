import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import GameShell from "../components/GameShell";
import { useButtonPress } from "../hooks/useButtonPress";

const rnd = (a, b) => a + Math.random() * (b - a);

const makeAsteroid = (x, y, size) => {
  const spd = 0.5 + (3 - size) * 0.55 + Math.random() * 0.5;
  const ang = Math.random() * Math.PI * 2;
  const n = 8 + Math.floor(Math.random() * 5);
  const r = size * 22;
  return {
    x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, size,
    verts: Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const ri = r * (0.6 + Math.random() * 0.75);
      return [Math.cos(a) * ri, Math.sin(a) * ri];
    }),
    angle: 0, rotSpeed: (Math.random() - 0.5) * 0.03, radius: r * 0.88,
  };
};

const spawnWave = (level, w, h) => {
  const count = 3 + level;
  return Array.from({ length: count }, () => {
    let x, y;
    do { x = Math.random() * w; y = Math.random() * h; }
    while (Math.hypot(x - w / 2, y - h / 2) < 110);
    return makeAsteroid(x, y, 3);
  });
};

/**
 * Reusable Asteroids game component.
 *
 * @param {Object}   props
 * @param {number}   [props.width=480]
 * @param {number}   [props.height=480]
 * @param {Function} [props.onBack]
 * @param {boolean}  [props.fullPage=true]
 */
export default function AsteroidsGame({ width = 480, height = 480, onBack, fullPage = true }) {
  const W = width, H = height;
  const canvasRef = useRef(null);
  const keysRef = useRef({});
  const gameRef = useRef(null);
  const rafRef = useRef(null);
  const starsRef = useRef(
    Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + 0.2 })),
  );
  const [ui, setUi] = useState({ score: 0, best: 0, lives: 3, level: 1, status: "IDLE" });

  const markRunning = () => setUi((u) => ({ ...u, status: "RUNNING" }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const mkShip = () => ({ x: W / 2, y: H / 2, angle: -Math.PI / 2, vx: 0, vy: 0 });
    const gs = {
      ship: mkShip(), asteroids: spawnWave(1, W, H), bullets: [], particles: [],
      score: 0, best: 0, lives: 3, level: 1, status: "IDLE", invTimer: 0, lastShot: 0,
    };
    gameRef.current = gs;

    const explode = (x, y, n, cr, cg, cb) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, spd = rnd(0.8, 3.5);
        gs.particles.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: rnd(18, 45), cr, cg, cb });
      }
    };

    let lastUiKey = "";
    const emitUi = () => {
      const key = `${gs.score},${gs.lives},${gs.level},${gs.status}`;
      if (key !== lastUiKey) { lastUiKey = key; setUi({ score: gs.score, best: gs.best, lives: gs.lives, level: gs.level, status: gs.status }); }
    };

    const shoot = () => {
      const now = performance.now();
      if (now - gs.lastShot < 220) return;
      gs.lastShot = now;
      gs.bullets.push({
        x: gs.ship.x + Math.cos(gs.ship.angle) * 16,
        y: gs.ship.y + Math.sin(gs.ship.angle) * 16,
        vx: Math.cos(gs.ship.angle) * 9 + gs.ship.vx,
        vy: Math.sin(gs.ship.angle) * 9 + gs.ship.vy,
        life: 58,
      });
    };

    const update = () => {
      if (gs.status !== "RUNNING") return;
      const k = keysRef.current, sh = gs.ship;
      if (k["ArrowLeft"] || k["a"]) sh.angle -= 0.055;
      if (k["ArrowRight"] || k["d"]) sh.angle += 0.055;
      if (k["ArrowUp"] || k["w"]) { sh.vx += Math.cos(sh.angle) * 0.18; sh.vy += Math.sin(sh.angle) * 0.18; }
      const spd = Math.hypot(sh.vx, sh.vy);
      if (spd > 7) { sh.vx = sh.vx / spd * 7; sh.vy = sh.vy / spd * 7; }
      sh.vx *= 0.985; sh.vy *= 0.985;
      sh.x = (sh.x + sh.vx + W) % W; sh.y = (sh.y + sh.vy + H) % H;
      if (k[" "]) shoot();
      if (gs.invTimer > 0) gs.invTimer--;
      gs.bullets.forEach((b) => { b.x = (b.x + b.vx + W) % W; b.y = (b.y + b.vy + H) % H; b.life--; });
      gs.bullets = gs.bullets.filter((b) => b.life > 0);
      gs.asteroids.forEach((a) => { a.x = (a.x + a.vx + W) % W; a.y = (a.y + a.vy + H) % H; a.angle += a.rotSpeed; });
      gs.particles.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vx *= 0.97; p.vy *= 0.97; p.life--; });
      gs.particles = gs.particles.filter((p) => p.life > 0);
      const newA = [];
      gs.bullets = gs.bullets.filter((b) => {
        for (let i = gs.asteroids.length - 1; i >= 0; i--) {
          const a = gs.asteroids[i];
          if (Math.hypot(b.x - a.x, b.y - a.y) < a.radius) {
            explode(a.x, a.y, 6 + a.size * 4, 251, 191, 36);
            gs.score += [0, 100, 50, 20][a.size];
            if (a.size > 1) { newA.push(makeAsteroid(a.x, a.y, a.size - 1)); newA.push(makeAsteroid(a.x, a.y, a.size - 1)); }
            gs.asteroids.splice(i, 1);
            return false;
          }
        }
        return true;
      });
      gs.asteroids.push(...newA);
      if (gs.asteroids.length === 0) { gs.level++; gs.asteroids = spawnWave(gs.level, W, H); gs.ship = mkShip(); gs.invTimer = 150; }
      if (gs.invTimer === 0) {
        for (const a of gs.asteroids) {
          if (Math.hypot(sh.x - a.x, sh.y - a.y) < a.radius + 9) {
            explode(sh.x, sh.y, 20, 52, 211, 153);
            gs.lives--;
            if (gs.lives <= 0) { gs.status = "GAMEOVER"; gs.best = Math.max(gs.best, gs.score); }
            else { gs.ship = mkShip(); gs.invTimer = 180; }
            break;
          }
        }
      }
      emitUi();
    };

    const render = () => {
      const k = keysRef.current;
      ctx.fillStyle = "#09090b"; ctx.fillRect(0, 0, W, H);
      starsRef.current.forEach((s) => { ctx.globalAlpha = 0.1 + s.r * 0.18; ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 0.55, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1;
      gs.asteroids.forEach((a) => { ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.angle); ctx.strokeStyle = "#71717a"; ctx.lineWidth = 1.5; ctx.beginPath(); a.verts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)); ctx.closePath(); ctx.stroke(); ctx.restore(); });
      gs.particles.forEach((p) => { ctx.globalAlpha = Math.max(0, p.life / 40); ctx.fillStyle = `rgb(${Math.round(p.cr)},${Math.round(p.cg)},${Math.round(p.cb)})`; ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1;
      gs.bullets.forEach((b) => { ctx.shadowColor = "#fbbf24"; ctx.shadowBlur = 8; ctx.fillStyle = "#fde68a"; ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill(); });
      ctx.shadowBlur = 0;
      if (gs.status !== "GAMEOVER" && (gs.invTimer === 0 || Math.floor(gs.invTimer / 7) % 2 === 0)) {
        const sh = gs.ship, thrusting = !!(k["ArrowUp"] || k["w"]), margin = 20, offsets = [[0, 0]];
        if (sh.x < margin) offsets.push([W, 0]); if (sh.x > W - margin) offsets.push([-W, 0]);
        if (sh.y < margin) offsets.push([0, H]); if (sh.y > H - margin) offsets.push([0, -H]);
        if (sh.x < margin && sh.y < margin) offsets.push([W, H]); if (sh.x > W - margin && sh.y < margin) offsets.push([-W, H]);
        if (sh.x < margin && sh.y > H - margin) offsets.push([W, -H]); if (sh.x > W - margin && sh.y > H - margin) offsets.push([-W, -H]);
        offsets.forEach(([ox, oy]) => {
          ctx.save(); ctx.translate(sh.x + ox, sh.y + oy); ctx.rotate(sh.angle);
          ctx.shadowColor = "#34d399"; ctx.shadowBlur = 6; ctx.strokeStyle = "#34d399"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-10, 9); ctx.lineTo(-5, 0); ctx.lineTo(-10, -9); ctx.closePath(); ctx.stroke();
          if (thrusting && Math.random() > 0.25) {
            ctx.shadowColor = "#f97316"; ctx.shadowBlur = 10;
            ctx.strokeStyle = `hsl(${rnd(20, 40)},100%,60%)`; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(-5, 4); ctx.lineTo(-14 - rnd(0, 7), 0); ctx.lineTo(-5, -4); ctx.stroke();
          }
          ctx.shadowBlur = 0; ctx.restore();
        });
      }
      for (let i = 0; i < gs.lives; i++) {
        ctx.save(); ctx.translate(15 + i * 22, 15); ctx.rotate(-Math.PI / 2);
        ctx.strokeStyle = "#34d399"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-6, 5); ctx.lineTo(-3, 0); ctx.lineTo(-6, -5); ctx.closePath(); ctx.stroke(); ctx.restore();
      }
      ctx.fillStyle = "#3f3f46"; ctx.font = "11px monospace"; ctx.textAlign = "right"; ctx.fillText(`LEVEL ${gs.level}`, W - 12, H - 12);
      if (gs.status === "IDLE") {
        ctx.fillStyle = "rgba(9,9,11,0.72)"; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = "center"; ctx.fillStyle = "#ffffff"; ctx.font = "bold 26px monospace"; ctx.fillText("ASTEROIDS", W / 2, H / 2 - 18);
        ctx.fillStyle = "#a1a1aa"; ctx.font = "13px monospace"; ctx.fillText("Press any key or use controls below", W / 2, H / 2 + 14);
      } else if (gs.status === "GAMEOVER") {
        ctx.fillStyle = "rgba(9,9,11,0.78)"; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = "center"; ctx.fillStyle = "#f87171"; ctx.font = "bold 30px monospace"; ctx.fillText("GAME OVER", W / 2, H / 2 - 28);
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
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
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
      ship: { x: W / 2, y: H / 2, angle: -Math.PI / 2, vx: 0, vy: 0 },
      asteroids: spawnWave(1, W, H), bullets: [], particles: [],
      score: 0, best, lives: 3, level: 1, status: "RUNNING", invTimer: 0, lastShot: 0,
    });
    setUi({ score: 0, best, lives: 3, level: 1, status: "RUNNING" });
  };

  const bpOpts = { gameRef, onStart: markRunning };
  const thrustBp = useButtonPress("ArrowUp", keysRef, bpOpts);
  const leftBp = useButtonPress("ArrowLeft", keysRef, bpOpts);
  const rightBp = useButtonPress("ArrowRight", keysRef, bpOpts);
  const fireBp = useButtonPress(" ", keysRef, bpOpts);

  return (
    <GameShell
      title="🚀 Asteroids"
      onBack={onBack}
      fullPage={fullPage}
      stats={[
        { label: "Lvl", value: ui.level, borderColor: "border-sky-600", textColor: "text-sky-400" },
        { label: "Score", value: ui.score, borderColor: "border-emerald-600", textColor: "text-emerald-400" },
        { label: "Best", value: ui.best, borderColor: "border-amber-600", textColor: "text-amber-400" },
      ]}
      controls={
        <div className="flex items-center gap-8">
          <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(3,2.5rem)", gridTemplateRows: "repeat(2,2.5rem)" }}>
            <div />
            <Button size="icon" variant="outline" className="h-10 w-10 border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white select-none" {...thrustBp} title="Thrust">▲</Button>
            <div />
            <Button size="icon" variant="outline" className="h-10 w-10 border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white select-none" {...leftBp} title="Rotate Left">↺</Button>
            <div />
            <Button size="icon" variant="outline" className="h-10 w-10 border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white select-none" {...rightBp} title="Rotate Right">↻</Button>
          </div>
          <Button className="h-16 w-16 rounded-full bg-red-900 hover:bg-red-800 border-2 border-red-700 text-white font-mono text-sm font-bold select-none" variant="outline" {...fireBp}>FIRE</Button>
        </div>
      }
      actions={
        <Button onClick={newGame} size="sm" variant="outline" className="border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs">
          New Game
        </Button>
      }
      hint="← → Rotate · ↑ Thrust · Space Fire"
    >
      <canvas ref={canvasRef} width={W} height={H} className="rounded-lg border border-zinc-800" />
    </GameShell>
  );
}
