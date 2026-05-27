import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import RoomSelector from './components/RoomSelector';
import Workspace from './components/Workspace';
import ErrorBoundary from './components/ErrorBoundary';
import { Loader2, Terminal, ArrowLeft } from 'lucide-react';

function App() {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'

  // Helper to extract room ID from URL parameters on reload
  const getRoomFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || null;
  };

  const [roomId, setRoomId] = useState(getRoomFromUrl());

  // Update browser address bar without reloading to persist room ID
  const updateRoomUrl = (id) => {
    const newUrl = id 
      ? `${window.location.pathname}?room=${id}` 
      : window.location.pathname;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleJoinRoom = (id) => {
    setRoomId(id);
    updateRoomUrl(id);
  };

  const handleLeaveRoom = () => {
    setRoomId(null);
    updateRoomUrl(null);
  };

  // 1. Show dynamic, premium loading indicator while checking cookies
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          gap: '16px',
        }}
      >
        <Loader2
          size={48}
          className="accent-text"
          style={{ animation: 'spin 1.5s infinite linear', color: 'var(--accent-primary)' }}
        />
        <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', fontWeight: 600 }}>
          Initializing GitTogether Session...
        </h3>
      </div>
    );
  }

  // 2. Unauthenticated flows (Protected Routes)
  if (!user) {
    return authView === 'login' ? (
      <Login onSwitchAuth={setAuthView} />
    ) : (
      <Register onSwitchAuth={setAuthView} />
    );
  }

  // 3. Authenticated - Workspace session joined
  if (roomId) {
    return (
      <ErrorBoundary>
        <Workspace
          roomId={roomId}
          onLeaveRoom={handleLeaveRoom}
        />
      </ErrorBoundary>
    );
  }

  // 4. Authenticated - Room selector dashboard
  return (
    <RoomSelector
      onCreateRoom={handleJoinRoom}
      onJoinRoom={handleJoinRoom}
    />
  );
}

export default App;
