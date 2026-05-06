import { useState } from "react";
import { Button } from "@brightlocal/ui-components/button";
import { Card, CardContent } from "@brightlocal/ui-components/card";
import SnakeGame from "./games/SnakeGame";
import AsteroidsGame from "./games/AsteroidsGame";
import SpaceInvadersGame from "./games/SpaceInvadersGame";
import PacmanGame from "./games/PacmanGame";
import MinesweeperGame from "./games/MinesweeperGame";
import TetrisGame from "./games/TetrisGame";

const GAMES = [
  { id: "snake", emoji: "🐍", label: "SNAKE", color: "emerald", desc: "Eat food, grow longer,\navoid yourself" },
  { id: "asteroids", emoji: "🚀", label: "ASTEROIDS", color: "sky", desc: "Blast rocks, survive\nthe asteroid field" },
  { id: "invaders", emoji: "👾", label: "SPACE INVADERS", color: "fuchsia", desc: "Defend Earth from\nthe alien armada" },
  { id: "pacman", emoji: "👻", label: "PAC-MAN", color: "amber", desc: "Eat the dots,\ndodge the ghosts" },
  { id: "mines", emoji: "💣", label: "MINESWEEPER", color: "rose", desc: "Find the safe squares,\nflag the bombs" },
  { id: "tetris", emoji: "🧱", label: "TETRIS", color: "violet", desc: "Stack the blocks,\nclear the lines" },
];

const BORDER = {
  emerald: "hover:border-emerald-600", sky: "hover:border-sky-600", fuchsia: "hover:border-fuchsia-600",
  amber: "hover:border-amber-600", rose: "hover:border-rose-600", violet: "hover:border-violet-600",
};
const TXT = {
  emerald: "text-emerald-400", sky: "text-sky-400", fuchsia: "text-fuchsia-400",
  amber: "text-amber-400", rose: "text-rose-400", violet: "text-violet-400",
};
const BTN = {
  emerald: "bg-emerald-700 hover:bg-emerald-600", sky: "bg-sky-700 hover:bg-sky-600", fuchsia: "bg-fuchsia-800 hover:bg-fuchsia-700",
  amber: "bg-amber-700 hover:bg-amber-600", rose: "bg-rose-800 hover:bg-rose-700", violet: "bg-violet-800 hover:bg-violet-700",
};

function GameSelector({ onSelect }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-10">
        <div className="text-center">
          <h1 className="text-white text-4xl font-mono font-bold tracking-[0.2em] uppercase">🕹️ ARCADE</h1>
          <p className="text-zinc-500 font-mono text-sm mt-2 tracking-widest">SELECT YOUR GAME</p>
        </div>
        <div className="flex gap-5 flex-wrap justify-center">
          {GAMES.map((g) => (
            <Card
              key={g.id}
              onClick={() => onSelect(g.id)}
              maxWidth="100%"
              className={`bg-zinc-900 border-zinc-700 ${BORDER[g.color]} cursor-pointer transition-all hover:scale-105 w-44 py-0 gap-0`}
            >
              <CardContent className="flex flex-col items-center gap-3 px-4 py-6">
                <span className="text-5xl">{g.emoji}</span>
                <div className="text-center">
                  <p className={`${TXT[g.color]} font-mono font-bold tracking-widest text-sm`}>{g.label}</p>
                  <p className="text-zinc-500 font-mono text-xs mt-2 leading-relaxed whitespace-pre-line">{g.desc}</p>
                </div>
                <Button size="sm" className={`${BTN[g.color]} text-white font-mono text-xs w-full mt-1 rounded-md`}>PLAY</Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-zinc-700 font-mono text-xs tracking-widest">MORE GAMES COMING SOON</p>
      </div>
    </div>
  );
}

export default function ArcadeApp() {
  const [game, setGame] = useState(null);
  const back = () => setGame(null);

  if (game === "snake") return <SnakeGame onBack={back} />;
  if (game === "asteroids") return <AsteroidsGame onBack={back} />;
  if (game === "invaders") return <SpaceInvadersGame onBack={back} />;
  if (game === "pacman") return <PacmanGame onBack={back} />;
  if (game === "mines") return <MinesweeperGame onBack={back} />;
  if (game === "tetris") return <TetrisGame onBack={back} />;
  return <GameSelector onSelect={setGame} />;
}
