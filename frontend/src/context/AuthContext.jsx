import React, { createContext, useReducer, useCallback } from "react";

export const AuthContext = createContext(null);

const initialState = {
  user: localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null,
  isAuthenticated: !!localStorage.getItem("authToken"),
  isLoading: false,
  error: null,
  token: localStorage.getItem("authToken") || null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, isLoading: true, error: null };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        token: action.token,
        error: null,
      };
    case "LOGIN_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.error,
        isAuthenticated: false,
      };
    case "LOGOUT":
      localStorage.removeItem("authToken");
      return { ...initialState, token: null };
    case "RESTORE_TOKEN":
      return {
        ...state,
        token: action.payload,
        isAuthenticated: !!action.payload,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = useCallback((user, token) => {
    dispatch({ type: "LOGIN_START" });
    try {
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(user));
      dispatch({ type: "LOGIN_SUCCESS", payload: user, token });
    } catch (error) {
      dispatch({ type: "LOGIN_ERROR", error: error.message });
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    dispatch({ type: "LOGOUT" });
  }, []);

  const restoreToken = useCallback(() => {
    const token = localStorage.getItem("authToken");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      const user = JSON.parse(userStr);
      dispatch({ type: "LOGIN_SUCCESS", payload: user, token });
    }
  }, []);

  const value = {
    ...state,
    login,
    logout,
    restoreToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
