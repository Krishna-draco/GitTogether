import React from "react";
import "../../styles/dag.css";

export const GitDAGVisualization = ({
  alphaPlayer,
  betaPlayer,
  mergedBy,
  timestamp,
}) => {
  return (
    <div className="git-dag">
      <h3>Merge Timeline</h3>

      <svg viewBox="0 0 400 300" className="dag-svg">
        {/* Base commit */}
        <circle cx="200" cy="50" r="20" className="commit-node base" />
        <text x="200" y="55" textAnchor="middle" className="commit-label">
          C1 Base
        </text>

        {/* Branch lines */}
        <line
          x1="200"
          y1="70"
          x2="150"
          y2="120"
          className="branch-line alpha"
          strokeWidth="2"
        />
        <line
          x1="200"
          y1="70"
          x2="250"
          y2="120"
          className="branch-line beta"
          strokeWidth="2"
        />

        {/* Alpha commit */}
        <circle cx="150" cy="150" r="20" className="commit-node alpha" />
        <text x="150" y="155" textAnchor="middle" className="commit-label">
          Alpha
        </text>

        {/* Beta commit */}
        <circle cx="250" cy="150" r="20" className="commit-node beta" />
        <text x="250" y="155" textAnchor="middle" className="commit-label">
          Beta
        </text>

        {/* Merge lines */}
        <line
          x1="150"
          y1="170"
          x2="200"
          y2="210"
          className="merge-line"
          strokeWidth="2"
        />
        <line
          x1="250"
          y1="170"
          x2="200"
          y2="210"
          className="merge-line"
          strokeWidth="2"
        />

        {/* Merge commit */}
        <circle cx="200" cy="240" r="20" className="commit-node merge" />
        <text x="200" y="245" textAnchor="middle" className="commit-label">
          M1 Merge
        </text>
      </svg>

      <div className="dag-info">
        <div className="info-row">
          <span className="info-label">Alpha Developer:</span>
          <span className="info-value">{alphaPlayer?.login || "Player 1"}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Beta Developer:</span>
          <span className="info-value">{betaPlayer?.login || "Player 2"}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Merged by:</span>
          <span className="info-value">{mergedBy || "System"}</span>
        </div>
        {timestamp && (
          <div className="info-row">
            <span className="info-label">Completed at:</span>
            <span className="info-value">
              {new Date(timestamp).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
