import React from "react";
import { Clock, MessageSquare, Edit3, Trophy } from "lucide-react";
import { formatElapsedTime } from "../../utils/helpers";
import "../../styles/metrics.css";

export const CompletionMetrics = ({
  startTime,
  messageCount = 0,
  alphaChanges = 0,
  betaChanges = 0,
}) => {
  const elapsedTime = formatElapsedTime(startTime);

  const metrics = [
    {
      icon: Clock,
      label: "Elapsed Time",
      value: elapsedTime,
      color: "#00ff88",
    },
    {
      icon: MessageSquare,
      label: "Messages",
      value: messageCount,
      color: "#4ecdc4",
    },
    {
      icon: Edit3,
      label: "Alpha Changes",
      value: alphaChanges,
      color: "#ff6b6b",
    },
    {
      icon: Edit3,
      label: "Beta Changes",
      value: betaChanges,
      color: "#4ecdc4",
    },
  ];

  return (
    <div className="completion-metrics">
      <div className="metrics-header">
        <Trophy size={24} />
        <h3>Completion Statistics</h3>
      </div>

      <div className="metrics-grid">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div key={idx} className="metric-card">
              <div className="metric-icon" style={{ color: metric.color }}>
                <Icon size={24} />
              </div>
              <div className="metric-content">
                <div className="metric-label">{metric.label}</div>
                <div className="metric-value">{metric.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="metrics-summary">
        <p>Great job! You've successfully resolved a merge conflict.</p>
      </div>
    </div>
  );
};
