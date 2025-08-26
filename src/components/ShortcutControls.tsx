const ShortcutControls = () => {
  return (
    <div className="absolute bottom-2 left-30 right-30 p-2">
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-1">
          <span className="font-bold text-white rounded-md flex items-center justify-center text-lg">
            F
          </span>
          <span className="text-foreground">- Fullskjerm toggle</span>
        </div>
        <div className="w-[1px] h-10 bg-gray-500" />
        <div className="flex items-center gap-2">
          <span className="font-bold text-white rounded-md flex items-center  justify-center text-lg">
            P
          </span>
          <span className="text-foreground">- Pause toggle</span>
        </div>
        <div className="w-[1px] h-10 bg-gray-500" />
        <div className="flex items-center gap-2">
          <span className="font-bold text-white rounded-md flex items-center  justify-center text-lg">
            M
          </span>
          <span className="text-foreground">- Mute toggle</span>
        </div>
      </div>
    </div>
  );
};

export default ShortcutControls;
