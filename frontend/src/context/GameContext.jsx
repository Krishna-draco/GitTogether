import React, { createContext, useReducer, useCallback } from "react";
import { GAME_PHASES } from "../utils/constants";

export const GameContext = createContext(null);

const initialState = {
  roomId: null,
  roomState: null,
  currentPhase: GAME_PHASES.LOBBY,
  playerSlot: null,
  otherPlayer: null,
  baseContent: "",
  alphaContent: "",
  betaContent: "",
  liveResolvedCode: "",
  activeConflicts: [],
  chatMessages: [],
  isLoading: false,
  error: null,
  startTime: null,
  verificationResult: null,
};

const gameReducer = (state, action) => {
  switch (action.type) {
    case "SET_ROOM_ID":
      return { ...state, roomId: action.payload };

    case "SET_ROOM_STATE":
      return { ...state, roomState: action.payload };

    case "UPDATE_PHASE":
      return { ...state, currentPhase: action.payload };

    case "SET_PLAYER_SLOT":
      return { ...state, playerSlot: action.payload };

    case "SET_OTHER_PLAYER":
      return { ...state, otherPlayer: action.payload };

    case "SET_CONTENT":
      return {
        ...state,
        baseContent: action.payload.baseContent || state.baseContent,
        alphaContent: action.payload.alphaContent || state.alphaContent,
        betaContent: action.payload.betaContent || state.betaContent,
        liveResolvedCode:
          action.payload.liveResolvedCode || state.liveResolvedCode,
      };

    case "UPDATE_LIVE_RESOLVED_CODE":
      return { ...state, liveResolvedCode: action.payload };

    case "SET_CONFLICTS":
      return { ...state, activeConflicts: action.payload };

    case "ADD_CHAT_MESSAGE":
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload],
      };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };

    case "SET_VERIFICATION_RESULT":
      return { ...state, verificationResult: action.payload };

    case "START_GAME":
      return { ...state, startTime: Date.now() };

    case "RESET_GAME":
      return initialState;

    default:
      return state;
  }
};

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const setRoomId = useCallback((roomId) => {
    dispatch({ type: "SET_ROOM_ID", payload: roomId });
  }, []);

  const setRoomState = useCallback((roomState) => {
    dispatch({ type: "SET_ROOM_STATE", payload: roomState });
  }, []);

  const updatePhase = useCallback((phase) => {
    dispatch({ type: "UPDATE_PHASE", payload: phase });
  }, []);

  const setPlayerSlot = useCallback((slot) => {
    dispatch({ type: "SET_PLAYER_SLOT", payload: slot });
  }, []);

  const setOtherPlayer = useCallback((player) => {
    dispatch({ type: "SET_OTHER_PLAYER", payload: player });
  }, []);

  const setContent = useCallback((content) => {
    dispatch({ type: "SET_CONTENT", payload: content });
  }, []);

  const updateLiveResolvedCode = useCallback((code) => {
    dispatch({ type: "UPDATE_LIVE_RESOLVED_CODE", payload: code });
  }, []);

  const setConflicts = useCallback((conflicts) => {
    dispatch({ type: "SET_CONFLICTS", payload: conflicts });
  }, []);

  const addChatMessage = useCallback((message) => {
    dispatch({ type: "ADD_CHAT_MESSAGE", payload: message });
  }, []);

  const setLoading = useCallback((loading) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: "SET_ERROR", payload: error });
  }, []);

  const setVerificationResult = useCallback((result) => {
    dispatch({ type: "SET_VERIFICATION_RESULT", payload: result });
  }, []);

  const startGame = useCallback(() => {
    dispatch({ type: "START_GAME" });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: "RESET_GAME" });
  }, []);

  const value = {
    ...state,
    setRoomId,
    setRoomState,
    updatePhase,
    setPlayerSlot,
    setOtherPlayer,
    setContent,
    updateLiveResolvedCode,
    setConflicts,
    addChatMessage,
    setLoading,
    setError,
    setVerificationResult,
    startGame,
    resetGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
