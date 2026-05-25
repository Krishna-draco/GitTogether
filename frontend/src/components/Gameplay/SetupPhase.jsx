import React, { useState, useRef, useEffect } from "react";
import { useGameState } from "../../hooks/useGameState";
import { useSocketEmit } from "../../hooks/useSocket";
import { FileTree } from "./FileTree";
import { MissionBriefing } from "./MissionBriefing";
import { MonacoEditorWrapper } from "./MonacoEditorWrapper";
import { CommitButton } from "./CommitButton";
import { FILE_TEMPLATES } from "../../utils/constants";
import "../../styles/setup-phase.css";

export const SetupPhase = () => {
  const { playerSlot, baseContent, setContent, updateLiveResolvedCode } =
    useGameState();
  const emit = useSocketEmit();
  const editorRef = useRef(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalContent, setOriginalContent] = useState(baseContent);
  const [isCommitting, setIsCommitting] = useState(false);

  useEffect(() => {
    if (baseContent) {
      setOriginalContent(baseContent);
      updateLiveResolvedCode(baseContent);
    }
  }, [baseContent, updateLiveResolvedCode]);

  const handleEditorChange = (value) => {
    updateLiveResolvedCode(value);
    setHasChanges(value !== originalContent);
  };

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  const handleCommit = () => {
    setIsCommitting(true);

    const editorContent = editorRef.current?.getValue() || "";

    // Backend expects { content }
    emit(
      "SUBMIT_BRANCH_COMMIT",
      {
        content: editorContent,
      },
      (res) => {
        if (res && !res.success && res.error) {
          // handle error (could show notification)
          console.error("Commit error:", res.error);
        }
      },
    );

    // Lock editor
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly: true });
    }

    setTimeout(() => {
      setIsCommitting(false);
    }, 1000);
  };

  return (
    <div className="setup-phase-container">
      <div className="setup-layout">
        {/* Left Sidebar - File Tree */}
        <div className="setup-sidebar">
          <FileTree />
        </div>

        {/* Center - Monaco Editor */}
        <div className="setup-editor">
          <div className="editor-header">
            <h3>server.js</h3>
            <span className="file-status">Editing...</span>
          </div>
          <MonacoEditorWrapper
            value={baseContent}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            language="javascript"
            readOnly={false}
            height="100%"
          />
        </div>

        {/* Right Sidebar - Mission Briefing */}
        <div className="setup-briefing">
          <MissionBriefing playerSlot={playerSlot} />
        </div>
      </div>

      {/* Bottom - Commit Button */}
      <div className="setup-footer">
        <CommitButton
          onClick={handleCommit}
          isLoading={isCommitting}
          hasChanges={hasChanges}
        />
      </div>
    </div>
  );
};
