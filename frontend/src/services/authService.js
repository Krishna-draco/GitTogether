import {
  GITHUB_CLIENT_ID,
  GITHUB_REDIRECT_URI,
  API_BASE_URL,
} from "../utils/constants";

export const authService = {
  // Get GitHub OAuth URL
  getGitHubAuthURL: () => {
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: GITHUB_REDIRECT_URI,
      scope: "user:email",
      state: Math.random().toString(36).substring(7),
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  },

  // Get user from GitHub
  fetchGitHubUser: async (code) => {
    try {
      const response = await fetch("/api/auth/github/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch GitHub user:", error);
      throw error;
    }
  },

  // Store token
  storeToken: (token) => {
    localStorage.setItem("authToken", token);
  },

  // Get token
  getToken: () => {
    return localStorage.getItem("authToken");
  },

  // Remove token
  removeToken: () => {
    localStorage.removeItem("authToken");
  },

  // Check if authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem("authToken");
  },

  // Register local user
  register: async ({ username, password, displayName }) => {
    const url = (API_BASE_URL || "") + "/api/auth/register";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, displayName }),
    });
    return res.json();
  },

  // Login local user
  login: async ({ username, password }) => {
    const url = (API_BASE_URL || "") + "/api/auth/login";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  },
};
