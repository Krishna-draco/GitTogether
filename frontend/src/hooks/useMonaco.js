import { useEffect, useRef, useCallback } from "react";

export const useMonaco = (editor, options = {}) => {
  const decorationsRef = useRef([]);

  const setDecorations = useCallback(
    (newDecorations) => {
      if (!editor) return;
      decorationsRef.current = editor.deltaDecorations(
        decorationsRef.current,
        newDecorations,
      );
    },
    [editor],
  );

  const clearDecorations = useCallback(() => {
    if (!editor) return;
    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      [],
    );
  }, [editor]);

  const getContent = useCallback(() => {
    if (!editor) return "";
    return editor.getValue();
  }, [editor]);

  const setContent = useCallback(
    (content) => {
      if (!editor) return;
      editor.setValue(content);
    },
    [editor],
  );

  const getCursorPosition = useCallback(() => {
    if (!editor) return null;
    return editor.getPosition();
  }, [editor]);

  const setCursorPosition = useCallback(
    (line, column) => {
      if (!editor) return;
      editor.setPosition({ lineNumber: line, column });
      editor.revealLine(line);
    },
    [editor],
  );

  const highlightLine = useCallback(
    (lineNumber, className = "highlighted-line") => {
      if (!editor) return;
      setDecorations([
        {
          range: {
            startLineNumber: lineNumber,
            startColumn: 0,
            endLineNumber: lineNumber,
            endColumn: 1,
          },
          options: {
            isWholeLine: true,
            className,
          },
        },
      ]);
    },
    [editor, setDecorations],
  );

  const toggleReadOnly = useCallback(
    (readOnly) => {
      if (!editor) return;
      editor.updateOptions({ readOnly });
    },
    [editor],
  );

  return {
    setDecorations,
    clearDecorations,
    getContent,
    setContent,
    getCursorPosition,
    setCursorPosition,
    highlightLine,
    toggleReadOnly,
  };
};
