import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../../services/authService";
import { useAuth } from "../../hooks/useAuth";
import { Notification } from "../Common/Notification";

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const finishAuth = async () => {
      if (!code) {
        setError("Missing code from GitHub");
        return;
      }

      try {
        // Backend expects POST /api/auth/github/callback with { code }
        const result = await authService.fetchGitHubUser(code);
        if (result && result.user && result.token) {
          login(result.user, result.token);
          navigate("/dashboard");
        } else {
          setError("Authentication failed");
        }
      } catch (err) {
        console.error(err);
        setError("Authentication failed");
      }
    };

    finishAuth();
  }, [code, login, navigate]);

  return (
    <div style={{ padding: 20 }}>
      <h3>Completing authentication...</h3>
      {error && (
        <Notification
          type="error"
          title="Auth Error"
          message={error}
          onClose={() => setError(null)}
        />
      )}
    </div>
  );
};

export default AuthCallback;
