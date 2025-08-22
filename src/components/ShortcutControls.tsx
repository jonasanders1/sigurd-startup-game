const ShortcutControls = () => {
  return (
    <div className="absolute bottom-2 left-30 right-30 p-2">
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="bg-secondary font-bold border border-secondary-light text-white rounded-md px-2 w-8 h-8 flex items-center justify-center">
            F
          </span>
          <span className="font-medium text-foreground">Fullskjerm toggle</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-secondary font-bold border border-secondary-light text-white rounded-md px-2 w-8 h-8 flex items-center justify-center">
            P
          </span>
          <span className="font-medium text-foreground">Pause toggle</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-secondary font-bold border border-secondary-light text-white rounded-md px-2 w-8 h-8 flex items-center justify-center">
            M
          </span>
          <span className="font-medium text-foreground">Mute toggle</span>
        </div>
      </div>
    </div>
  );
};

export default ShortcutControls;
