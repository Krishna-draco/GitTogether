import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { diffLines } from "diff";
import {
  Terminal,
  Users,
  Code,
  ArrowLeft,
  Copy,
  Check,
  History,
  Calendar,
  Trash2,
  GitMerge,
  MessageSquare,
  Send,
  CheckCircle,
  HelpCircle,
  Phone,
  PhoneOff,
} from "lucide-react";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
const SOCKET_TOKEN_KEY = "gittogether_socket_token";

const buildIceServers = () => {
  const iceServers = [];
  const stunUrl =
    import.meta.env.VITE_STUN_URL || "stun:stun.l.google.com:19302";
  const turnUrl = import.meta.env.VITE_TURN_URL;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;

  if (stunUrl) {
    iceServers.push({ urls: stunUrl });
  }

  if (turnUrl && turnUsername && turnCredential) {
    iceServers.push({
      urls: turnUrl,
      username: turnUsername,
      credential: turnCredential,
    });
  }

  return iceServers;
};

export const Workspace = ({ roomId, onLeaveRoom }) => {
  const { user } = useAuth();

  // App/Room states
  const [code1, setCode1] = useState("// Panel 1: Paste or write code here");
  const [code2, setCode2] = useState("// Panel 2: Paste or write code here");
  const [codeMerged, setCodeMerged] = useState(
    "// Panel 3: Collaborative resolution panel",
  );
  const [language, setLanguage] = useState("javascript");
  const [user1, setUser1] = useState("");
  const [user2, setUser2] = useState("");
  const [activeUsers, setActiveUsers] = useState([]);
  const [selfColor, setSelfColor] = useState("#6366f1");
  const [copied, setCopied] = useState(false);

  // Phase 4: Diffing & Resolution state
  const [conflictBlocks, setConflictBlocks] = useState([]);
  const [showOnlyDiffs, setShowOnlyDiffs] = useState(true);
  const [activeTab, setActiveTab] = useState("resolver"); // 'resolver' or 'chat'

  // Phase 5: Chat states
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [selfSocketId, setSelfSocketId] = useState("");
  const [callStatus, setCallStatus] = useState("idle"); // idle | connecting | in-call
  const [callPeerName, setCallPeerName] = useState("");

  // Monaco Editor references
  const editorRef1 = useRef(null);
  const editorRef2 = useRef(null);
  const editorRef3 = useRef(null);

  // Socket.io client reference
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerSocketIdRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const remoteAudioRef = useRef(null);

  // Track Monaco Delta Decorations for remote cursors & diff highlights
  const cursorDecorationsRef1 = useRef([]);
  const cursorDecorationsRef2 = useRef([]);
  const cursorDecorationsRef3 = useRef([]);

  const diffDecorationsRef1 = useRef([]);
  const diffDecorationsRef2 = useRef([]);

  // Flag to block recursive socket update loops
  const isRemoteUpdateRef = useRef(false);

  // Link scroll lock flag
  const isScrollingRef = useRef(false);

  // Chat scroll anchor
  const chatBottomRef = useRef(null);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const endVoiceCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    pendingIceCandidatesRef.current = [];
    peerSocketIdRef.current = null;
    setCallPeerName("");
    setCallStatus("idle");
  };

  const ensureLocalStream = async () => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    localStreamRef.current = stream;
    return stream;
  };

  const flushPendingIceCandidates = async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription) {
      return;
    }

    const pending = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];

    for (const candidate of pending) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (error) {
        console.error("Failed to add queued ICE candidate:", error);
      }
    }
  };

  const createPeerConnection = (targetSocketId) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    pendingIceCandidatesRef.current = [];

    const pc = new RTCPeerConnection({
      iceServers: buildIceServers(),
    });

    peerConnectionRef.current = pc;
    peerSocketIdRef.current = targetSocketId;

    const peerUser = activeUsers.find(
      (activeUser) => activeUser?.socketId === targetSocketId,
    );
    setCallPeerName(peerUser?.username || "Peer");

    pc.onicecandidate = (event) => {
      if (!event.candidate || !socketRef.current || !peerSocketIdRef.current) {
        return;
      }

      socketRef.current.emit("webrtc-ice", {
        roomId,
        recipientId: peerSocketIdRef.current,
        candidate: event.candidate,
      });
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (!stream) {
        return;
      }

      remoteStreamRef.current = stream;
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
      }
      setCallStatus("in-call");
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setCallStatus("in-call");
      }
      if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
        endVoiceCall();
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    return pc;
  };

  const startVoiceCall = async () => {
    try {
      if (!socketRef.current) {
        return;
      }

      const peer = activeUsers.find(
        (activeUser) =>
          activeUser?.socketId && activeUser.socketId !== selfSocketId,
      );
      if (!peer) {
        alert("No peer is currently available in this room for a call.");
        return;
      }

      setCallStatus("connecting");
      await ensureLocalStream();
      const pc = createPeerConnection(peer.socketId);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current.emit("webrtc-offer", {
        roomId,
        recipientId: peer.socketId,
        offer,
      });
    } catch (error) {
      console.error("Failed to start voice call:", error);
      endVoiceCall();
    }
  };

  // Copy Room ID helper
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    // 1. Establish secure socket connection using Credentials (to transfer HttpOnly token cookie)
    const socketToken = localStorage.getItem(SOCKET_TOKEN_KEY);
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      auth: socketToken ? { token: socketToken } : undefined,
    });

    const socket = socketRef.current;

    // 2. Connect & Join Room
    socket.on("connect", () => {
      console.log("Connected to socket server");
      setSelfSocketId(socket.id);
      socket.emit("join-room", { roomId });
    });

    // 3. Receive full room state on initial load
    socket.on("room-state", (state) => {
      setCode1(state.code1);
      setCode2(state.code2);
      setCodeMerged(state.codeMerged);
      setLanguage(state.language);
      setUser1(state.user1);
      setUser2(state.user2);
      setActiveUsers(state.activeUsers);
      setSelfColor(state.selfColor);
      setMessages(state.messages || []);

      // Programmatically set values if editors are already mounted without sending changes back
      try {
        isRemoteUpdateRef.current = true;
        if (
          editorRef1.current &&
          editorRef1.current.getValue() !== state.code1
        ) {
          editorRef1.current.setValue(state.code1);
        }
        if (
          editorRef2.current &&
          editorRef2.current.getValue() !== state.code2
        ) {
          editorRef2.current.setValue(state.code2);
        }
        if (
          editorRef3.current &&
          editorRef3.current.getValue() !== state.codeMerged
        ) {
          editorRef3.current.setValue(state.codeMerged);
        }
      } finally {
        isRemoteUpdateRef.current = false;
      }
      setTimeout(scrollToBottom, 200);
    });

    // 4. Handle peer joining room
    socket.on("user-joined", (data) => {
      setActiveUsers(data.activeUsers);
      setUser1(data.user1);
      setUser2(data.user2);
      console.log(`${data.username} joined the workspace`);
    });

    // 5. Handle peer leaving room
    socket.on("user-left", (data) => {
      setActiveUsers(data.activeUsers);
      if (data.socketId && data.socketId === peerSocketIdRef.current) {
        endVoiceCall();
      }
      console.log(`${data.username} left the workspace`);
    });

    // 10. Targeted WebRTC signaling handlers
    socket.on("webrtc-offer", async ({ offer, sender }) => {
      try {
        setCallStatus("connecting");
        await ensureLocalStream();

        const pc = createPeerConnection(sender);
        await pc.setRemoteDescription(offer);
        await flushPendingIceCandidates();

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("webrtc-answer", {
          roomId,
          recipientId: sender,
          answer,
        });
      } catch (error) {
        console.error("Failed to handle incoming WebRTC offer:", error);
        endVoiceCall();
      }
    });

    socket.on("webrtc-answer", async ({ answer, sender }) => {
      try {
        if (!peerConnectionRef.current || sender !== peerSocketIdRef.current) {
          return;
        }

        await peerConnectionRef.current.setRemoteDescription(answer);
        await flushPendingIceCandidates();
      } catch (error) {
        console.error("Failed to apply WebRTC answer:", error);
        endVoiceCall();
      }
    });

    socket.on("webrtc-ice", async ({ candidate, sender }) => {
      try {
        if (!candidate || sender !== peerSocketIdRef.current) {
          return;
        }

        const pc = peerConnectionRef.current;
        if (!pc) {
          return;
        }

        const iceCandidate = new RTCIceCandidate(candidate);
        if (pc.remoteDescription) {
          await pc.addIceCandidate(iceCandidate);
        } else {
          pendingIceCandidatesRef.current.push(iceCandidate);
        }
      } catch (error) {
        console.error("Failed to process ICE candidate:", error);
      }
    });

    // 6. Synchronize code edits across panels smoothly without resetting cursors
    socket.on("code-sync", ({ panel, code }) => {
      let targetEditor = null;

      if (panel === 1) {
        targetEditor = editorRef1.current;
        setCode1(code);
      } else if (panel === 2) {
        targetEditor = editorRef2.current;
        setCode2(code);
      } else if (panel === 3) {
        targetEditor = editorRef3.current;
        setCodeMerged(code);
      }

      if (targetEditor) {
        const model = targetEditor.getModel();
        if (model && model.getValue() !== code) {
          const selections = targetEditor.getSelections();

          try {
            // Prevent local onChange event from emitting this programmatic update back to peers
            isRemoteUpdateRef.current = true;

            // Temporarily disable read-only to allow programmatic edit
            targetEditor.updateOptions({ readOnly: false });

            // Perform smooth diff edit execution to maintain cursor line-up and undo logs
            targetEditor.executeEdits("socket-sync", [
              {
                range: model.getFullModelRange(),
                text: code,
                forceMoveMarkers: true,
              },
            ]);

            if (selections) {
              targetEditor.setSelections(selections);
            }
          } finally {
            // Restore correct read-only state based on user role
            targetEditor.updateOptions({ readOnly: !isEditable(panel) });
            isRemoteUpdateRef.current = false;
          }
        }
      }
    });

    // 7. Synchronize language dropdown updates
    socket.on("language-sync", ({ language }) => {
      setLanguage(language);
    });

    // 8. Synchronize remote cursor decors
    socket.on("cursor-sync", ({ username, color, panel, position }) => {
      let targetEditor = null;
      let decorationsRef = null;

      if (panel === 1) {
        targetEditor = editorRef1.current;
        decorationsRef = cursorDecorationsRef1;
      } else if (panel === 2) {
        targetEditor = editorRef2.current;
        decorationsRef = cursorDecorationsRef2;
      } else if (panel === 3) {
        targetEditor = editorRef3.current;
        decorationsRef = cursorDecorationsRef3;
      }

      if (!targetEditor || !decorationsRef || !position) return;
      const model = targetEditor.getModel();
      if (!model) return;

      // Apply delta decorations to draw cursor block and cursor name tooltip
      const newDecorations = [
        {
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column + 1,
          },
          options: {
            className: "remote-cursor",
            stickiness: 1, // NeverGrowWhenTypingAtEdges
            hoverMessage: { value: `**${username}**` },
            before: {
              content: " ",
              inlineClassName: "remote-cursor-line",
              style: `border-left: 2px solid ${color}; margin-left: -1px;`,
            },
          },
        },
      ];

      decorationsRef.current = targetEditor.deltaDecorations(
        decorationsRef.current,
        newDecorations,
      );
    });

    // 9. Sync Chat messaging
    socket.on("chat-msg-broadcast", (msg) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(scrollToBottom, 50);
    });

    // Clean up on component unmount
    return () => {
      endVoiceCall();
      if (socket) {
        socket.disconnect();
      }
    };
  }, [roomId]);

  // Phase 4: Dynamic line-by-line diffing calculations
  useEffect(() => {
    if (!editorRef1.current || !editorRef2.current) return;

    const editor1 = editorRef1.current;
    const editor2 = editorRef2.current;

    // Calculate line diffs
    const diffs = diffLines(code1, code2);

    let line1 = 1;
    let line2 = 1;
    const decors1 = [];
    const decors2 = [];
    const conflicts = [];

    for (let i = 0; i < diffs.length; i++) {
      const part = diffs[i];
      const count = part.count || 0;

      if (part.removed) {
        // Unique to Editor 1 (Ours)
        const startLine = line1;
        const endLine = line1 + count - 1;

        // Check if next segment is an "added" block to identify a conflict
        const nextPart = diffs[i + 1];
        const isConflict = nextPart && nextPart.added;

        const className = isConflict
          ? "diff-line-conflict"
          : "diff-line-removed";
        const gutterName = isConflict
          ? "diff-gutter-conflict"
          : "diff-gutter-removed";

        for (let l = startLine; l <= endLine; l++) {
          decors1.push({
            range: {
              startLineNumber: l,
              startColumn: 1,
              endLineNumber: l,
              endColumn: 1,
            },
            options: {
              isWholeLine: true,
              className: className,
              linesDecorationsClassName: gutterName,
            },
          });
        }

        conflicts.push({
          type: isConflict ? "conflict" : "removed",
          start1: startLine,
          end1: endLine,
          text1: part.value,
          start2: isConflict ? line2 : null,
          end2: isConflict ? line2 + nextPart.count - 1 : null,
          text2: isConflict ? nextPart.value : "",
        });

        line1 += count;
      } else if (part.added) {
        // Unique to Editor 2 (Theirs)
        const startLine = line2;
        const endLine = line2 + count - 1;

        const prevPart = diffs[i - 1];
        const isConflict = prevPart && prevPart.removed;

        const className = isConflict ? "diff-line-conflict" : "diff-line-added";
        const gutterName = isConflict
          ? "diff-gutter-conflict"
          : "diff-gutter-added";

        for (let l = startLine; l <= endLine; l++) {
          decors2.push({
            range: {
              startLineNumber: l,
              startColumn: 1,
              endLineNumber: l,
              endColumn: 1,
            },
            options: {
              isWholeLine: true,
              className: className,
              linesDecorationsClassName: gutterName,
            },
          });
        }

        if (!isConflict) {
          conflicts.push({
            type: "added",
            start1: null,
            end1: null,
            text1: "",
            start2: startLine,
            end2: endLine,
            text2: part.value,
          });
        }

        line2 += count;
      } else {
        // Unchanged / Common lines
        const startLine1 = line1;
        const endLine1 = line1 + count - 1;
        const startLine2 = line2;
        const endLine2 = line2 + count - 1;

        conflicts.push({
          type: "common",
          start1: startLine1,
          end1: endLine1,
          text1: part.value,
          start2: startLine2,
          end2: endLine2,
          text2: part.value,
        });

        line1 += count;
        line2 += count;
      }
    }

    // Convert standard ranges into Monaco Range instances
    const monacoRange1 = decors1.map((d) => ({
      range: {
        startLineNumber: d.range.startLineNumber,
        startColumn: d.range.startColumn,
        endLineNumber: d.range.endLineNumber,
        endColumn: d.range.endColumn,
      },
      options: d.options,
    }));

    const monacoRange2 = decors2.map((d) => ({
      range: {
        startLineNumber: d.range.startLineNumber,
        startColumn: d.range.startColumn,
        endLineNumber: d.range.endLineNumber,
        endColumn: d.range.endColumn,
      },
      options: d.options,
    }));

    diffDecorationsRef1.current = editor1.deltaDecorations(
      diffDecorationsRef1.current,
      monacoRange1,
    );
    diffDecorationsRef2.current = editor2.deltaDecorations(
      diffDecorationsRef2.current,
      monacoRange2,
    );

    setConflictBlocks(conflicts);
  }, [code1, code2, activeUsers]);

  // Synchronized scrolling side-by-side
  useEffect(() => {
    if (!editorRef1.current || !editorRef2.current) return;

    const editor1 = editorRef1.current;
    const editor2 = editorRef2.current;

    const disp1 = editor1.onDidScrollChange((e) => {
      if (isScrollingRef.current) return;
      try {
        isScrollingRef.current = true;
        editor2.setScrollTop(e.scrollTop);
        editor2.setScrollLeft(e.scrollLeft);
      } finally {
        isScrollingRef.current = false;
      }
    });

    const disp2 = editor2.onDidScrollChange((e) => {
      if (isScrollingRef.current) return;
      try {
        isScrollingRef.current = true;
        editor1.setScrollTop(e.scrollTop);
        editor1.setScrollLeft(e.scrollLeft);
      } finally {
        isScrollingRef.current = false;
      }
    });

    return () => {
      disp1.dispose();
      disp2.dispose();
    };
  }, [code1, code2]);

  // Handlers for sending local changes to peers via sockets
  const handleCodeChange = (panel, val) => {
    // ABORT if change was triggered programmatically by a socket packet to avoid infinite loops
    if (isRemoteUpdateRef.current) return;

    if (panel === 1) setCode1(val);
    else if (panel === 2) setCode2(val);
    else if (panel === 3) setCodeMerged(val);

    if (socketRef.current) {
      socketRef.current.emit("code-change", {
        roomId,
        panel,
        code: val,
      });
    }
  };

  const handleLanguageChange = (e) => {
    const selectedLang = e.target.value;
    setLanguage(selectedLang);
    if (socketRef.current) {
      socketRef.current.emit("language-change", {
        roomId,
        language: selectedLang,
      });
    }
  };

  const handleCursorMove = (panel, editor) => {
    const position = editor.getPosition();
    if (socketRef.current && position) {
      socketRef.current.emit("cursor-change", {
        roomId,
        panel,
        position,
      });
    }
  };

  // Enforce roles: Left panel (Editor 1) is editable ONLY by user1. Right panel (Editor 2) ONLY by user2.
  const isEditable = (panel) => {
    if (panel === 3) return true; // Merged pane is collaborative for all
    if (panel === 1) {
      return user1 === user.username;
    }
    if (panel === 2) {
      return user2 === user.username;
    }
    return false;
  };

  // Helper to show label of who is editing which panel
  const getPanelEditorLabel = (panel) => {
    if (panel === 1) {
      if (!user1) return "Awaiting Developer 1...";
      return user1 === user.username
        ? "You (Left Developer)"
        : `${user1}'s Panel (Read-only)`;
    }
    if (panel === 2) {
      if (!user2) return "Awaiting Developer 2...";
      return user2 === user.username
        ? "You (Right Developer)"
        : `${user2}'s Panel (Read-only)`;
    }
    return "Collaborative Merged Workspace (Shared)";
  };

  // Accept conflict block helper: appends or inserts code programmatically into Editor 3
  const handleAcceptBlock = (text) => {
    if (!editorRef3.current) return;

    const editor = editorRef3.current;
    const model = editor.getModel();
    if (!model) return;

    const cleanText = text.endsWith("\n") ? text : `${text}\n`;
    const position = editor.getPosition();

    // Insert at cursor if focused, otherwise append to end of file
    if (position) {
      editor.executeEdits("merge-resolve", [
        {
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          },
          text: cleanText,
          forceMoveMarkers: true,
        },
      ]);
    } else {
      const lineCount = model.getLineCount();
      editor.executeEdits("merge-resolve", [
        {
          range: {
            startLineNumber: lineCount + 1,
            startColumn: 1,
            endLineNumber: lineCount + 1,
            endColumn: 1,
          },
          text: cleanText,
          forceMoveMarkers: true,
        },
      ]);
    }

    // Trigger state change so it syncs to other users
    handleCodeChange(3, model.getValue());
  };

  // Auto-Merge all non-conflicted blocks and insert conflict markers for actual conflicts
  const handleAutoMerge = () => {
    let mergedText = "";

    conflictBlocks.forEach((block) => {
      if (block.type === "common") {
        mergedText += block.text1;
      } else if (block.type === "removed") {
        mergedText += block.text1;
      } else if (block.type === "added") {
        mergedText += block.text2;
      } else if (block.type === "conflict") {
        mergedText += `<<<<<<< Editor 1 (Left)\n${block.text1}=======\n${block.text2}>>>>>>> Editor 2 (Right)\n`;
      }
    });

    if (editorRef3.current) {
      const editor = editorRef3.current;
      const model = editor.getModel();
      if (model) {
        try {
          isRemoteUpdateRef.current = true;
          editor.executeEdits("auto-merge", [
            {
              range: model.getFullModelRange(),
              text: mergedText,
              forceMoveMarkers: true,
            },
          ]);
        } finally {
          isRemoteUpdateRef.current = false;
        }
        handleCodeChange(3, mergedText);
      }
    }
  };

  // Send Text Chat message
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    if (socketRef.current) {
      socketRef.current.emit("chat-msg", {
        roomId,
        text: chatInput.trim(),
      });
      setChatInput("");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        overflow: "hidden",
      }}
    >
      {/* Workspace Top Header */}
      <header
        className="glass-panel"
        style={{
          height: "var(--header-height)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          borderRadius: "0",
          borderLeft: "none",
          borderRight: "none",
          borderTop: "none",
          zIndex: 100,
          flexShrink: 0,
        }}
      >
        {/* Back and Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={onLeaveRoom}
            className="btn btn-secondary"
            style={{ padding: "8px 12px", borderRadius: "6px" }}
          >
            <ArrowLeft size={16} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Terminal size={20} className="accent-text" />
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
              <span className="accent-text">Git</span>Together
            </h3>
          </div>
        </div>

        {/* Room ID Sharing & Active Users */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* Room ID Badge */}
          <div
            onClick={copyRoomId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-color)",
              padding: "6px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            <span style={{ color: "var(--text-secondary)" }}>Room ID:</span>
            <strong
              style={{ letterSpacing: "0.05em", color: "var(--text-primary)" }}
            >
              {roomId}
            </strong>
            {copied ? (
              <Check size={14} style={{ color: "#10b981" }} />
            ) : (
              <Copy size={14} style={{ color: "var(--text-secondary)" }} />
            )}
          </div>

          {/* Active Participants Avatars */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Users size={16} style={{ color: "var(--text-secondary)" }} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                position: "relative",
              }}
            >
              {activeUsers.map((activeUser, index) => {
                if (!activeUser) return null;
                const username = activeUser.username || "User";
                const userColor = activeUser.color || "var(--accent-primary)";
                return (
                  <div
                    key={index}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: userColor,
                      border: "2px solid var(--bg-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "0.75rem",
                      marginLeft: index === 0 ? "0" : "-8px",
                      position: "relative",
                      cursor: "default",
                    }}
                    title={username}
                  >
                    {username.charAt(0).toUpperCase()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Language Selection Config */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Code size={16} style={{ color: "var(--text-secondary)" }} />
          <select
            value={language}
            onChange={handleLanguageChange}
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              padding: "8px 16px",
              borderRadius: "8px",
              outline: "none",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="json">JSON</option>
          </select>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginLeft: "8px",
            }}
          >
            {callStatus === "idle" ? (
              <button
                onClick={startVoiceCall}
                className="btn btn-primary"
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                }}
              >
                <Phone size={14} />
                Start Call
              </button>
            ) : (
              <button
                onClick={endVoiceCall}
                className="btn btn-secondary"
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                }}
              >
                <PhoneOff size={14} />
                End Call
              </button>
            )}

            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border-color)",
                padding: "6px 10px",
                borderRadius: "8px",
                whiteSpace: "nowrap",
              }}
            >
              {callStatus === "idle"
                ? "Voice: idle"
                : callStatus === "connecting"
                  ? `Voice: connecting${callPeerName ? ` (${callPeerName})` : ""}`
                  : `Voice: in call${callPeerName ? ` (${callPeerName})` : ""}`}
            </span>
          </div>
        </div>
      </header>

      {/* Split Layout: Left Editors & Right Collaborative Sidebar */}
      <div
        style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}
      >
        {/* Left Hand Panel: Editors Workspace Grid */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "16px",
            gap: "16px",
            overflow: "hidden",
          }}
        >
          {/* Top Half: Side-by-side versions */}
          <div style={{ display: "flex", flex: 1, gap: "16px", minHeight: 0 }}>
            {/* Panel 1: Ours */}
            <div
              className="glass-panel"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderBottom: "1px solid var(--border-color)",
                  padding: "8px 16px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#6366f1",
                    }}
                  />
                  Editor 1: {getPanelEditorLabel(1)}
                </span>
                {!isEditable(1) && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      background: "rgba(255,255,255,0.04)",
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    Read-Only
                  </span>
                )}
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                <Editor
                  height="100%"
                  language={language}
                  theme="vs-dark"
                  defaultValue={code1}
                  onChange={(val) => handleCodeChange(1, val || "")}
                  options={{
                    readOnly: !isEditable(1),
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: "Consolas, 'Courier New', monospace",
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                  onMount={(editor) => {
                    editorRef1.current = editor;
                    if (code1) {
                      try {
                        isRemoteUpdateRef.current = true;
                        editor.setValue(code1);
                      } finally {
                        isRemoteUpdateRef.current = false;
                      }
                    }
                    editor.onDidChangeCursorPosition(() =>
                      handleCursorMove(1, editor),
                    );
                    // Force layout recalculation after mounting to align highlights perfectly
                    setTimeout(() => {
                      editor.layout();
                    }, 500);
                  }}
                />
              </div>
            </div>

            {/* Panel 2: Theirs */}
            <div
              className="glass-panel"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderBottom: "1px solid var(--border-color)",
                  padding: "8px 16px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#a855f7",
                    }}
                  />
                  Editor 2: {getPanelEditorLabel(2)}
                </span>
                {!isEditable(2) && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      background: "rgba(255,255,255,0.04)",
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    Read-Only
                  </span>
                )}
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                <Editor
                  height="100%"
                  language={language}
                  theme="vs-dark"
                  defaultValue={code2}
                  onChange={(val) => handleCodeChange(2, val || "")}
                  options={{
                    readOnly: !isEditable(2),
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: "Consolas, 'Courier New', monospace",
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                  onMount={(editor) => {
                    editorRef2.current = editor;
                    if (code2) {
                      try {
                        isRemoteUpdateRef.current = true;
                        editor.setValue(code2);
                      } finally {
                        isRemoteUpdateRef.current = false;
                      }
                    }
                    editor.onDidChangeCursorPosition(() =>
                      handleCursorMove(2, editor),
                    );
                    // Force layout recalculation after mounting to align highlights perfectly
                    setTimeout(() => {
                      editor.layout();
                    }, 500);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bottom Half: Merged Workspace */}
          <div
            className="glass-panel-glow"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              borderRadius: "12px",
              overflow: "hidden",
              minHeight: 0,
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                borderBottom: "1px solid var(--border-color)",
                padding: "8px 16px",
                fontSize: "0.85rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Terminal size={14} className="accent-text" />
                Editor 3: Collaborative Merged Output (All can edit)
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#10b981",
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#10b981",
                    display: "inline-block",
                  }}
                  className="pulse-glow"
                />
                Live Synced
              </span>
            </div>
            <div style={{ flex: 1, position: "relative" }}>
              <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                defaultValue={codeMerged}
                onChange={(val) => handleCodeChange(3, val || "")}
                options={{
                  readOnly: false,
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "Consolas, 'Courier New', monospace",
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
                onMount={(editor) => {
                  editorRef3.current = editor;
                  if (codeMerged) {
                    try {
                      isRemoteUpdateRef.current = true;
                      editor.setValue(codeMerged);
                    } finally {
                      isRemoteUpdateRef.current = false;
                    }
                  }
                  editor.onDidChangeCursorPosition(() =>
                    handleCursorMove(3, editor),
                  );
                  // Force layout recalculation after mounting to align highlights perfectly
                  setTimeout(() => {
                    editor.layout();
                  }, 500);
                }}
              />
            </div>
          </div>
        </main>

        {/* Right Hand Panel: Premium Sidebar (Conflict Resolver & Persistent Text Chat) */}
        <aside
          className="glass-panel"
          style={{
            width: "340px",
            margin: "16px 16px 16px 0",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderLeft: "1px solid var(--border-color)",
            flexShrink: 0,
          }}
        >
          {/* Tabs Navigation Bar */}
          <div
            style={{
              display: "flex",
              background: "rgba(255, 255, 255, 0.02)",
              borderBottom: "1px solid var(--border-color)",
              padding: "6px",
              gap: "6px",
            }}
          >
            <button
              onClick={() => setActiveTab("resolver")}
              className="btn"
              style={{
                flex: 1,
                padding: "8px 12px",
                fontSize: "0.8rem",
                borderRadius: "6px",
                background:
                  activeTab === "resolver"
                    ? "rgba(99, 102, 241, 0.15)"
                    : "transparent",
                border:
                  "1px solid " +
                  (activeTab === "resolver"
                    ? "rgba(99, 102, 241, 0.25)"
                    : "transparent"),
                color:
                  activeTab === "resolver"
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
              }}
            >
              <GitMerge size={14} />
              Merge Helper
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className="btn"
              style={{
                flex: 1,
                padding: "8px 12px",
                fontSize: "0.8rem",
                borderRadius: "6px",
                background:
                  activeTab === "chat"
                    ? "rgba(99, 102, 241, 0.15)"
                    : "transparent",
                border:
                  "1px solid " +
                  (activeTab === "chat"
                    ? "rgba(99, 102, 241, 0.25)"
                    : "transparent"),
                color:
                  activeTab === "chat"
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
              }}
            >
              <MessageSquare size={14} />
              Room Chat
            </button>
          </div>

          {/* TAB A: Dynamic Conflict Resolver Panel */}
          {activeTab === "resolver" && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "16px",
                overflowY: "auto",
                gap: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <button
                  onClick={handleAutoMerge}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    padding: "10px",
                    fontSize: "0.85rem",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
                  }}
                >
                  <GitMerge size={16} />
                  Auto-Merge Non-Conflicted
                </button>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                    Conflict Resolver
                  </h4>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      background: "rgba(255, 255, 255, 0.05)",
                      padding: "2px 8px",
                      borderRadius: "20px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {conflictBlocks.filter((b) => b.type !== "common").length}{" "}
                    differences
                  </span>
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    userSelect: "none",
                    padding: "4px 0",
                    borderBottom: "1px solid var(--border-color)",
                    paddingBottom: "12px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showOnlyDiffs}
                    onChange={(e) => setShowOnlyDiffs(e.target.checked)}
                    style={{
                      accentColor: "var(--accent-primary)",
                      cursor: "pointer",
                    }}
                  />
                  Show Differences Only (
                  {conflictBlocks.filter((b) => b.type !== "common").length})
                </label>
              </div>

              {conflictBlocks.length === 0 ? (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: "20px",
                    color: "var(--text-muted)",
                    gap: "12px",
                  }}
                >
                  <CheckCircle
                    size={36}
                    style={{ color: "#10b981", opacity: 0.6 }}
                  />
                  <p style={{ fontSize: "0.85rem", lineHeight: "1.5" }}>
                    <strong>Editors are fully consistent!</strong>
                    <br />
                    No conflicting lines or line-by-line differences found.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {conflictBlocks
                    .filter(
                      (block) => !showOnlyDiffs || block.type !== "common",
                    )
                    .map((block, index) => {
                      const isConflict = block.type === "conflict";
                      const isRemoved = block.type === "removed";
                      const isCommon = block.type === "common";

                      let bg = "rgba(16, 185, 129, 0.03)";
                      let border = "rgba(16, 185, 129, 0.15)";
                      let title = "Theirs Added Block";

                      if (isConflict) {
                        bg = "rgba(234, 179, 8, 0.03)";
                        border = "rgba(234, 179, 8, 0.15)";
                        title = "Merge Conflict Detected";
                      } else if (isRemoved) {
                        bg = "rgba(239, 68, 68, 0.03)";
                        border = "rgba(239, 68, 68, 0.15)";
                        title = "Ours Removed Block";
                      } else if (isCommon) {
                        bg = "rgba(255, 255, 255, 0.01)";
                        border = "rgba(255, 255, 255, 0.06)";
                        title = "Common Code Block";
                      }

                      return (
                        <div
                          key={index}
                          style={{
                            background: bg,
                            border: "1px solid " + border,
                            borderRadius: "8px",
                            padding: "12px 14px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          <strong
                            style={{
                              fontSize: "0.8rem",
                              color: isConflict
                                ? "#f59e0b"
                                : isRemoved
                                  ? "#f87171"
                                  : isCommon
                                    ? "var(--text-muted)"
                                    : "#34d399",
                            }}
                          >
                            {title}
                          </strong>

                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {isConflict ? (
                              <>
                                Lines Left: {block.start1}-{block.end1} | Right:{" "}
                                {block.start2}-{block.end2}
                              </>
                            ) : isRemoved ? (
                              <>
                                Editor 1 Lines: {block.start1}-{block.end1}
                              </>
                            ) : isCommon ? (
                              <>
                                Lines: Left {block.start1}-{block.end1} | Right{" "}
                                {block.start2}-{block.end2}
                              </>
                            ) : (
                              <>
                                Editor 2 Lines: {block.start2}-{block.end2}
                              </>
                            )}
                          </span>

                          {/* Integration Action Buttons */}
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              marginTop: "4px",
                            }}
                          >
                            {isCommon && (
                              <button
                                onClick={() => handleAcceptBlock(block.text1)}
                                className="diff-resolve-badge"
                                style={{
                                  flex: 1,
                                  textAlign: "center",
                                  background: "rgba(255, 255, 255, 0.05)",
                                  borderColor: "rgba(255, 255, 255, 0.1)",
                                  color: "var(--text-primary)",
                                }}
                              >
                                Accept Common Block
                              </button>
                            )}
                            {(isConflict || isRemoved) && (
                              <button
                                onClick={() => handleAcceptBlock(block.text1)}
                                className="diff-resolve-badge"
                                style={{ flex: 1, textAlign: "center" }}
                              >
                                Accept Left
                              </button>
                            )}
                            {(isConflict || (!isRemoved && !isCommon)) && (
                              <button
                                onClick={() => handleAcceptBlock(block.text2)}
                                className="diff-resolve-badge"
                                style={{ flex: 1, textAlign: "center" }}
                              >
                                Accept Right
                              </button>
                            )}
                            {isConflict && (
                              <button
                                onClick={() =>
                                  handleAcceptBlock(block.text1 + block.text2)
                                }
                                className="diff-resolve-badge"
                                style={{
                                  flex: 1.2,
                                  textAlign: "center",
                                  background: "rgba(234, 179, 8, 0.1)",
                                  borderColor: "rgba(234, 179, 8, 0.25)",
                                  color: "#eab308",
                                }}
                              >
                                Accept Both
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB B: Premium Real-Time Room Chat Panel */}
          {activeTab === "chat" && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Message history container */}
              <div
                style={{
                  flex: 1,
                  padding: "16px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {messages.length === 0 ? (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      color: "var(--text-muted)",
                      fontSize: "0.8rem",
                      fontStyle: "italic",
                    }}
                  >
                    No messages yet. Send a greeting to start chatting!
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    if (!msg || !msg.sender) return null;
                    const isSelf = msg.sender === user?.username;
                    return (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignSelf: isSelf ? "flex-end" : "flex-start",
                          maxWidth: "85%",
                          alignItems: isSelf ? "flex-end" : "flex-start",
                        }}
                      >
                        {/* Sender Label */}
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--text-secondary)",
                            marginBottom: "2px",
                            padding: "0 4px",
                          }}
                        >
                          {isSelf ? "You" : msg.sender}
                        </span>

                        {/* Text Bubble */}
                        <div
                          style={{
                            background: isSelf
                              ? "var(--accent-glowing)"
                              : "rgba(255, 255, 255, 0.05)",
                            border:
                              "1px solid " +
                              (isSelf ? "transparent" : "var(--border-color)"),
                            padding: "8px 12px",
                            borderRadius: isSelf
                              ? "12px 12px 2px 12px"
                              : "12px 12px 12px 2px",
                            color: "#ffffff",
                            fontSize: "0.85rem",
                            wordBreak: "break-word",
                            boxShadow: isSelf
                              ? "0 2px 8px rgba(99, 102, 241, 0.25)"
                              : "none",
                          }}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendChat}
                style={{
                  padding: "12px 16px",
                  borderTop: "1px solid var(--border-color)",
                  background: "rgba(255, 255, 255, 0.01)",
                  display: "flex",
                  gap: "8px",
                }}
              >
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    fontSize: "0.85rem",
                    background: "var(--bg-input)",
                    borderRadius: "6px",
                    flex: 1,
                  }}
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    flexShrink: 0,
                  }}
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          )}
        </aside>
      </div>

      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Custom Styles for Monaco remote cursors */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .remote-cursor {
          background-color: rgba(255, 255, 255, 0.05);
        }
        .remote-cursor-line {
          height: 100%;
        }
      `,
        }}
      />
    </div>
  );
};

export default Workspace;
