import { useContext } from "react";
import { GameContext } from "../context/GameContext";

export const useGameState = () => {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error("useGameState must be used within GameProvider");
  }

  return context;
};
