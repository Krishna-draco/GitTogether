import React, { useState } from "react";
import { GitBranch, Loader } from "lucide-react";
import "../../styles/buttons.css";

export const CommitButton = ({
  onClick,
  isLoading = false,
  disabled = false,
  hasChanges = true,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = () => {
    if (showConfirm) {
      onClick?.();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
    }
  };

  return (
    <div className="commit-button-wrapper">
      <button
        className={`commit-button ${isLoading ? "loading" : ""} ${!hasChanges ? "disabled" : ""}`}
        onClick={handleClick}
        disabled={isLoading || disabled || !hasChanges}
      >
        {isLoading ? (
          <>
            <Loader size={18} className="spin" />
            <span>Committing...</span>
          </>
        ) : (
          <>
            <GitBranch size={18} />
            <span>
              {showConfirm
                ? "Confirm Commit?"
                : "Stage Changes & Commit Branch"}
            </span>
          </>
        )}
      </button>

      {showConfirm && (
        <div className="commit-warning">
          <p>
            Are you sure? This will lock your editor and submit your changes.
          </p>
          <button className="confirm-no" onClick={() => setShowConfirm(false)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
