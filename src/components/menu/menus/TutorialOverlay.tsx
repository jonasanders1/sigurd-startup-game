import React, { useEffect, useState } from "react";
import { useStateStore, useInputStore } from "../../../stores/gameStore";
import {
  TUTORIAL_MISSIONS,
  P_COIN_TUTORIAL_INFO,
} from "../../../tutorials/missions";
import { TutorialMissionId } from "../../../types/enums";
import type { SubTaskId } from "../../../managers/TutorialManager";
import { Check } from "lucide-react";

const TutorialOverlay: React.FC = () => {
  const tutorialMission = useStateStore((s) => s.tutorialMission);

  if (!tutorialMission) return null;
  const mission = TUTORIAL_MISSIONS[tutorialMission];

  return (
    <div
      className="absolute top-3 right-3 z-30 bg-menu backdrop-blur-sm rounded-sm px-4 py-3 max-w-[280px]"
      style={{ minWidth: 220 }}
    >
      <div className="font-pixel text-xs uppercase tracking-wider text-primary mb-2 leading-none">
        {mission.overlayTitle ?? mission.title}
      </div>

      {tutorialMission === TutorialMissionId.MOVEMENTS && <MovementsContent />}
      {tutorialMission === TutorialMissionId.FOUNDINGS && <FoundingsContent />}
      {tutorialMission === TutorialMissionId.SURVIVE && <SurviveContent />}
      {tutorialMission === TutorialMissionId.KILL && <KillContent />}
    </div>
  );
};

export default TutorialOverlay;

type Control = {
  keys: string[];
  wasdKeys?: string[];
  description: string;
  subTaskId: SubTaskId;
};
const CONTROLS: Control[] = [
  {
    keys: ["←"],
    wasdKeys: ["A"],
    description: "Gå venstre",
    subTaskId: "moveLeft",
  },
  {
    keys: ["→"],
    wasdKeys: ["D"],
    description: "Gå høyre",
    subTaskId: "moveRight",
  },
  { keys: ["↑"], wasdKeys: ["W"], description: "Hopp", subTaskId: "jump" },
  {
    keys: ["↑", "SHIFT"],
    wasdKeys: ["W", "SHIFT"],
    description: "Super-hopp",
    subTaskId: "superJump",
  },
  { keys: ["SPACE"], description: "Sveve (hold)", subTaskId: "float" },
  { keys: ["↓"], wasdKeys: ["S"], description: "Rask fall", subTaskId: "fall" },
];

