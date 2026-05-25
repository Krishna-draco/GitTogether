import create from "zustand";

export const useUIStore = create((set) => ({
  activeFile: "server.js",
  editorReadOnly: false,
  selectedMergeAction: null,
  errors: [],
  setActiveFile: (f) => set(() => ({ activeFile: f })),
  setEditorReadOnly: (ro) => set(() => ({ editorReadOnly: ro })),
  setSelectedMergeAction: (a) => set(() => ({ selectedMergeAction: a })),
  setErrors: (errs) => set(() => ({ errors: errs })),
}));
