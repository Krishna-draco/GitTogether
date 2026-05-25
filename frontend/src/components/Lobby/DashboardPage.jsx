import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Header } from "../Common/Header";
import { Notification } from "../Common/Notification";
import { apiService } from "../../services/api";
import { Plus, LogIn } from "lucide-react";
import "../../styles/dashboard.css";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleCreateRoom = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.createRoom();
      const { roomId } = response.data;
      setSuccess("Room created! Redirecting...");
      setTimeout(() => navigate(`/lobby/${roomId}`), 1500);
    } catch (err) {
      setError("Failed to create room. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setError("Please enter a room code");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.getRoomState(joinCode);
      if (response.data && response.data.room) {
        setSuccess("Joining room...");
        setTimeout(() => navigate(`/lobby/${joinCode}`), 1500);
      } else {
        setError("Room not found. Please check the code.");
      }
    } catch (err) {
      setError("Room not found. Please check the code.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <Header title="DevDuel - Dashboard" />

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>Welcome, {user?.login}!</h2>
          <p>Ready to master Git conflicts?</p>
        </div>

        <div className="dashboard-grid">
          {/* Create Room Panel */}
          <div className="dashboard-card create-card">
            <div className="card-icon">
              <Plus size={40} />
            </div>
            <h3>Create Room</h3>
            <p>Start a new conflict resolution duel with a friend</p>
            <button
              className="card-button"
              onClick={handleCreateRoom}
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Initialize Mock Repository Session"}
            </button>
          </div>

          {/* Join Room Panel */}
          <div className="dashboard-card join-card">
            <div className="card-icon">
              <LogIn size={40} />
            </div>
            <h3>Join Room</h3>
            <p>Enter a room code to join an existing duel</p>
            <form onSubmit={handleJoinRoom} className="join-form">
              <input
                type="text"
                placeholder="Enter room code..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                disabled={isLoading}
                maxLength="20"
              />
              <button
                type="submit"
                className="card-button"
                disabled={isLoading || !joinCode.trim()}
              >
                {isLoading ? "Joining..." : "Enter Room Code"}
              </button>
            </form>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <h4>Total Players</h4>
            <p>Join the Community</p>
          </div>
          <div className="stat-card">
            <h4>Duels Completed</h4>
            <p>Show Your Skills</p>
          </div>
          <div className="stat-card">
            <h4>Your Status</h4>
            <p>Ready to Duel</p>
          </div>
        </div>
      </div>

      {error && (
        <Notification
          type="error"
          title="Error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {success && (
        <Notification
          type="success"
          title="Success"
          message={success}
          onClose={() => setSuccess(null)}
        />
      )}
    </div>
  );
};
