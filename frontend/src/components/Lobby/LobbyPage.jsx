import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useGameState } from "../../hooks/useGameState";
import {
  useSocket,
  useSocketEmit,
  useSocketEvent,
} from "../../hooks/useSocket";
import { Header } from "../Common/Header";
import { PlayerSlots } from "./PlayerSlots";
import { Notification } from "../Common/Notification";
import { Play } from "lucide-react";
import { apiService } from "../../services/api";
import "../../styles/lobby.css";

export const LobbyPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    playerSlot,
    roomState,
    setRoomState,
    setPlayerSlot,
    setRoomId,
    startGame,
    updatePhase,
  } = useGameState();
  const emit = useSocketEmit();
  const socket = useSocket();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomCode, setRoomCode] = useState(roomId);

  // Fetch room state on mount
  useEffect(() => {
    const fetchRoomState = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getRoomState(roomId);
        const room =
          response.data && response.data.room ? response.data.room : null;
        if (!room) throw new Error("Room not found");
        setRoomState(room);
        setRoomId(roomId);

        // Determine player slot by checking socket occupancy
        if (!room.players.alpha?.socketId) {
          setPlayerSlot("alpha");
        } else if (!room.players.beta?.socketId) {
          setPlayerSlot("beta");
        }
      } catch (err) {
        setError("Failed to load room. Room may not exist or is full.");
        setTimeout(() => navigate("/dashboard"), 2000);
      } finally {
        setIsLoading(false);
      }
    };

    if (roomId) {
      fetchRoomState();
    }
  }, [roomId, navigate, setRoomState, setRoomId, setPlayerSlot]);

  // Join room via socket
  useEffect(() => {
    if (socket && roomId && playerSlot && user) {
      const username = user.login || user.name || user.username || user;

      // Provide callback to receive assigned slot and updated room state
      emit("JOIN_DUEL_ROOM", { roomId, username }, (res) => {
        if (res && res.success) {
          if (res.slot) setPlayerSlot(res.slot);
          if (res.roomState) setRoomState(res.roomState);
        } else if (res && res.error) {
          setError(res.error);
        }
      });
    }
  }, [socket, roomId, playerSlot, user, emit, setPlayerSlot, setRoomState]);

  // Listen for room state updates
  useSocketEvent("ROOM_UPDATED", (payload) => {
    // Backend emits { roomState, message }
    if (payload && payload.roomState) setRoomState(payload.roomState);
  });

  // Listen for game start
  useSocketEvent("ROOM_STATE_TRANSITION", (data) => {
    // Backend emits { phase, payload, message }
    if (!data) return;
    if (data.payload) setRoomState(data.payload);
    if (data.phase) updatePhase(data.phase);
    startGame();
    navigate(`/game/${roomId}`);
  });

  const handleStartGame = () => {
    if (playerSlot === "alpha" && roomState?.players?.beta) {
      emit("START_EDIT_PHASE", { roomId });
    }
  };

  const bothPlayersJoined =
    roomState?.players?.alpha && roomState?.players?.beta;

  return (
    <div className="lobby-page">
      <Header title="Lobby" showUserInfo={true} />

      <div className="lobby-container">
        <div className="lobby-header">
          <h2>Room: {roomCode}</h2>
          <p>Waiting for players to join...</p>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading room...</p>
          </div>
        ) : (
          <>
            {/* Player Slots */}
            <PlayerSlots
              alphaPlayer={roomState?.players?.alpha}
              betaPlayer={roomState?.players?.beta}
              currentPlayerSlot={playerSlot}
            />

            {/* Ready to Start */}
            {bothPlayersJoined && (
              <div className="lobby-ready">
                <div className="ready-message">
                  <h3>All Players Connected!</h3>
                  <p>You can now launch the simulation</p>
                </div>
                {playerSlot === "alpha" && (
                  <button className="launch-button" onClick={handleStartGame}>
                    <Play size={20} />
                    Launch Simulation
                  </button>
                )}
              </div>
            )}

            {/* Room Code Share */}
            <div className="room-share">
              <p>Share this code with your opponent:</p>
              <div className="room-code-display">
                <code>{roomCode}</code>
                <button
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(roomCode);
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          </>
        )}

        {error && (
          <Notification
            type="error"
            title="Error"
            message={error}
            onClose={() => setError(null)}
          />
        )}
      </div>
    </div>
  );
};
