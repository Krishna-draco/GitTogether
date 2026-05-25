import React, { useRef, useEffect, useState } from "react";
import { useGameState } from "../../hooks/useGameState";
import { useSocketEmit } from "../../hooks/useSocket";
import { MonacoEditorWrapper } from "./MonacoEditorWrapper";
import { CodeLensActions } from "./CodeLensActions";
import { findConflictMarkers } from "../../utils/helpers";
import "../../styles/conflict-mode.css";

export const ConflictMode = () => {
  const { liveResolvedCode, updateLiveResolvedCode, playerSlot } =
    useGameState();
  const emit = useSocketEmit();
  const centerEditorRef = useRef(null);
  const [conflicts, setConflicts] = useState([]);
  const [selectedAction, setSelectedAction] = useState(null);

  useEffect(() => {
    const markers = findConflictMarkers(liveResolvedCode);
    setConflicts(markers);
  }, [liveResolvedCode]);

  const handleCenterEditorChange = (value) => {
    updateLiveResolvedCode(value);
  };

  const handleAction = (action, conflictIndex) => {
    setSelectedAction({ action, conflictIndex });
    // Backend expects { fullText, delta? } — send full document
    emit(
      "SYNC_WORKSPACE_EDIT",
      {
        fullText: liveResolvedCode,
      },
      (res) => {
        if (res && !res.success && res.error) {
          console.error("Sync error:", res.error);
        }
      },
    );
  };

  const handleCenterEditorMount = (editor, monaco) => {
    centerEditorRef.current = editor;
  };

  return (
    <div className="conflict-mode-container">
      <div className="conflict-layout">
        {/* Alpha Panel (Read-only) */}
        <div className="conflict-panel alpha-panel">
          <div className="panel-header">
            <h3>Alpha's Changes</h3>
            <span className="panel-label alpha">Read-only</span>
          </div>
          <MonacoEditorWrapper
            value={liveResolvedCode}
            onChange={() => {}}
            readOnly={true}
            language="javascript"
            height="100%"
            className="tint-alpha"
            options={{ scrollBeyondLastLine: false }}
          />
        </div>

        {/* Center Panel (Interactive) */}
        <div className="conflict-panel center-panel">
          <div className="panel-header">
            <h3>Merge Resolution</h3>
            <span className="panel-label center">Interactive</span>
          </div>
          <div className="center-editor-wrapper">
            <MonacoEditorWrapper
              value={liveResolvedCode}
              onChange={handleCenterEditorChange}
              onMount={handleCenterEditorMount}
              readOnly={false}
              language="javascript"
              height="100%"
              options={{ scrollBeyondLastLine: false }}
            />

            {/* Code Lens Actions */}
            {conflicts.length > 0 && (
              <div className="code-lens-container">
                {conflicts.map((conflict, idx) => (
                  <div
                    key={idx}
                    className="code-lens-line"
                    style={{ top: `${(conflict.startLine + 2) * 20}px` }}
                  >
                    <CodeLensActions
                      onAction={(action) => handleAction(action, idx)}
                      line={conflict.startLine}
                      availableActions={[
                        "accept-alpha",
                        "accept-beta",
                        "blend-both",
                      ]}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Beta Panel (Read-only) */}
        <div className="conflict-panel beta-panel">
          <div className="panel-header">
            <h3>Beta's Changes</h3>
            <span className="panel-label beta">Read-only</span>
          </div>
          <MonacoEditorWrapper
            value={liveResolvedCode}
            onChange={() => {}}
            readOnly={true}
            language="javascript"
            height="100%"
            className="tint-beta"
            options={{ scrollBeyondLastLine: false }}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="conflict-status-bar">
        <span className="conflict-count">
          {conflicts.length > 0
            ? `${conflicts.length} conflict${conflicts.length !== 1 ? "s" : ""} found`
            : "No conflicts"}
        </span>
        {selectedAction && (
          <span className="action-feedback">
            {selectedAction.action} applied to conflict #
            {selectedAction.conflictIndex + 1}
          </span>
        )}
      </div>
    </div>
  );
};
