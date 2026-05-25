const { v4: uuidv4 } = require("uuid");

/**
 * Generate a unique room ID
 * @returns {string}
 */
function generateRoomId() {
  return `room_${uuidv4().split("-")[0]}`;
}

/**
 * Generate a unique commit hash
 * @returns {string}
 */
function generateCommitHash() {
  return uuidv4().replace(/-/g, "").substring(0, 12);
}

/**
 * Get current timestamp in milliseconds
 * @returns {number}
 */
function getCurrentTimestamp() {
  return Date.now();
}

/**
 * Deep clone an object
 * @param {any} obj - Object to clone
 * @returns {any}
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Validate if a string is valid JavaScript syntax
 * @param {string} code - Code to validate
 * @returns {boolean}
 */
function validateJavaScriptSyntax(code) {
  try {
    new Function(code);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if conflict markers exist in code
 * @param {string} code - Code to check
 * @returns {boolean}
 */
function hasConflictMarkers(code) {
  const markerRegex = /^<{7}|^={7}|^>{7}/m;
  return markerRegex.test(code);
}

/**
 * Extract conflict marker positions from code
 * @param {string} code - Code to analyze
 * @returns {Array<{start: number, end: number, type: string}>}
 */
function extractConflictMarkers(code) {
  const lines = code.split("\n");
  const markers = [];
  let inConflict = false;
  let conflictStart = -1;
  let headSeparatorLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("<<<<<<<")) {
      if (!inConflict) {
        inConflict = true;
        conflictStart = i;
      }
    } else if (line.startsWith("=======") && inConflict) {
      headSeparatorLine = i;
    } else if (line.startsWith(">>>>>>>") && inConflict) {
      markers.push({
        start: conflictStart,
        headSeparator: headSeparatorLine,
        end: i,
        type: "conflict",
      });
      inConflict = false;
      conflictStart = -1;
      headSeparatorLine = -1;
    }
  }

  return markers;
}

/**
 * Calculate text difference metrics
 * @param {string} text1
 * @param {string} text2
 * @returns {Object}
 */
function getTextDiffMetrics(text1, text2) {
  const lines1 = text1.split("\n");
  const lines2 = text2.split("\n");
  const maxLength = Math.max(lines1.length, lines2.length);
  const similarity =
    100 -
    Math.round((Math.abs(lines1.length - lines2.length) / maxLength) * 100);

  return {
    linesChanged: Math.abs(lines1.length - lines2.length),
    similarity: Math.max(0, similarity),
    lines1Count: lines1.length,
    lines2Count: lines2.length,
  };
}

/**
 * Format error response
 * @param {string} message - Error message
 * @param {string[]|null} details - Additional error details
 * @returns {Object}
 */
function formatErrorResponse(message, details = null) {
  return {
    success: false,
    error: message,
    details: details || [],
  };
}

/**
 * Format success response
 * @param {any} data - Response data
 * @returns {Object}
 */
function formatSuccessResponse(data) {
  return {
    success: true,
    data: data,
  };
}

module.exports = {
  generateRoomId,
  generateCommitHash,
  getCurrentTimestamp,
  deepClone,
  validateJavaScriptSyntax,
  hasConflictMarkers,
  extractConflictMarkers,
  getTextDiffMetrics,
  formatErrorResponse,
  formatSuccessResponse,
};
