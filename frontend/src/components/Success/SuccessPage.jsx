import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGameState } from "../../hooks/useGameState";
import { Header } from "../Common/Header";
import { GitDAGVisualization } from "./GitDAGVisualization";
import { CompletionMetrics } from "./CompletionMetrics";
import { Trophy, Home, Share2 } from "lucide-react";
import { apiService } from "../../services/api";
import "../../styles/success.css";

export const SuccessPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { roomState, startTime, chatMessages } = useGameState();
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const alphaPlayer = roomState?.players?.alpha;
  const betaPlayer = roomState?.players?.beta;
  const alphaChanges = roomState?.alphaContent?.length || 0;
  const betaChanges = roomState?.betaContent?.length || 0;

  const handlePlayAgain = () => {
    navigate("/dashboard");
  };

  const handleShare = async () => {
    const text = `I just completed a DevDuel! Check out my merge conflict resolution skills! 🚀`;

    if (navigator.share) {
      navigator.share({
        title: "DevDuel - Master Git Conflicts",
        text,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(text);
      alert("Share text copied to clipboard!");
    }
  };

  return (
    <div className="success-page">
      <Header title="Success!" showUserInfo={true} />

      <div className="success-container">
        <div className="success-header">
          <Trophy size={60} className="trophy-icon" />
          <h1>Merge Successful!</h1>
          <p>You've successfully resolved the Git conflict!</p>
        </div>

        {/* Git DAG Visualization */}
        <div className="success-dag">
          <GitDAGVisualization
            alphaPlayer={alphaPlayer}
            betaPlayer={betaPlayer}
            timestamp={Date.now()}
          />
        </div>

        {/* Completion Metrics */}
        <div className="success-metrics">
          <CompletionMetrics
            startTime={startTime}
            messageCount={chatMessages.length}
            alphaChanges={alphaChanges}
            betaChanges={betaChanges}
          />
        </div>

        {/* Action Buttons */}
        <div className="success-actions">
          <button
            className="action-button play-again"
            onClick={handlePlayAgain}
          >
            <Home size={20} />
            Return to Dashboard
          </button>
          <button className="action-button share" onClick={handleShare}>
            <Share2 size={20} />
            Share Achievement
          </button>
        </div>

        {/* Celebration Background */}
        <div className="success-celebration">
          <div className="confetti"></div>
        </div>
      </div>
    </div>
  );
};
