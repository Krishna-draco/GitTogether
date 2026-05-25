import React from "react";
import { AlertCircle } from "lucide-react";
import { MISSION_TASKS, PLAYER_SLOTS } from "../../utils/constants";
import "../../styles/mission.css";

export const MissionBriefing = ({ playerSlot }) => {
  const taskText =
    playerSlot === PLAYER_SLOTS.ALPHA
      ? MISSION_TASKS.alpha
      : MISSION_TASKS.beta;

  const slotLabel = playerSlot === PLAYER_SLOTS.ALPHA ? "Alpha" : "Beta";
  const slotColor = playerSlot === PLAYER_SLOTS.ALPHA ? "#ff6b6b" : "#4ecdc4";

  return (
    <div className="mission-briefing">
      <div className="mission-header" style={{ borderLeftColor: slotColor }}>
        <h3>Mission Briefing</h3>
        <span className="slot-badge" style={{ backgroundColor: slotColor }}>
          {slotLabel} Developer
        </span>
      </div>

      <div className="mission-content">
        <div className="mission-task">
          <AlertCircle size={20} />
          <p>{taskText}</p>
        </div>

        <div className="mission-rules">
          <h4>Rules</h4>
          <ul>
            <li>Edit only your assigned repository section</li>
            <li>Commit when your changes are complete</li>
            <li>No communicating during the edit phase</li>
            <li>You have up to 5 minutes to complete edits</li>
          </ul>
        </div>

        <div className="mission-tips">
          <h4>Tips</h4>
          <ul>
            <li>Make your changes clear and intentional</li>
            <li>Test your modifications if possible</li>
            <li>Use descriptive variable names</li>
            <li>Comment your code when needed</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
