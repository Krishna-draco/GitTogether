import { useEffect, useRef } from "react";
import { throttle } from "../utils/helpers";
import { useSocketEmit } from "./useSocket";

export const useCursorTracking = (editor, playerId) => {
  const emit = useSocketEmit();
  const lastPosRef = useRef(null);

  useEffect(() => {
    if (!editor) return;

    const handleCursorChange = throttle(() => {
      const pos = editor.getPosition();
      if (!pos) return;

      const model = editor.getModel();
      const offset = model.getOffsetAt(pos);
      const domNode = editor.getDomNode();

      // get scrolled position to map to screen
      const visible = editor.getScrolledVisiblePosition(pos);

      const payload = {
        // Backend expects { line, ch }
        line: pos.lineNumber,
        ch: pos.column,
        offset,
        top: visible?.top || 0,
        left: visible?.left || 0,
      };

      // avoid emitting unchanged positions
      const last = lastPosRef.current;
      if (
        last &&
        last.lineNumber === payload.lineNumber &&
        last.column === payload.column
      )
        return;

      lastPosRef.current = payload;
      emit("CURSOR_POSITION_MOVE", payload);
    }, 80);

    const disposable = editor.onDidChangeCursorPosition(handleCursorChange);

    return () => {
      disposable.dispose();
    };
  }, [editor, emit, playerId]);
};
