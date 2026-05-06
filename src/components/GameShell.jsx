import { useEffect, useSyncExternalStore } from "react";
import { Badge } from "@brightlocal/ui-components/badge";
import { Button } from "@brightlocal/ui-components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@brightlocal/ui-components/card";
import { Separator } from "@brightlocal/ui-components/separator";
import { isBossActive, setBossActive, subscribeBoss } from "../lib/bossMode";
import BossSpreadsheet from "./BossSpreadsheet";

/**
 * Shared game chrome — Card with header (back button, title, stat badges),
 * a content area for the game board, a controls area, and a hint line.
 *
 * @param {Object}   props
 * @param {string}   props.title      – e.g. "🐍 SNAKE"
 * @param {Function} [props.onBack]   – If provided, renders a ← Back button
 * @param {Array<{label:string, value:any, borderColor:string, textColor:string}>} props.stats
 * @param {React.ReactNode} props.children   – Game board / canvas
 * @param {React.ReactNode} [props.controls] – D-pad, fire button, etc.
 * @param {React.ReactNode} [props.actions]  – New Game / Pause buttons row
 * @param {string}   [props.hint]     – Small text at bottom (e.g. key instructions)
 * @param {boolean}  [props.fullPage] – Wrap in min-h-screen centering (default true)
 */
export default function GameShell({
  title,
  onBack,
  stats = [],
  children,
  controls,
  actions,
  hint,
  fullPage = true,
}) {
  const boss = useSyncExternalStore(subscribeBoss, isBossActive, () => false);

  // Esc toggles boss mode; while active, swallow all other keys so the game
  // beneath does not react. Capture phase wins against per-game window listeners.
  // Toggle only fires on keydown (not keyup) and ignores OS key-repeat — otherwise
  // a single tap would flip twice and holding Esc would machine-gun the toggle.
  useEffect(() => {
    const onDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        if (e.repeat) return;
        setBossActive(!isBossActive());
        return;
      }
      if (isBossActive()) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const onUp = (e) => {
      if (e.key === "Escape" || isBossActive()) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", onDown, { capture: true });
    window.addEventListener("keyup", onUp, { capture: true });
    return () => {
      window.removeEventListener("keydown", onDown, { capture: true });
      window.removeEventListener("keyup", onUp, { capture: true });
      // Always exit boss mode when leaving a game (back to menu, switch game).
      setBossActive(false);
    };
  }, []);

  const inner = (
    <Card maxWidth="100%" className="bg-zinc-900 border-zinc-700 shadow-2xl py-0 gap-0 w-auto">
      <CardHeader className="px-6 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800 font-mono text-xs px-2 rounded-md"
              >
                ← Back
              </Button>
            )}
            <CardTitle className="text-white text-xl tracking-widest font-mono uppercase">
              {title}
            </CardTitle>
          </div>
          {stats.length > 0 && (
            <div className="flex gap-3">
              {stats.map((s, i) => (
                <div key={s.label} className="flex items-center gap-3">
                  {i > 0 && <Separator orientation="vertical" className="h-10 bg-zinc-700" />}
                  <div className="text-center">
                    <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider">
                      {s.label}
                    </p>
                    <Badge
                      variant="outline"
                      className={`${s.borderColor} ${s.textColor} font-mono text-sm min-w-[40px] justify-center`}
                    >
                      {s.value}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-4 px-6 pb-6">
        {children}
        {controls}
        {actions && <div className="flex gap-2">{actions}</div>}
        {hint && <p className="text-zinc-600 text-xs font-mono">{hint}</p>}
      </CardContent>
    </Card>
  );

  const wrapped = fullPage ? (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {inner}
    </div>
  ) : (
    inner
  );

  return (
    <>
      {wrapped}
      {boss && <BossSpreadsheet />}
    </>
  );
}
