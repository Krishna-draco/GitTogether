import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGameState } from "../../hooks/useGameState";
import { useSocketEvent, useSocketEmit } from "../../hooks/useSocket";
import { Header } from "../Common/Header";
import { SetupPhase } from "./SetupPhase";
import { ConflictMode } from "./ConflictMode";
import { ChatPanel } from "./ChatPanel";
import { Notification, ErrorBanner } from "../Common/Notification";
import { GAME_PHASES } from "../../utils/constants";
import "../../styles/gameplay.css";

export const GameplayPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const {
    currentPhase,
    updatePhase,
    setContent,
    setRoomState,
    addChatMessage,
    verificationResult,
    setVerificationResult,
    chatMessages,
    startTime,
  } = useGameState();
  const emit = useSocketEmit();
  const [verificationErrors, setVerificationErrors] = useState([]);
  const [showErrorBanner, setShowErrorBanner] = useState(false);

  // Listen for phase transitions
  useSocketEvent("ROOM_STATE_TRANSITION", (data) => {
    if (!data) return;
    if (data.payload) setRoomState(data.payload);
    if (data.phase) updatePhase(data.phase);
  });

  // Listen for content updates
  useSocketEvent("WORKSPACE_UPDATED", (data) => {
    // Backend sends { fullText, updatedBy, timestamp }
    if (data && data.fullText) {
      // Update live resolved code
      setContent({ liveResolvedCode: data.fullText });
    }
  });

  // Listen for chat messages
  useSocketEvent("CHAT_MESSAGE", (message) => {
    addChatMessage(message);
  });

  // Listen for verification results
  useSocketEvent("VERIFICATION_RESULT", (result) => {
    setVerificationResult(result);

    if (!result.success) {
      setVerificationErrors(result.errors || []);
      setShowErrorBanner(true);
    } else {
      // Transition to success screen
      setTimeout(() => {
        navigate(`/success/${roomId}`);
      }, 2000);
    }
  });

  const handleSendMessage = (message) => {
    emit("CHAT_MESSAGE", {
      roomId,
      content: message,
      timestamp: Date.now(),
    });

    addChatMessage({
      content: message,
      username: "You",
      timestamp: Date.now(),
      type: "message",
    });
  };

  const handleVerify = () => {
    emit("REQUEST_MERGE_VERIFICATION", { roomId });
  };

  const renderPhaseContent = () => {
    switch (currentPhase) {
      case GAME_PHASES.EDIT_PHASE:
        return <SetupPhase />;
      case GAME_PHASES.CONFLICT_MODE:
        return <ConflictMode />;
      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <div className="gameplay-page">
      <Header title={`DevDuel - ${currentPhase.replace("_", " ")}`} />

      <div className="gameplay-container">
        <div className="gameplay-main">{renderPhaseContent()}</div>

        {/* Verify Button for Conflict Mode */}
        {currentPhase === GAME_PHASES.CONFLICT_MODE && (
          <div className="gameplay-verify">
            <button className="verify-button" onClick={handleVerify}>
              Verify Integrity & Push Merge Commit
            </button>
          </div>
        )}

        {/* Chat Panel */}
        <ChatPanel
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          playerUsername="You"
        />

        {/* Error Banner */}
        {showErrorBanner && verificationErrors.length > 0 && (
          <ErrorBanner
            errors={verificationErrors}
            onClose={() => setShowErrorBanner(false)}
          />
        )}
      </div>
    </div>
  );
};
