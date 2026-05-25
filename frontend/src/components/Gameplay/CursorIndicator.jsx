import React, { useEffect, useState } from "react";
import "../../styles/cursor.css";

export const CursorIndicator = ({ username, position, color = "#4ecdc4" }) => {
  const [cursorStyle, setCursorStyle] = useState({});

  useEffect(() => {
    if (position) {
      // Position is calculated based on Monaco editor's view
      const top = position.top || 0;
      const left = position.left || 0;

      setCursorStyle({
        top: `${top}px`,
        left: `${left}px`,
        display: "block",
      });
    } else {
      setCursorStyle({ display: "none" });
    }
  }, [position]);

  return (
    <div className="cursor-indicator" style={cursorStyle}>
      <div className="cursor-line" style={{ backgroundColor: color }} />
      <div className="cursor-label" style={{ backgroundColor: color }}>
        <span>{username}</span>
      </div>
    </div>
  );
};
