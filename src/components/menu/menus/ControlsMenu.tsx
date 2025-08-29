import { Button } from "@/components/ui/button";
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
      isCombination: false,
    },
    {
      keys: ["↑"],
      wasdKeys: ["W"],
      description: "Hopp",
      isCombination: false,
    },
    {
      keys: ["SPACE"],
      description: "Flytemodus (Hold)",
      isCombination: false,
    },
    {
      keys: ["↑", "SHIFT"],
      wasdKeys: ["W", "SHIFT"],
      description: "Super hopp",
      isCombination: true,
    },
    {
      keys: ["↓"],
      wasdKeys: ["S"],
      description: "Rask fall",
      isCombination: false,
    },
  ];

  const goBack = () => {
    // Use centralized close settings transition
    gameStateManager?.closeNestedMenu();
  };

  return (
    <div className="flex flex-col justify-center h-full w-[80%]">
      <div className="flex items-center mb-6 gap-2">
        <Button
          onClick={goBack}
          variant="default"
          className="bg-primary hover:bg-primary-dark text-white w-10 h-10"
        >
          <ArrowLeft size={25} />
        </Button>
        <h2 className="text-2xl font-bold text-white uppercase">Kontroller</h2>
      </div>

      <div className=" space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {controls.map((control, index) => (
            <div
              key={index}
              className="bg-card rounded-lg p-4 border border-white/20"
            >
              <p className="text-white text-sm text-center mb-3">
                {control.description}
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="flex gap-2">
                  {control.wasdKeys && (
                    <>
                      {control.wasdKeys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className="px-2 py-1 bg-white/10 text-white rounded border border-white/20 text-sm font-mono"
                        >
                          {key}
                        </kbd>
                      ))}
                      <span className="text-white/60 mx-2">eller</span>
                    </>
                  )}
                  {control.keys.map((key, keyIndex) => (
                    <kbd
                      key={keyIndex}
                      className="px-2 py-1 bg-white/10 text-white rounded border border-white/20 text-sm font-mono"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ControlsMenu;
