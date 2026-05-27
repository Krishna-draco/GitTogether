import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Plus, ArrowRight, User, Terminal } from 'lucide-react';

export const RoomSelector = ({ onCreateRoom, onJoinRoom }) => {
  const { user, logout } = useAuth();
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinError, setJoinError] = useState('');

  const handleCreate = () => {
    // Generate a random 8-character Room ID (e.g., "G-XXXXXX")
    const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const formattedId = `ROOM-${randomId}`;
    onCreateRoom(formattedId);
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    setJoinError('');

    if (!joinRoomId.trim()) {
      setJoinError('Please enter a valid Room ID');
      return;
    }

    onJoinRoom(joinRoomId.trim().toUpperCase());
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Premium Dashboard Header */}
      <header
        className="glass-panel"
        style={{
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          borderRadius: '0 0 16px 16px',
          borderTop: 'none',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Terminal size={24} className="accent-text" />
          <h2 style={{ fontSize: '1.4rem' }}>
            <span className="accent-text">Git</span>Together
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--accent-glowing)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.95rem',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>{user.username}</span>
          </div>

          <button onClick={logout} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </header>

      {/* Hero Welcome & Rooms Selector Grid */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '48px', maxWidth: '600px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '16px', fontFamily: "'Outfit', sans-serif" }}>
            Welcome back, <span className="accent-text">{user.username}</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Enter a workspace room to solve git merge conflicts collaboratively, diff modifications side-by-side, and talk via voice/text in real-time.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '30px',
            width: '100%',
            maxWidth: '900px',
          }}
        >
          {/* Card 1: Create a Room */}
          <div className="glass-panel-glow" style={{ padding: '40px', display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
                marginBottom: '24px',
              }}
            >
              <Plus size={24} />
            </div>

            <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Start a New Workspace</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '32px', flex: 1, lineHeight: '1.5' }}>
              Spin up a fresh merge-conflict resolution room. You will get a unique room ID to share with your pair developer.
            </p>

            <button onClick={handleCreate} className="btn btn-primary" style={{ width: '100%' }}>
              Create Room Session
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Card 2: Join a Room */}
          <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-secondary)',
                marginBottom: '24px',
              }}
            >
              <ArrowRight size={24} />
            </div>

            <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Join Session Room</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px', flex: 1, lineHeight: '1.5' }}>
              Enter an existing active Room ID shared by your colleague to connect editors and open communication channels.
            </p>

            <form onSubmit={handleJoinSubmit} style={{ marginTop: 'auto' }}>
              {joinError && (
                <div className="auth-alert auth-alert-error" style={{ padding: '8px 12px', fontSize: '0.85rem', marginBottom: '12px' }}>
                  {joinError}
                </div>
              )}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., ROOM-A1B2C3D4"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  style={{ textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.05em' }}
                  required
                />
              </div>

              <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: '12px 24px' }}>
                Connect to Room
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoomSelector;
