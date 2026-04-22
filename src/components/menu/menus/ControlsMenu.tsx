import { Button } from "@/components/ui/button";
import { PixelBezel } from "@/components/ui/pixel-bezel";
import { ArrowLeft } from "lucide-react";
import React from "react";
import { useStateStore } from "../../../stores/gameStore";

const ControlsMenu = () => {
  const { gameStateManager } = useStateStore.getState();

  const controls = [
    {
      keys: ["←", "→"],
      wasdKeys: ["A", "D"],
      description: "Beveg deg sidelengs",
    },
    {
      keys: ["↑"],
      wasdKeys: ["W"],
      description: "Hopp",
    },
    {
      keys: ["SPACE"],
      description: "Flytemodus (Hold)",
    },
    {
      keys: ["↑", "SHIFT"],
      wasdKeys: ["W", "SHIFT"],
      description: "Super hopp",
    },
    {
      keys: ["↓"],
      wasdKeys: ["S"],
      description: "Rask fall",
    },
  ];

  const goBack = () => {
    gameStateManager?.closeNestedMenu();
  };

  return (
    <div className="flex flex-col justify-center h-full w-[80%]">
      <div className="flex items-center mb-6 gap-3">
        <Button
          onClick={goBack}
          variant="outline"
          size="icon"
          className="text-foreground hover:text-primary"
        >
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-2xl font-pixel text-foreground tracking-wide uppercase">
          Kontroller
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {controls.map((control, index) => (
          <PixelBezel key={index} className="p-4">
            <p className="text-foreground text-sm text-center mb-3 font-mono">
              {control.description}
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="flex gap-2 items-center">
                {control.wasdKeys && (
                  <>
                    {control.wasdKeys.map((key, keyIndex) => (
                      <kbd
                        key={keyIndex}
                        className="px-2 py-1 bg-[var(--surface-raised)] text-foreground rounded-sm border border-[var(--surface-line)] border-b-[3px] text-sm font-pixel tracking-wide min-w-[30px] text-center"
                      >
                        {key}
                      </kbd>
                    ))}
                    <span className="text-[var(--foreground-dim)] text-xs mx-1">eller</span>
                  </>
                )}
                {control.keys.map((key, keyIndex) => (
                  <kbd
                    key={keyIndex}
                    className="px-2 py-1 bg-[var(--surface-raised)] text-foreground rounded-sm border border-[var(--surface-line)] border-b-[3px] text-sm font-pixel tracking-wide min-w-[30px] text-center"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          </PixelBezel>
        ))}
      </div>
    </div>
  );
};

export default ControlsMenu;
