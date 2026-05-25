import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { LogOut } from "lucide-react";
import "../../styles/header.css";

export const Header = ({ title, showUserInfo = true }) => {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-title">
          <h1>{title || "DevDuel"}</h1>
        </div>

        {showUserInfo && user && (
          <div className="header-user">
            <div className="user-info">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="user-avatar"
              />
              <span className="user-name">{user.login}</span>
            </div>
            <button className="logout-btn" onClick={logout} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
