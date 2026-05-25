import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { AuthProvider } from "./context/AuthContext";
import { GameProvider } from "./context/GameContext";
import { SocketProvider } from "./context/SocketContext";
import { socketService } from "./services/socketService";
import { AuthPage } from "./components/Auth/AuthPage";
import { DashboardPage } from "./components/Lobby/DashboardPage";
import { LobbyPage } from "./components/Lobby/LobbyPage";
import { GameplayPage } from "./components/Gameplay/GameplayPage";
import { SuccessPage } from "./components/Success/SuccessPage";
import "./App.css";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppContent() {
  const { restoreToken, isAuthenticated } = useAuth();

  useEffect(() => {
    restoreToken();
  }, [restoreToken]);

  // Initialize socket when authenticated and attach token
  useEffect(() => {
    const init = async () => {
      if (isAuthenticated) {
        socketService.connect();
        try {
          const token = localStorage.getItem("authToken");
          if (token) {
            const m = await import("./services/socketAuth");
            m.attachAuthToken(token);
          }
        } catch (err) {
          // ignore
        }
      } else {
        // if not authenticated, ensure socket disconnected
        try {
          socketService.disconnect();
        } catch (e) {}
      }
    };

    init();

    return () => {
      // no-op cleanup here
    };
  }, [isAuthenticated]);

  const socket = socketService.getSocket();

  return (
    <SocketProvider socket={socket}>
      <GameProvider>
        <Routes>
          {/* Auth */}
          <Route path="/" element={<AuthPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lobby/:roomId"
            element={
              <ProtectedRoute>
                <LobbyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game/:roomId"
            element={
              <ProtectedRoute>
                <GameplayPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/success/:roomId"
            element={
              <ProtectedRoute>
                <SuccessPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </GameProvider>
    </SocketProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
