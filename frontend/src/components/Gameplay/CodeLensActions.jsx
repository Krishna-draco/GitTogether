import React from "react";
import { Check } from "lucide-react";
import "../../styles/codelens.css";

export const CodeLensActions = ({ onAction, line, availableActions = [] }) => {
  return (
    <div className="code-lens-actions">
      {availableActions.includes("accept-alpha") && (
        <button
          className="action-button alpha"
          onClick={() => onAction("accept-alpha", line)}
          title="Accept Alpha's Changes"
        >
          <Check size={14} />
          Accept Alpha
        </button>
      )}

      {availableActions.includes("accept-beta") && (
        <button
          className="action-button beta"
          onClick={() => onAction("accept-beta", line)}
          title="Accept Beta's Changes"
        >
          <Check size={14} />
          Accept Beta
        </button>
      )}

      {availableActions.includes("blend-both") && (
        <button
          className="action-button blend"
          onClick={() => onAction("blend-both", line)}
          title="Blend Both Changes"
        >
          <Check size={14} />
          Blend Both
        </button>
      )}
    </div>
  );
};
