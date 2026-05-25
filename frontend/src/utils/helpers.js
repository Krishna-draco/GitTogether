/**
 * Helper Functions
 */

/**
 * Format timestamp to readable format
 */
export const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

/**
 * Format timestamp to date and time
 */
export const formatDateTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy:", error);
    return false;
  }
};

/**
 * Generate random color
 */
export const generateColor = () => {
  const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#6c5ce7"];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Extract line and column from position
 */
export const extractPosition = (content, position) => {
  const lines = content.substring(0, position).split("\n");
  return {
    line: lines.length,
    ch: lines[lines.length - 1].length,
  };
};

/**
 * Find conflict markers in code
 */
export const findConflictMarkers = (code) => {
  const lines = code.split("\n");
  const markers = [];

  let inConflict = false;
  let conflictStart = -1;
  let separatorLine = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("<<<<<<<")) {
      inConflict = true;
      conflictStart = i;
    } else if (lines[i].startsWith("=======") && inConflict) {
      separatorLine = i;
    } else if (lines[i].startsWith(">>>>>>>") && inConflict) {
      markers.push({
        startLine: conflictStart,
        separatorLine,
        endLine: i,
      });
      inConflict = false;
    }
  }

  return markers;
};

/**
 * Highlight conflict lines
 */
export const getConflictLineRanges = (markers) => {
  const ranges = [];
  markers.forEach((marker) => {
    ranges.push({
      startLineNumber: marker.startLine + 1,
      endLineNumber: marker.endLine + 1,
      className: "conflict-line",
    });
  });
  return ranges;
};

/**
 * Debounce function
 */
export const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Throttle function
 */
export const throttle = (fn, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Get avatar color based on slot
 */
export const getAvatarColor = (slot) => {
  return slot === "alpha" ? "#ff6b6b" : "#4ecdc4";
};

/**
 * Get slot label
 */
export const getSlotLabel = (slot) => {
  return slot === "alpha" ? "Alpha Developer" : "Beta Developer";
};

/**
 * Format elapsed time
 */
export const formatElapsedTime = (startTime) => {
  if (!startTime) return "0s";

  const elapsed = Math.floor((Date.now() - startTime) / 1000);

  if (elapsed < 60) return `${elapsed}s`;
  if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

/**
 * Sanitize HTML
 */
export const sanitizeHtml = (html) => {
  const div = document.createElement("div");
  div.textContent = html;
  return div.innerHTML;
};
