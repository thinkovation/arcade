import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// ─── SHARED ───────────────────────────────────────────────────────────────────
const rnd = (a, b) => a + Math.random() * (b - a);

// ═══════════════════════════════════════════════════════════════════════════════
// SNAKE
// ═══════════════════════════════════════════════════════════════════════════════
const COLS=20,ROWS=20,CELL=24,TICK=130;
const SDIR={UP:[0,-1],DOWN:[0,1],LEFT:[-1,0],RIGHT:[1,0]};
const OPP={UP:"DOWN",DOWN:"UP",LEFT:"RIGHT",RIGHT:"LEFT"};
const randCell=()=>({x:Math.floor(Math.random()*COLS),y:Math.floor(Math.random()*ROWS)});

function SnakeGame({onBack}){
  const fresh=(best=0)=>({snake:[{x:10,y:10},{x:9,y:10},{x:8,y:10}],dir:"RIGHT",nextDir:"RIGHT",food:{x:15,y:10},score:0,best,status:"IDLE"});
  const [s,setS]=useState(()=>fresh());
  const spawnFood=snake=>{let p;do{p=randCell();}while(snake.some(c=>c.x===p.x&&c.y===p.y));return p;};
  useEffect(()=>{
    if(s.status!=="RUNNING")return;
    const id=setInterval(()=>setS(prev=>{
      if(prev.status!=="RUNNING")return prev;
      const d=SDIR[prev.nextDir],head={x:prev.snake[0].x+d[0],y:prev.snake[0].y+d[1]};
      const dead=head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS||prev.snake.some(c=>c.x===head.x&&c.y===head.y);
      if(dead)return{...prev,status:"DEAD",best:Math.max(prev.best,prev.score)};
      const ate=head.x===prev.food.x&&head.y===prev.food.y;
      const ns=[head,...prev.snake];if(!ate)ns.pop();
      return{...prev,snake:ns,dir:prev.nextDir,score:ate?prev.score+10:prev.score,food:ate?spawnFood(ns):prev.food};
    }),TICK);
    return()=>clearInterval(id);
  },[s.status]);
  useEffect(()=>{
    const h=e=>{
      const m={ArrowUp:"UP",ArrowDown:"DOWN",ArrowLeft:"LEFT",ArrowRight:"RIGHT",w:"UP",s:"DOWN",a:"LEFT",d:"RIGHT"};
      const dir=m[e.key];
      if(dir){e.preventDefault();setS(p=>{if(p.status==="IDLE")return{...p,status:"RUNNING",nextDir:dir};if(p.status!=="RUNNING")return p;if(OPP[dir]===p.dir)return p;return{...p,nextDir:dir};});}
      else if(e.key===" ")setS(p=>p.status==="RUNNING"?{...p,status:"PAUSED"}:p.status==="PAUSED"?{...p,status:"RUNNING"}:p);
    };
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[]);
  const start=()=>setS(p=>fresh(p.best));
  const steer=dir=>setS(p=>{if(p.status==="IDLE")return{...p,status:"RUNNING",nextDir:dir};if(p.status!=="RUNNING")return p;if(OPP[dir]===p.dir)return p;return{...p,nextDir:dir};});
  const cc=(x,y)=>{
    if(s.snake[0].x===x&&s.snake[0].y===y)return"bg-emerald-400 rounded-sm";
    const bi=s.snake.findIndex((c,i)=>i>0&&c.x===x&&c.y===y);
    if(bi>0)return bi/s.snake.length<0.4?"bg-emerald-500 rounded-sm":"bg-emerald-700 rounded-sm";
    if(s.food.x===x&&s.food.y===y)return"bg-red-400 rounded-full animate-pulse";
    return"";
  };
  return(
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="bg-zinc-900 border-zinc-700 shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onBack} className="text-zinc-400 hover:text-white font-mono text-xs px-2">← Back</Button>
              <CardTitle className="text-white text-xl tracking-widest font-mono">🐍 SNAKE</CardTitle>
            </div>
            <div className="flex gap-3">
              <div className="text-center"><p className="text-zinc-500 text-xs font-mono uppercase tracking-wider">Score</p><Badge variant="outline" className="border-emerald-600 text-emerald-400 font-mono text-sm min-w-[56px] justify-center">{s.score}</Badge></div>
              <Separator orientation="vertical" className="h-10 bg-zinc-700"/>
              <div className="text-center"><p className="text-zinc-500 text-xs font-mono uppercase tracking-wider">Best</p><Badge variant="outline" className="border-amber-600 text-amber-400 font-mono text-sm min-w-[56px] justify-center">{s.best}</Badge></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="relative bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden" style={{width:COLS*CELL,height:ROWS*CELL}}>
            <svg className="absolute inset-0 opacity-10" width={COLS*CELL} height={ROWS*CELL}>
              {Array.from({length:COLS+1},(_,i)=><line key={`v${i}`} x1={i*CELL} y1={0} x2={i*CELL} y2={ROWS*CELL} stroke="#6b7280" strokeWidth="0.5"/>)}
              {Array.from({length:ROWS+1},(_,i)=><line key={`h${i}`} x1={0} y1={i*CELL} x2={COLS*CELL} y2={i*CELL} stroke="#6b7280" strokeWidth="0.5"/>)}
            </svg>
            {s.snake.map((c,i)=><div key={`s${i}`} className={`absolute ${cc(c.x,c.y)}`} style={{left:c.x*CELL+1,top:c.y*CELL+1,width:CELL-2,height:CELL-2}}/>)}
            <div className={`absolute ${cc(s.food.x,s.food.y)}`} style={{left:s.food.x*CELL+2,top:s.food.y*CELL+2,width:CELL-4,height:CELL-4}}/>
            {s.status==="IDLE"&&<div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm"><p className="text-white font-mono text-lg mb-1">Ready?</p><p className="text-zinc-400 font-mono text-sm">Press arrow key or tap below</p></div>}
            {s.status==="PAUSED"&&<div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/70 backdrop-blur-sm"><p className="text-white font-mono text-2xl">PAUSED</p><p className="text-zinc-400 font-mono text-sm mt-1">Space to resume</p></div>}
            {s.status==="DEAD"&&<div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm gap-3"><p className="text-red-400 font-mono text-2xl font-bold">GAME OVER</p><p className="text-zinc-300 font-mono text-sm">Score: {s.score}</p><Button onClick={start} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono mt-1">Play Again</Button></div>}
          </div>
          <div className="grid grid-rows-3 grid-cols-3 gap-1 w-28">
            <div/><Button size="icon" variant="outline" className="h-9 w-9 border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white" onClick={()=>steer("UP")}>▲</Button><div/>
            <Button size="icon" variant="outline" className="h-9 w-9 border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white" onClick={()=>steer("LEFT")}>◄</Button>
            <Button size="icon" variant="outline" className="h-9 w-9 border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-zinc-500 cursor-default" disabled>●</Button>
            <Button size="icon" variant="outline" className="h-9 w-9 border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white" onClick={()=>steer("RIGHT")}>►</Button>
            <div/><Button size="icon" variant="outline" className="h-9 w-9 border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white" onClick={()=>steer("DOWN")}>▼</Button><div/>
          </div>
          <div className="flex gap-2">
            <Button onClick={start} size="sm" variant="outline" className="border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs">New Game</Button>
            <Button onClick={()=>setS(p=>p.status==="RUNNING"?{...p,status:"PAUSED"}:p.status==="PAUSED"?{...p,status:"RUNNING"}:p)} size="sm" variant="outline" className="border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs" disabled={s.status!=="RUNNING"&&s.status!=="PAUSED"}>
              {s.status==="PAUSED"?"Resume":"Pause"}
            </Button>
          </div>
          <p className="text-zinc-600 text-xs font-mono">WASD or arrows · Space to pause</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASTEROIDS
// ═══════════════════════════════════════════════════════════════════════════════
const AW=480,AH=480;
const makeAsteroid=(x,y,size)=>{
  const spd=0.5+(3-size)*0.55+Math.random()*0.5,ang=Math.random()*Math.PI*2,n=8+Math.floor(Math.random()*5),r=size*22;
  return{x,y,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,size,verts:Array.from({length:n},(_,i)=>{const a=(i/n)*Math.PI*2,ri=r*(0.6+Math.random()*0.75);return[Math.cos(a)*ri,Math.sin(a)*ri];}),angle:0,rotSpeed:(Math.random()-0.5)*0.03,radius:r*0.88};
};
const spawnWave=level=>{const count=3+level;return Array.from({length:count},()=>{let x,y;do{x=Math.random()*AW;y=Math.random()*AH;}while(Math.hypot(x-AW/2,y-AH/2)<110);return makeAsteroid(x,y,3);});};
const astStars=Array.from({length:70},()=>({x:Math.random()*AW,y:Math.random()*AH,r:Math.random()*1.3+0.2}));

function AsteroidsGame({onBack}){
  const canvasRef=useRef(null),keysRef=useRef({}),gameRef=useRef(null),rafRef=useRef(null);
  const [ui,setUi]=useState({score:0,best:0,lives:3,level:1,status:'IDLE'});
  useEffect(()=>{
    const canvas=canvasRef.current,ctx=canvas.getContext('2d');
    const mkShip=()=>({x:AW/2,y:AH/2,angle:-Math.PI/2,vx:0,vy:0});
    const gs={ship:mkShip(),asteroids:spawnWave(1),bullets:[],particles:[],score:0,best:0,lives:3,level:1,status:'IDLE',invTimer:0,lastShot:0};
    gameRef.current=gs;
    const explode=(x,y,n,cr,cg,cb)=>{for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,spd=rnd(0.8,3.5);gs.particles.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,life:rnd(18,45),cr,cg,cb});}};
    let lastUiKey='';
    const emitUi=()=>{const key=`${gs.score},${gs.lives},${gs.level},${gs.status}`;if(key!==lastUiKey){lastUiKey=key;setUi({score:gs.score,best:gs.best,lives:gs.lives,level:gs.level,status:gs.status});}};
    const shoot=()=>{const now=performance.now();if(now-gs.lastShot<220)return;gs.lastShot=now;gs.bullets.push({x:gs.ship.x+Math.cos(gs.ship.angle)*16,y:gs.ship.y+Math.sin(gs.ship.angle)*16,vx:Math.cos(gs.ship.angle)*9+gs.ship.vx,vy:Math.sin(gs.ship.angle)*9+gs.ship.vy,life:58});};
    const update=()=>{
      if(gs.status!=='RUNNING')return;
      const k=keysRef.current,sh=gs.ship;
      if(k['ArrowLeft']||k['a'])sh.angle-=0.055;
      if(k['ArrowRight']||k['d'])sh.angle+=0.055;
      if(k['ArrowUp']||k['w']){sh.vx+=Math.cos(sh.angle)*0.18;sh.vy+=Math.sin(sh.angle)*0.18;}
      const spd=Math.hypot(sh.vx,sh.vy);if(spd>7){sh.vx=sh.vx/spd*7;sh.vy=sh.vy/spd*7;}
      sh.vx*=0.985;sh.vy*=0.985;
      sh.x=(sh.x+sh.vx+AW)%AW;sh.y=(sh.y+sh.vy+AH)%AH;
      if(k[' '])shoot();
      if(gs.invTimer>0)gs.invTimer--;
      gs.bullets.forEach(b=>{b.x=(b.x+b.vx+AW)%AW;b.y=(b.y+b.vy+AH)%AH;b.life--;});
      gs.bullets=gs.bullets.filter(b=>b.life>0);
      gs.asteroids.forEach(a=>{a.x=(a.x+a.vx+AW)%AW;a.y=(a.y+a.vy+AH)%AH;a.angle+=a.rotSpeed;});
      gs.particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vx*=0.97;p.vy*=0.97;p.life--;});
      gs.particles=gs.particles.filter(p=>p.life>0);
      const newA=[];
      gs.bullets=gs.bullets.filter(b=>{for(let i=gs.asteroids.length-1;i>=0;i--){const a=gs.asteroids[i];if(Math.hypot(b.x-a.x,b.y-a.y)<a.radius){explode(a.x,a.y,6+a.size*4,251,191,36);gs.score+=[0,100,50,20][a.size];if(a.size>1){newA.push(makeAsteroid(a.x,a.y,a.size-1));newA.push(makeAsteroid(a.x,a.y,a.size-1));}gs.asteroids.splice(i,1);return false;}}return true;});
      gs.asteroids.push(...newA);
      if(gs.asteroids.length===0){gs.level++;gs.asteroids=spawnWave(gs.level);gs.ship=mkShip();gs.invTimer=150;}
      if(gs.invTimer===0){for(const a of gs.asteroids){if(Math.hypot(sh.x-a.x,sh.y-a.y)<a.radius+9){explode(sh.x,sh.y,20,52,211,153);gs.lives--;if(gs.lives<=0){gs.status='GAMEOVER';gs.best=Math.max(gs.best,gs.score);}else{gs.ship=mkShip();gs.invTimer=180;}break;}}}
      emitUi();
    };
    const render=()=>{
      const k=keysRef.current;
      ctx.fillStyle='#09090b';ctx.fillRect(0,0,AW,AH);
      astStars.forEach(s=>{ctx.globalAlpha=0.1+s.r*0.18;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(s.x,s.y,s.r*0.55,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;
      gs.asteroids.forEach(a=>{ctx.save();ctx.translate(a.x,a.y);ctx.rotate(a.angle);ctx.strokeStyle='#71717a';ctx.lineWidth=1.5;ctx.beginPath();a.verts.forEach(([x,y],i)=>i===0?ctx.moveTo(x,y):ctx.lineTo(x,y));ctx.closePath();ctx.stroke();ctx.restore();});
      gs.particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/40);ctx.fillStyle=`rgb(${Math.round(p.cr)},${Math.round(p.cg)},${Math.round(p.cb)})`;ctx.beginPath();ctx.arc(p.x,p.y,2,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;
      gs.bullets.forEach(b=>{ctx.shadowColor='#fbbf24';ctx.shadowBlur=8;ctx.fillStyle='#fde68a';ctx.beginPath();ctx.arc(b.x,b.y,3,0,Math.PI*2);ctx.fill();});ctx.shadowBlur=0;
      if(gs.status!=='GAMEOVER'&&(gs.invTimer===0||Math.floor(gs.invTimer/7)%2===0)){
        const sh=gs.ship,thrusting=!!(k['ArrowUp']||k['w']),margin=20,offsets=[[0,0]];
        if(sh.x<margin)offsets.push([AW,0]);if(sh.x>AW-margin)offsets.push([-AW,0]);
        if(sh.y<margin)offsets.push([0,AH]);if(sh.y>AH-margin)offsets.push([0,-AH]);
        if(sh.x<margin&&sh.y<margin)offsets.push([AW,AH]);if(sh.x>AW-margin&&sh.y<margin)offsets.push([-AW,AH]);
        if(sh.x<margin&&sh.y>AH-margin)offsets.push([AW,-AH]);if(sh.x>AW-margin&&sh.y>AH-margin)offsets.push([-AW,-AH]);
        offsets.forEach(([ox,oy])=>{ctx.save();ctx.translate(sh.x+ox,sh.y+oy);ctx.rotate(sh.angle);ctx.shadowColor='#34d399';ctx.shadowBlur=6;ctx.strokeStyle='#34d399';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(-10,9);ctx.lineTo(-5,0);ctx.lineTo(-10,-9);ctx.closePath();ctx.stroke();if(thrusting&&Math.random()>0.25){ctx.shadowColor='#f97316';ctx.shadowBlur=10;ctx.strokeStyle=`hsl(${rnd(20,40)},100%,60%)`;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-5,4);ctx.lineTo(-14-rnd(0,7),0);ctx.lineTo(-5,-4);ctx.stroke();}ctx.shadowBlur=0;ctx.restore();});
      }
      for(let i=0;i<gs.lives;i++){ctx.save();ctx.translate(15+i*22,15);ctx.rotate(-Math.PI/2);ctx.strokeStyle='#34d399';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(-6,5);ctx.lineTo(-3,0);ctx.lineTo(-6,-5);ctx.closePath();ctx.stroke();ctx.restore();}
      ctx.fillStyle='#3f3f46';ctx.font='11px monospace';ctx.textAlign='right';ctx.fillText(`LEVEL ${gs.level}`,AW-12,AH-12);
      if(gs.status==='IDLE'){ctx.fillStyle='rgba(9,9,11,0.72)';ctx.fillRect(0,0,AW,AH);ctx.textAlign='center';ctx.fillStyle='#ffffff';ctx.font='bold 26px monospace';ctx.fillText('ASTEROIDS',AW/2,AH/2-18);ctx.fillStyle='#a1a1aa';ctx.font='13px monospace';ctx.fillText('Press any key or use controls below',AW/2,AH/2+14);}
      else if(gs.status==='GAMEOVER'){ctx.fillStyle='rgba(9,9,11,0.78)';ctx.fillRect(0,0,AW,AH);ctx.textAlign='center';ctx.fillStyle='#f87171';ctx.font='bold 30px monospace';ctx.fillText('GAME OVER',AW/2,AH/2-28);ctx.fillStyle='#e4e4e7';ctx.font='15px monospace';ctx.fillText(`Score: ${gs.score}`,AW/2,AH/2+8);ctx.fillStyle='#71717a';ctx.font='12px monospace';ctx.fillText('Click "New Game" to play again',AW/2,AH/2+34);}
    };
    const loop=()=>{update();render();rafRef.current=requestAnimationFrame(loop);};
    rafRef.current=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(rafRef.current);
  },[]);
  useEffect(()=>{
    const down=e=>{keysRef.current[e.key]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(gameRef.current?.status==='IDLE'){gameRef.current.status='RUNNING';setUi(u=>({...u,status:'RUNNING'}));}};
    const up=e=>{keysRef.current[e.key]=false;};
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);};
  },[]);
  const newGame=()=>{if(!gameRef.current)return;const g=gameRef.current,best=Math.max(g.best,g.score);Object.assign(g,{ship:{x:AW/2,y:AH/2,angle:-Math.PI/2,vx:0,vy:0},asteroids:spawnWave(1),bullets:[],particles:[],score:0,best,lives:3,level:1,status:'RUNNING',invTimer:0,lastShot:0});setUi({score:0,best,lives:3,level:1,status:'RUNNING'});};
  const bp=key=>({onMouseDown:()=>{keysRef.current[key]=true;if(gameRef.current?.status==='IDLE'){gameRef.current.status='RUNNING';setUi(u=>({...u,status:'RUNNING'}));}},onMouseUp:()=>{keysRef.current[key]=false;},onMouseLeave:()=>{keysRef.current[key]=false;},onTouchStart:e=>{e.preventDefault();keysRef.current[key]=true;if(gameRef.current?.status==='IDLE'){gameRef.current.status='RUNNING';setUi(u=>({...u,status:'RUNNING'}));}},onTouchEnd:e=>{e.preventDefault();keysRef.current[key]=false;}});
  return(
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="bg-zinc-900 border-zinc-700 shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onBack} className="text-zinc-400 hover:text-white font-mono text-xs px-2">← Back</Button>
              <CardTitle className="text-white text-xl tracking-widest font-mono">🚀 ASTEROIDS</CardTitle>
            </div>
            <div className="flex gap-3">
              <div className="text-center"><p className="text-zinc-500 text-xs font-mono uppercase tracking-wider">Lvl</p><Badge variant="outline" className="border-sky-600 text-sky-400 font-mono text-sm min-w-[40px] justify-center">{ui.level}</Badge></div>
              <div className="text-center"><p className="text-zinc-500 text-xs font-mono uppercase tracking-wider">Score</p><Badge variant="outline" className="border-emerald-600 text-emerald-400 font-mono text-sm min-w-[56px] justify-center">{ui.score}</Badge></div>
              <Separator orientation="vertical" className="h-10 bg-zinc-700"/>
              <div className="text-center"><p className="text-zinc-500 text-xs font-mono uppercase tracking-wider">Best</p><Badge variant="outline" className="border-amber-600 text-amber-400 font-mono text-sm min-w-[56px] justify-center">{ui.best}</Badge></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <canvas ref={canvasRef} width={AW} height={AH} className="rounded-lg border border-zinc-800"/>
          <div className="flex items-center gap-8">
            <div className="grid gap-1" style={{gridTemplateColumns:'repeat(3,2.5rem)',gridTemplateRows:'repeat(2,2.5rem)'}}>
              <div/><Button size="icon" variant="outline" className="h-10 w-10 border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white select-none" {...bp('ArrowUp')} title="Thrust">▲</Button><div/>
              <Button size="icon" variant="outline" className="h-10 w-10 border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white select-none" {...bp('ArrowLeft')} title="Rotate Left">↺</Button>
              <div/>
              <Button size="icon" variant="outline" className="h-10 w-10 border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white select-none" {...bp('ArrowRight')} title="Rotate Right">↻</Button>
            </div>
            <Button className="h-16 w-16 rounded-full bg-red-900 hover:bg-red-800 border-2 border-red-700 text-white font-mono text-sm font-bold select-none" variant="outline" {...bp(' ')}>FIRE</Button>
          </div>
          <div className="flex gap-2"><Button onClick={newGame} size="sm" variant="outline" className="border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs">New Game</Button></div>
          <p className="text-zinc-600 text-xs font-mono">← → Rotate · ↑ Thrust · Space Fire</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPACE INVADERS
// ═══════════════════════════════════════════════════════════════════════════════
const SW=480, SH=520;
const INV_COLS=11, INV_ROWS=5;
const INV_W=32, INV_H=24, INV_PAD_X=10, INV_PAD_Y=10;
const SHIELD_CELLS=[ // bitmask rows for shield shape
  [0,1,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,0,0,0,0,0,1,1,1],
  [1,1,0,0,0,0,0,0,0,1,1],
];
// Invader pixel art rows (3 types by row)
const INV_SPRITES=[
  // row type 0 — top (UFO-ish, 2 pts)
  [[0,0,0,1,1,0,0,0],[0,0,1,1,1,1,0,0],[0,1,1,1,1,1,1,0],[1,1,0,1,1,0,1,1],[1,1,1,1,1,1,1,1],[0,0,1,0,0,1,0,0],[0,1,0,1,1,0,1,0],[0,0,1,0,0,1,0,0]],
  [[0,0,0,1,1,0,0,0],[0,0,1,1,1,1,0,0],[0,1,1,1,1,1,1,0],[1,1,0,1,1,0,1,1],[1,1,1,1,1,1,1,1],[0,1,0,1,1,0,1,0],[1,0,1,0,0,1,0,1],[0,1,0,0,0,0,1,0]],
  // row type 1 — mid (crab)
  [[0,0,1,0,0,0,0,1,0,0],[0,0,0,1,0,0,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,1,1,0,1,1,0,1,1,0],[1,1,1,1,1,1,1,1,1,1],[1,0,1,1,1,1,1,1,0,1],[1,0,1,0,0,0,0,1,0,1],[0,0,0,1,1,1,1,0,0,0]],
  [[0,0,1,0,0,0,0,1,0,0],[1,0,0,1,0,0,1,0,0,1],[1,0,1,1,1,1,1,1,0,1],[1,1,1,0,1,1,0,1,1,1],[1,1,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,1,0],[0,0,1,0,0,0,0,1,0,0],[0,1,0,0,0,0,0,0,1,0]],
  // row type 2 — bottom (squid)
  [[0,0,0,0,1,1,0,0,0,0,0],[0,0,0,1,1,1,1,0,0,0,0],[0,0,1,1,1,1,1,1,0,0,0],[0,1,1,0,1,1,0,1,1,0,0],[1,1,1,1,1,1,1,1,1,1,0],[1,0,1,1,1,1,1,1,0,1,0],[1,0,1,0,0,0,0,1,0,1,0],[0,0,0,1,1,0,1,1,0,0,0]],
  [[0,0,0,0,1,1,0,0,0,0,0],[0,0,0,1,1,1,1,0,0,0,0],[0,0,1,1,1,1,1,1,0,0,0],[0,1,1,0,1,1,0,1,1,0,0],[1,1,1,1,1,1,1,1,1,1,0],[0,1,0,1,1,1,1,0,1,0,0],[1,0,0,1,0,0,1,0,0,1,0],[0,1,0,0,0,0,0,0,1,0,0]],
];
const INV_COLORS=['#e879f9','#e879f9','#38bdf8','#38bdf8','#4ade80','#4ade80','#4ade80'];
const INV_PTS=[30,30,20,20,10,10,10];

function makeShields(){
  const shields=[];
  const shieldCount=4;
  const totalW=SW;const gap=totalW/(shieldCount+1);
  for(let s=0;s<shieldCount;s++){
    const sx=Math.round(gap*(s+1)-SHIELD_CELLS[0].length*3);
    const sy=SH-110;
    const cells=SHIELD_CELLS.map(r=>[...r]);
    shields.push({x:sx,y:sy,cells});
  }
  return shields;
}

function makeInvaders(){
  const invaders=[];
  for(let r=0;r<INV_ROWS;r++){
    for(let c=0;c<INV_COLS;c++){
      invaders.push({col:c,row:r,alive:true,frame:0});
    }
  }
  return invaders;
}

const siStars=Array.from({length:80},()=>({x:Math.random()*SW,y:Math.random()*SH,r:Math.random()*1.2+0.2,twinkle:Math.random()*Math.PI*2}));

function SpaceInvadersGame({onBack}){
  const canvasRef=useRef(null),keysRef=useRef({}),gameRef=useRef(null),rafRef=useRef(null);
  const [ui,setUi]=useState({score:0,best:0,lives:3,wave:1,status:'IDLE'});

  useEffect(()=>{
    const canvas=canvasRef.current,ctx=canvas.getContext('2d');
    const gs={
      player:{x:SW/2,y:SH-40,w:36,h:18},
      invaders:makeInvaders(),shields:makeShields(),
      bullets:[],enemyBullets:[],
      ufo:null,ufoTimer:0,
      score:0,best:0,lives:3,wave:1,
      status:'IDLE',
      invDir:1,invX:0,invY:0,invDrop:false,
      marchTimer:0,marchInterval:60,marchFrame:0,
      shootTimer:0,playerShotCool:0,
      tick:0,
    };
    gameRef.current=gs;
    let lastUiKey='';
    const emitUi=()=>{const k=`${gs.score},${gs.lives},${gs.wave},${gs.status}`;if(k!==lastUiKey){lastUiKey=k;setUi({score:gs.score,best:gs.best,lives:gs.lives,wave:gs.wave,status:gs.status});}};

    const resetWave=(wave)=>{
      gs.invaders=makeInvaders();gs.invX=0;gs.invY=0;gs.invDir=1;gs.invDrop=false;
      gs.bullets=[];gs.enemyBullets=[];gs.ufo=null;gs.ufoTimer=rnd(400,700);
      gs.marchInterval=Math.max(8,60-wave*5);
      gs.wave=wave;
    };

    const playerShoot=()=>{
      if(gs.playerShotCool>0)return;
      if(gs.bullets.filter(b=>b.owner==='player').length>=2)return;
      gs.bullets.push({x:gs.player.x,y:gs.player.y-gs.player.h/2,vy:-8,owner:'player',life:120});
      gs.playerShotCool=18;
    };

    const shieldHit=(bx,by,bw,bh)=>{
      for(const sh of gs.shields){
        const cellW=6,cellH=6;
        for(let r=0;r<sh.cells.length;r++){
          for(let c=0;c<sh.cells[r].length;c++){
            if(!sh.cells[r][c])continue;
            const cx=sh.x+c*cellW,cy=sh.y+r*cellH;
            if(bx<cx+cellW&&bx+bw>cx&&by<cy+cellH&&by+bh>cy){sh.cells[r][c]=0;return true;}
          }
        }
      }
      return false;
    };

    const update=()=>{
      if(gs.status!=='RUNNING')return;
      gs.tick++;
      const k=keysRef.current,pl=gs.player;

      // Player movement
      const spd=3.5;
      if((k['ArrowLeft']||k['a'])&&pl.x-pl.w/2>0)pl.x-=spd;
      if((k['ArrowRight']||k['d'])&&pl.x+pl.w/2<SW)pl.x+=spd;
      if(k[' ']||k['ArrowUp'])playerShoot();
      if(gs.playerShotCool>0)gs.playerShotCool--;

      // March invaders
      gs.marchTimer++;
      const alive=gs.invaders.filter(i=>i.alive);
      const dynInterval=Math.max(4,gs.marchInterval-Math.floor((INV_COLS*INV_ROWS-alive.length)*0.4));
      if(gs.marchTimer>=dynInterval){
        gs.marchTimer=0;gs.marchFrame^=1;
        // Update frame for all
        gs.invaders.forEach(i=>{if(i.alive)i.frame=gs.marchFrame;});
        if(gs.invDrop){gs.invY+=12;gs.invDrop=false;}
        else{
          gs.invX+=14*gs.invDir;
          // Find extents
          let minC=INV_COLS,maxC=-1;
          alive.forEach(i=>{if(i.col<minC)minC=i.col;if(i.col>maxC)maxC=i.col;});
          const leftEdge=gs.invX+minC*(INV_W+INV_PAD_X);
          const rightEdge=gs.invX+(maxC+1)*(INV_W+INV_PAD_X)-INV_PAD_X;
          if(leftEdge<=0||rightEdge>=SW){gs.invDir*=-1;gs.invDrop=true;}
        }
      }

      // Enemy shooting
      gs.shootTimer++;
      const shootInterval=Math.max(20,70-gs.wave*4);
      if(gs.shootTimer>=shootInterval&&alive.length>0){
        gs.shootTimer=0;
        // Find bottom invader in a random column
        const cols=[...new Set(alive.map(i=>i.col))];
        const rc=cols[Math.floor(Math.random()*cols.length)];
        const colInvaders=alive.filter(i=>i.col===rc).sort((a,b)=>b.row-a.row);
        if(colInvaders.length){
          const fi=colInvaders[0];
          const ix=gs.invX+fi.col*(INV_W+INV_PAD_X)+INV_W/2;
          const iy=gs.invY+fi.row*(INV_H+INV_PAD_Y)+INV_H;
          const startY=40+iy;
          gs.enemyBullets.push({x:ix,y:startY,vy:3+gs.wave*0.3,life:200});
        }
      }

      // UFO
      gs.ufoTimer--;
      if(gs.ufoTimer<=0&&!gs.ufo){const dir=Math.random()>0.5?1:-1;gs.ufo={x:dir>0?-30:SW+30,y:26,vx:dir*2.2,hp:1};gs.ufoTimer=rnd(500,900);}
      if(gs.ufo){gs.ufo.x+=gs.ufo.vx;if(gs.ufo.x<-60||gs.ufo.x>SW+60)gs.ufo=null;}

      // Move bullets
      gs.bullets.forEach(b=>{b.y+=b.vy;b.life--;});
      gs.bullets=gs.bullets.filter(b=>b.life>0&&b.y>0&&b.y<SH);
      gs.enemyBullets.forEach(b=>{b.y+=b.vy;b.life--;});
      gs.enemyBullets=gs.enemyBullets.filter(b=>b.life>0&&b.y<SH);

      // Player bullets vs invaders + ufo + shields
      gs.bullets=gs.bullets.filter(b=>{
        if(b.owner!=='player')return true;
        // UFO
        if(gs.ufo&&Math.abs(b.x-gs.ufo.x)<22&&Math.abs(b.y-gs.ufo.y)<12){gs.score+=100;gs.ufo=null;return false;}
        // Invaders
        for(let i=gs.invaders.length-1;i>=0;i--){
          const inv=gs.invaders[i];if(!inv.alive)continue;
          const ix=gs.invX+inv.col*(INV_W+INV_PAD_X),iy=40+gs.invY+inv.row*(INV_H+INV_PAD_Y);
          if(b.x>=ix&&b.x<=ix+INV_W&&b.y>=iy&&b.y<=iy+INV_H){inv.alive=false;gs.score+=INV_PTS[inv.row];return false;}
        }
        // Shields
        if(shieldHit(b.x-2,b.y-4,4,8))return false;
        return true;
      });

      // Enemy bullets vs player + shields
      gs.enemyBullets=gs.enemyBullets.filter(b=>{
        if(shieldHit(b.x-2,b.y-4,4,8))return false;
        if(Math.abs(b.x-pl.x)<pl.w/2+2&&Math.abs(b.y-pl.y)<pl.h/2+4){
          gs.lives--;if(gs.lives<=0){gs.status='GAMEOVER';gs.best=Math.max(gs.best,gs.score);}
          return false;
        }
        return true;
      });

      // Invaders reach bottom?
      const bottom=alive.some(i=>{const iy=40+gs.invY+i.row*(INV_H+INV_PAD_Y)+INV_H;return iy>=pl.y-pl.h/2;});
      if(bottom){gs.status='GAMEOVER';gs.best=Math.max(gs.best,gs.score);}

      // Wave clear?
      if(alive.length===0){resetWave(gs.wave+1);gs.bullets=[];gs.enemyBullets=[];}
      emitUi();
    };

    const drawInvader=(ctx,type,x,y,frame,color)=>{
      const si=type*2+frame;
      const sprite=INV_SPRITES[si]||INV_SPRITES[0];
      const pw=Math.floor(INV_W/sprite[0].length),ph=Math.floor(INV_H/sprite.length);
      ctx.fillStyle=color;
      sprite.forEach((row,r)=>row.forEach((cell,c)=>{if(cell)ctx.fillRect(x+c*pw,y+r*ph,pw,ph);}));
    };

    const render=()=>{
      ctx.fillStyle='#09090b';ctx.fillRect(0,0,SW,SH);
      // Stars
      siStars.forEach(s=>{const tw=Math.sin(gs.tick*0.04+s.twinkle);ctx.globalAlpha=0.08+tw*0.06;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s.x,s.y,s.r*0.5,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;

      // Shields
      for(const sh of gs.shields){
        const cellW=6,cellH=6;
        ctx.fillStyle='#4ade80';
        sh.cells.forEach((row,r)=>row.forEach((cell,c)=>{if(cell)ctx.fillRect(sh.x+c*cellW,sh.y+r*cellH,cellW-1,cellH-1);}));
      }

      // Invaders
      gs.invaders.forEach(inv=>{
        if(!inv.alive)return;
        const ix=gs.invX+inv.col*(INV_W+INV_PAD_X);
        const iy=40+gs.invY+inv.row*(INV_H+INV_PAD_Y);
        const type=Math.floor(inv.row/2);
        drawInvader(ctx,type,ix,iy,inv.frame,INV_COLORS[inv.row]||'#fff');
      });

      // UFO
      if(gs.ufo){
        ctx.fillStyle='#f43f5e';
        const ux=gs.ufo.x,uy=gs.ufo.y;
        ctx.beginPath();ctx.ellipse(ux,uy,22,8,0,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.ellipse(ux,uy-5,10,7,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#fda4af';
        for(let i=-1;i<=1;i++){ctx.beginPath();ctx.arc(ux+i*8,uy,2,0,Math.PI*2);ctx.fill();}
        ctx.fillStyle='#fda4af';ctx.font='9px monospace';ctx.textAlign='center';ctx.fillText('100',ux,uy-16);
      }

      // Player bullets
      ctx.shadowColor='#a5f3fc';ctx.shadowBlur=6;
      gs.bullets.forEach(b=>{ctx.fillStyle='#e0f2fe';ctx.fillRect(b.x-2,b.y-6,4,12);});
      ctx.shadowBlur=0;
      // Enemy bullets (zigzag drawn as diamond)
      ctx.fillStyle='#fca5a5';
      gs.enemyBullets.forEach(b=>{
        ctx.save();ctx.translate(b.x,b.y);ctx.rotate(gs.tick*0.15);
        ctx.fillRect(-2,-5,4,10);ctx.restore();
      });

      // Player ship
      const pl=gs.player;
      ctx.shadowColor='#34d399';ctx.shadowBlur=8;
      ctx.fillStyle='#34d399';
      // Body
      ctx.fillRect(pl.x-pl.w/2,pl.y-pl.h/2+4,pl.w,pl.h-4);
      // Cannon
      ctx.fillRect(pl.x-3,pl.y-pl.h/2-4,6,10);
      // Wings
      ctx.beginPath();ctx.moveTo(pl.x-pl.w/2,pl.y+pl.h/2);ctx.lineTo(pl.x-pl.w/2-6,pl.y+pl.h/2);ctx.lineTo(pl.x-pl.w/3,pl.y);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(pl.x+pl.w/2,pl.y+pl.h/2);ctx.lineTo(pl.x+pl.w/2+6,pl.y+pl.h/2);ctx.lineTo(pl.x+pl.w/3,pl.y);ctx.closePath();ctx.fill();
      ctx.shadowBlur=0;

      // Ground line
      ctx.strokeStyle='#27272a';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,SH-20);ctx.lineTo(SW,SH-20);ctx.stroke();

      // Lives icons at bottom
      for(let i=0;i<gs.lives;i++){ctx.fillStyle='#34d399';ctx.fillRect(10+i*20,SH-14,12,8);ctx.fillRect(14+i*20,SH-18,4,6);}

      // Score top-right
      ctx.fillStyle='#3f3f46';ctx.font='11px monospace';ctx.textAlign='right';ctx.fillText(`WAVE ${gs.wave}`,SW-12,SH-8);

      if(gs.status==='IDLE'){
        ctx.fillStyle='rgba(9,9,11,0.72)';ctx.fillRect(0,0,SW,SH);
        ctx.textAlign='center';
        ctx.fillStyle='#f9fafb';ctx.font='bold 24px monospace';ctx.fillText('SPACE INVADERS',SW/2,SH/2-20);
        ctx.fillStyle='#a1a1aa';ctx.font='13px monospace';ctx.fillText('Press any key or use controls below',SW/2,SH/2+12);
      }else if(gs.status==='GAMEOVER'){
        ctx.fillStyle='rgba(9,9,11,0.78)';ctx.fillRect(0,0,SW,SH);
        ctx.textAlign='center';
        ctx.fillStyle='#f87171';ctx.font='bold 28px monospace';ctx.fillText('GAME OVER',SW/2,SH/2-28);
        ctx.fillStyle='#e4e4e7';ctx.font='15px monospace';ctx.fillText(`Score: ${gs.score}`,SW/2,SH/2+8);
        ctx.fillStyle='#71717a';ctx.font='12px monospace';ctx.fillText('Click "New Game" to play again',SW/2,SH/2+34);
      }
    };
    const loop=()=>{update();render();rafRef.current=requestAnimationFrame(loop);};
    rafRef.current=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(rafRef.current);
  },[]);

  useEffect(()=>{
    const down=e=>{
      keysRef.current[e.key]=true;
      if(['ArrowLeft','ArrowRight','ArrowUp',' '].includes(e.key))e.preventDefault();
      if(gameRef.current?.status==='IDLE'){gameRef.current.status='RUNNING';setUi(u=>({...u,status:'RUNNING'}));}
    };
    const up=e=>{keysRef.current[e.key]=false;};
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);};
  },[]);

  const newGame=()=>{
    const g=gameRef.current;if(!g)return;
    const best=Math.max(g.best,g.score);
    g.player={x:SW/2,y:SH-40,w:36,h:18};
    g.invaders=makeInvaders();g.shields=makeShields();
    g.bullets=[];g.enemyBullets=[];g.ufo=null;g.ufoTimer=rnd(400,700);
    g.score=0;g.best=best;g.lives=3;g.wave=1;g.status='RUNNING';
    g.invDir=1;g.invX=0;g.invY=0;g.invDrop=false;
    g.marchTimer=0;g.marchInterval=60;g.marchFrame=0;g.shootTimer=0;g.playerShotCool=0;g.tick=0;
    setUi({score:0,best,lives:3,wave:1,status:'RUNNING'});
  };
  const bp=key=>({
    onMouseDown:()=>{keysRef.current[key]=true;if(gameRef.current?.status==='IDLE'){gameRef.current.status='RUNNING';setUi(u=>({...u,status:'RUNNING'}));}},
    onMouseUp:()=>{keysRef.current[key]=false;},onMouseLeave:()=>{keysRef.current[key]=false;},
    onTouchStart:e=>{e.preventDefault();keysRef.current[key]=true;if(gameRef.current?.status==='IDLE'){gameRef.current.status='RUNNING';setUi(u=>({...u,status:'RUNNING'}));}},
    onTouchEnd:e=>{e.preventDefault();keysRef.current[key]=false;},
  });

  return(
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="bg-zinc-900 border-zinc-700 shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onBack} className="text-zinc-400 hover:text-white font-mono text-xs px-2">← Back</Button>
              <CardTitle className="text-white text-xl tracking-widest font-mono">👾 SPACE INVADERS</CardTitle>
            </div>
            <div className="flex gap-3">
              <div className="text-center"><p className="text-zinc-500 text-xs font-mono uppercase tracking-wider">Wave</p><Badge variant="outline" className="border-fuchsia-600 text-fuchsia-400 font-mono text-sm min-w-[40px] justify-center">{ui.wave}</Badge></div>
              <div className="text-center"><p className="text-zinc-500 text-xs font-mono uppercase tracking-wider">Score</p><Badge variant="outline" className="border-emerald-600 text-emerald-400 font-mono text-sm min-w-[56px] justify-center">{ui.score}</Badge></div>
              <Separator orientation="vertical" className="h-10 bg-zinc-700"/>
              <div className="text-center"><p className="text-zinc-500 text-xs font-mono uppercase tracking-wider">Best</p><Badge variant="outline" className="border-amber-600 text-amber-400 font-mono text-sm min-w-[56px] justify-center">{ui.best}</Badge></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <canvas ref={canvasRef} width={SW} height={SH} className="rounded-lg border border-zinc-800"/>
          <div className="flex items-center gap-4">
            <Button size="icon" variant="outline" className="h-11 w-11 border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white select-none text-lg" {...bp('ArrowLeft')}>◄</Button>
            <Button className="h-14 w-20 rounded-full bg-red-900 hover:bg-red-800 border-2 border-red-700 text-white font-mono text-sm font-bold select-none" variant="outline" {...bp(' ')}>FIRE</Button>
            <Button size="icon" variant="outline" className="h-11 w-11 border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white select-none text-lg" {...bp('ArrowRight')}>►</Button>
          </div>
          <div className="flex gap-2"><Button onClick={newGame} size="sm" variant="outline" className="border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs">New Game</Button></div>
          <p className="text-zinc-600 text-xs font-mono">← → Move · Space to fire · UFO = 100pts</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SELECTOR
// ═══════════════════════════════════════════════════════════════════════════════
function GameSelector({onSelect}){
  const games=[
    {id:'snake',emoji:'🐍',label:'SNAKE',color:'emerald',desc:'Eat food, grow longer,\navoid yourself'},
    {id:'asteroids',emoji:'🚀',label:'ASTEROIDS',color:'sky',desc:'Blast rocks, survive\nthe asteroid field'},
    {id:'invaders',emoji:'👾',label:'SPACE INVADERS',color:'fuchsia',desc:'Defend Earth from\nthe alien armada'},
  ];
  const border={emerald:'hover:border-emerald-600',sky:'hover:border-sky-600',fuchsia:'hover:border-fuchsia-600'};
  const txt={emerald:'text-emerald-400',sky:'text-sky-400',fuchsia:'text-fuchsia-400'};
  const btn={emerald:'bg-emerald-700 hover:bg-emerald-600',sky:'bg-sky-700 hover:bg-sky-600',fuchsia:'bg-fuchsia-800 hover:bg-fuchsia-700'};
  return(
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-10">
        <div className="text-center">
          <h1 className="text-white text-4xl font-mono font-bold tracking-[0.2em] uppercase">🕹️ ARCADE</h1>
          <p className="text-zinc-500 font-mono text-sm mt-2 tracking-widest">SELECT YOUR GAME</p>
        </div>
        <div className="flex gap-5 flex-wrap justify-center">
          {games.map(g=>(
            <Card key={g.id} onClick={()=>onSelect(g.id)} className={`bg-zinc-900 border-zinc-700 ${border[g.color]} cursor-pointer transition-all hover:scale-105 w-44`}>
              <CardContent className="flex flex-col items-center gap-3 pt-6 pb-6">
                <span className="text-5xl">{g.emoji}</span>
                <div className="text-center">
                  <p className={`${txt[g.color]} font-mono font-bold tracking-widest text-sm`}>{g.label}</p>
                  <p className="text-zinc-500 font-mono text-xs mt-2 leading-relaxed whitespace-pre-line">{g.desc}</p>
                </div>
                <Button size="sm" className={`${btn[g.color]} text-white font-mono text-xs w-full mt-1`}>PLAY</Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-zinc-700 font-mono text-xs tracking-widest">MORE GAMES COMING SOON</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App(){
  const [game,setGame]=useState(null);
  if(game==='snake')    return <SnakeGame     onBack={()=>setGame(null)}/>;
  if(game==='asteroids')return <AsteroidsGame onBack={()=>setGame(null)}/>;
  if(game==='invaders') return <SpaceInvadersGame onBack={()=>setGame(null)}/>;
  return <GameSelector onSelect={setGame}/>;
}