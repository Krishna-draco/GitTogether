import React from "react";
import { User, Loader } from "lucide-react";
import "../../styles/playersloots.css";

export const PlayerSlots = ({ alphaPlayer, betaPlayer, currentPlayerSlot }) => {
  const renderPlayerSlot = (player, slot) => {
    const isWaiting = !player;
    const isCurrentPlayer = currentPlayerSlot === slot;

    return (
      <div
        className={`player-slot ${slot} ${isWaiting ? "waiting" : "filled"}`}
      >
        <div className="slot-content">
          {player ? (
            <>
              <img
                src={player.avatar_url}
                alt={player.login}
                className="player-avatar"
              />
              <div className="player-info">
                <h4>{player.login}</h4>
                <span className={`slot-label ${slot}`}>
                  {slot.charAt(0).toUpperCase() + slot.slice(1)} Developer
                </span>
                {isCurrentPlayer && <span className="current-badge">YOU</span>}
              </div>
              <div className="player-status">
                <span className="status-dot active"></span>
                <span className="status-text">Connected</span>
              </div>
            </>
          ) : (
            <>
              <div className="placeholder-avatar">
                <User size={40} />
              </div>
              <div className="player-info">
                <h4>
                  {slot.charAt(0).toUpperCase() + slot.slice(1)} Developer
                </h4>
                <span className="waiting-text">
                  <Loader size={14} className="spin" />
                  Waiting for player...
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="player-slots">
      <div className="slots-container">
        {renderPlayerSlot(alphaPlayer, "alpha")}
        <div className="slots-divider">
          <span>vs</span>
        </div>
        {renderPlayerSlot(betaPlayer, "beta")}
      </div>
    </div>
  );
};
