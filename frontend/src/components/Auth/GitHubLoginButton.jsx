import React from "react";
import { Github } from "lucide-react";
import "../../styles/buttons.css";

export const GitHubLoginButton = ({ onClick, isLoading = false }) => {
  return (
    <button className="github-login-btn" onClick={onClick} disabled={isLoading}>
      <Github size={20} />
      <span>{isLoading ? "Authenticating..." : "Sign in with GitHub"}</span>
    </button>
  );
};
