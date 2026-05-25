import React, { useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import "../../styles/editor.css";

export const MonacoEditorWrapper = ({
  value,
  onChange,
  readOnly = false,
  theme = "vs-dark",
  language = "javascript",
  onMount,
  onCursorChange,
  tint = null,
  height = "100%",
  className = "",
  options = {},
}) => {
  const editorRef = useRef(null);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    onMount?.(editor, monaco);
  };

  const handleEditorChange = (value) => {
    onChange?.(value);
  };

  const handleCursorChange = (position) => {
    onCursorChange?.(position);
  };

  const defaultOptions = {
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    readOnly,
    fontSize: 13,
    fontFamily: "'Fira Code', 'Courier New', monospace",
    lineNumbers: "on",
    tabSize: 2,
    ...options,
  };

  return (
    <div
      className={`monaco-editor-wrapper ${className} ${tint ? `tint-${tint}` : ""}`}
    >
      <Editor
        height={height}
        defaultLanguage={language}
        value={value}
        onChange={handleEditorChange}
        theme={theme}
        options={defaultOptions}
        onMount={handleEditorMount}
      />
    </div>
  );
};
