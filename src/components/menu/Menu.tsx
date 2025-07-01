import React from "react";

const Menu = ({
  children,
  transparent,
}: {
  children: React.ReactNode;
  transparent?: boolean;
}) => {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center z-50 ${
        transparent ? "bg-transparent" : "bg-menu backdrop-blur-sm"
      }`}
    >
      {children}
    </div>
  );
};

export default Menu;
