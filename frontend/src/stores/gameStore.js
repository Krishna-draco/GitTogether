import create from "zustand";
import { GAME_PHASES } from "../utils/constants";

export const useGameStore = create((set) => ({
  roomId: null,
  roomState: null,
  currentPhase: GAME_PHASES.LOBBY,
  playerSlot: null,
  baseContent: "",
  alphaContent: "",
  betaContent: "",
  liveResolvedCode: "",
  chatMessages: [],
  startTime: null,

  setRoomId: (id) => set(() => ({ roomId: id })),
  setRoomState: (room) => set(() => ({ roomState: room })),
  updatePhase: (phase) => set(() => ({ currentPhase: phase })),
  setPlayerSlot: (slot) => set(() => ({ playerSlot: slot })),
  setContent: (content) =>
    set(() => ({
      baseContent: content.baseContent || undefined,
      alphaContent: content.alphaContent || undefined,
      betaContent: content.betaContent || undefined,
      liveResolvedCode: content.liveResolvedCode || undefined,
    })),
  updateLiveResolvedCode: (code) => set(() => ({ liveResolvedCode: code })),
  addChatMessage: (msg) =>
    set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  startGame: () => set(() => ({ startTime: Date.now() })),
  resetGame: () =>
    set(() => ({
      roomId: null,
      roomState: null,
      currentPhase: GAME_PHASES.LOBBY,
    })),
}));
