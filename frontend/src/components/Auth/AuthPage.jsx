import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { GitHubLoginButton } from "./GitHubLoginButton";
import { Notification } from "../Common/Notification";
import { authService } from "../../services/authService";
import { API_BASE_URL } from "../../utils/constants";
import "../../styles/auth.css";

export const AuthPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("oauth"); // 'oauth' | 'login' | 'register'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    try {
      const authUrl = authService.getGitHubAuthURL();
      window.location.href = authUrl;
    } catch (err) {
      setError("Failed to initiate GitHub login");
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">DevDuel</h1>
          <p className="auth-subtitle">Master Git Conflicts in Real-Time</p>
        </div>

        <div className="auth-content">
          <div className="auth-card">
            <h2>Join the Battle</h2>
            <p className="auth-description">
              Experience collaborative conflict resolution like never before.
              Sign in with your GitHub account to get started.
            </p>

            {/* Simple local auth option */}
            <div style={{ marginBottom: 12 }}>
              <button
                onClick={() => setMode(mode === "oauth" ? "login" : "oauth")}
                className="github-login-btn"
              >
                {mode === "oauth" ? "Use Local Account" : "Use GitHub OAuth"}
              </button>
            </div>

            {mode === "oauth" && (
              <GitHubLoginButton
                onClick={handleGitHubLogin}
                isLoading={isLoading}
              />
            )}

            {mode === "login" && (
              <div className="local-auth">
                <input
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <input
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    disabled={isLoading || !username || !password}
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        const data = await authService.login({
                          username,
                          password,
                        });
                        if (data && data.success) {
                          login(data.user, data.token);
                          window.location.href = "/dashboard";
                        } else {
                          setError(data.error || "Login failed");
                        }
                      } catch (err) {
                        setError("Login failed");
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                  >
                    Login
                  </button>
                  <button onClick={() => setMode("register")}>Register</button>
                </div>
              </div>
            )}

            {mode === "register" && (
              <div className="local-auth">
                <input
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <input
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    disabled={isLoading || !username || !password}
                    onClick={async () => {
                      setIsLoading(true);
                      setError(null);
                      try {
                        if (username.length < 3 || password.length < 6) {
                          setError(
                            "Username must be >=3 and password >=6 chars",
                          );
                          return;
                        }

                        const data = await authService.register({
                          username,
                          password,
                          displayName: username,
                        });

                        if (data && data.success) {
                          // Auto login after successful register
                          const loginData = await authService.login({
                            username,
                            password,
                          });
                          if (loginData && loginData.success) {
                            login(loginData.user, loginData.token);
                            window.location.href = "/dashboard";
                          } else {
                            setError(
                              loginData.error || "Login after register failed",
                            );
                          }
                        } else {
                          setError(data.error || "Register failed");
                        }
                      } catch (err) {
                        setError("Register failed");
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                  >
                    Register
                  </button>
                  <button onClick={() => setMode("login")}>
                    Back to Login
                  </button>
                </div>
              </div>
            )}

            <div className="auth-features">
              <h3>What You'll Get</h3>
              <ul>
                <li>⚔️ Real-time multiplayer duels</li>
                <li>🔀 Learn Git merge strategies</li>
                <li>💻 Monaco editor experience</li>
                <li>🏆 Track your progress</li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <Notification
            type="error"
            title="Authentication Error"
            message={error}
            onClose={() => setError(null)}
          />
        )}
      </div>
    </div>
  );
};