const MovementsContent: React.FC = () => {
  const subTasks = useStateStore((s) => s.tutorialSubTasks);
  const input = useInputStore((s) => s.input);

  const isKeyActive = (key: string): boolean => {
    if (key === "←" || key === "A") return input.left;
    if (key === "→" || key === "D") return input.right;
    if (key === "↑" || key === "W") return input.jump;
    if (key === "↓" || key === "S") return input.fastFall;
    if (key === "SPACE") return input.float;
    if (key === "SHIFT") return input.superJump;
    return false;
  };

  // The order gate in markTutorialSubTask only accepts the next sub-task in
  // CONTROLS order; this index is the row the player is currently allowed to
  // complete. Rows past it are upcoming and dimmed.
  const currentIndex = subTasks.length;
  return (
    <div className="space-y-0">
      {CONTROLS.map((c, i) => {
        const done = subTasks.includes(c.subTaskId);
        const upcoming = i > currentIndex;
        return (
          <div
            key={i}
            className={`flex justify-between items-center py-2 transition-opacity ${
              i < CONTROLS.length - 1
                ? "border-b border-dashed border-[var(--surface-line)]"
                : ""
            } ${upcoming ? "opacity-30" : "opacity-100"}`}
          >
            <span
              className={`font-mono text-[11px] ${
                done ? "text-primary line-through" : "text-foreground"
              }`}
            >
              {c.description}
            </span>
            <div className="flex items-center gap-1">
              {c.keys.map((k, j) => (
                <React.Fragment key={`p-${j}`}>
                  <Kbd label={k} active={isKeyActive(k)} />
                  {j < c.keys.length - 1 && (
                    <span className="text-primary font-mono text-[10px]">
                      +
                    </span>
                  )}
                </React.Fragment>
              ))}
              {c.wasdKeys && (
                <>
                  <span className="text-[var(--foreground-dim)] font-mono text-[9px] mx-0.5">
                    /
                  </span>
                  {c.wasdKeys.map((k, j) => (
                    <React.Fragment key={`w-${j}`}>
                      <Kbd label={k} active={isKeyActive(k)} />
                      {j < c.wasdKeys!.length - 1 && (
                        <span className="text-primary font-mono text-[10px]">
                          +
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </>
              )}
              {done && <Check size={11} className="text-primary ml-1" />}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Kbd: React.FC<{ label: string; active: boolean }> = ({
  label,
  active,
}) => {
  const wide = label === "SPACE" || label === "SHIFT";
  return (
    <kbd
      className={`font-mono border rounded-sm px-1.5 py-0.5 text-[10px] text-center tracking-[.05em] transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-[var(--surface-raised)] border-[var(--surface-line)] text-foreground"
      } ${wide ? "min-w-[42px]" : "min-w-[20px]"}`}
    >
      {label}
    </kbd>
  );
};

const FoundingsContent: React.FC = () => {
  const foundings = useStateStore((s) => s.foundings);
  const correct = useStateStore((s) => s.correctOrderCount);
  const collected = foundings.filter((b) => b.isCollected).length;
  const total = foundings.length || 14;

  const hint =
    collected === 0
      ? "Plukk hvilken som helst finansiering"
      : "Følg den blinkende finansieringen";

  return (
    <div className="space-y-2">
      <p className="font-mono text-[11px] text-foreground leading-snug">
        {hint}
      </p>
      <div className="flex justify-between font-mono text-[11px] pt-1 border-t border-dashed border-[var(--surface-line)]">
        <span className="text-[var(--foreground-dim)]">Plukket</span>
        <span className="text-foreground">
          {collected}/{total}
        </span>
      </div>
      <div className="flex justify-between font-mono text-[11px]">
        <span className="text-[var(--foreground-dim)]">Riktig rekkefølge</span>
        <span className="text-primary">
          {correct}/{total}
        </span>
      </div>
    </div>
  );
};

const SurviveContent: React.FC = () => {
  const tutorialMission = useStateStore((s) => s.tutorialMission);
  const [remaining, setRemaining] = useState<number>(0);
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    if (!tutorialMission) return;
    const m = TUTORIAL_MISSIONS[tutorialMission];
    const total = m.surviveDurationMs ?? 30000;
    const id = setInterval(() => {
      setRemaining(Math.max(0, total - (Date.now() - startedAt)));
    }, 100);
    setRemaining(total);
    return () => clearInterval(id);
  }, [tutorialMission, startedAt]);

  const seconds = (remaining / 1000).toFixed(1);

  return (
    <div className="text-center space-y-1">
      <div className="font-pixel text-3xl text-primary tabular-nums tracking-wide">
        {seconds}s
      </div>
      <p className="font-mono text-[10px] text-[var(--foreground-dim)] leading-snug">
        Hold deg unna byråkratene.
        <br />
        Lykke til.
      </p>
    </div>
  );
};

const KillContent: React.FC = () => {
  const activeIndex = useStateStore((s) => s.tutorialActivePcoinIndex);
  return (
    <div className="space-y-1.5">
      <p className="font-mono text-[10px] text-[var(--foreground-dim)] leading-snug mb-1">
        Mynten skifter farge — vent på den verdifulle.
      </p>
      {P_COIN_TUTORIAL_INFO.map((c, i) => {
        const active = activeIndex === i;
        return (
          <div
            key={i}
            className={`flex justify-between items-center text-[11px] font-mono px-1.5 py-0.5 rounded-sm transition-colors ${
              active ? "bg-primary/15 ring-1 ring-primary/60" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full border border-black/20"
                style={{ backgroundColor: c.color }}
              />
              <span
                className={
                  active ? "text-primary font-semibold" : "text-foreground"
                }
              >
                {c.label}
              </span>
            </div>
            <span
              className={`tabular-nums ${
                active ? "text-primary" : "text-[var(--foreground-dim)]"
              }`}
            >
              {c.durationLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
};
