const { diffLines, diffChars } = require("diff");

/**
 * Line-by-line diff comparison
 * @param {string} baseContent - Original content
 * @param {string} alphaContent - Alpha user's content
 * @param {string} betaContent - Beta user's content
 * @returns {Object} Diff result with conflicts
 */
function performThreeWayDiff(baseContent, alphaContent, betaContent) {
  // Split content into lines for analysis
  const baseLines = baseContent.split("\n");
  const alphaLines = alphaContent.split("\n");
  const betaLines = betaContent.split("\n");

  // Compare alpha vs base
  const alphaDiff = diffLines(baseContent, alphaContent);
  const betaDiff = diffLines(baseContent, betaContent);

  // Track changed line indices
  const alphaChangedLines = new Set();
  const betaChangedLines = new Set();

  let alphaLineOffset = 0;
  for (const change of alphaDiff) {
    if (change.added) {
      alphaChangedLines.add(alphaLineOffset);
      alphaLineOffset++;
    } else if (change.removed) {
      alphaLineOffset++;
    } else {
      alphaLineOffset++;
    }
  }

  let betaLineOffset = 0;
  for (const change of betaDiff) {
    if (change.added) {
      betaChangedLines.add(betaLineOffset);
      betaLineOffset++;
    } else if (change.removed) {
      betaLineOffset++;
    } else {
      betaLineOffset++;
    }
  }

  // Detect conflicting line ranges
  const conflictingLines = [];
  for (let i = 0; i < Math.max(alphaLines.length, betaLines.length); i++) {
    if (alphaChangedLines.has(i) && betaChangedLines.has(i)) {
      // Both modified the same area
      if (alphaLines[i] !== betaLines[i]) {
        conflictingLines.push(i);
      }
    }
  }

  return {
    hasConflicts: conflictingLines.length > 0,
    conflictingLines,
    alphaDiff,
    betaDiff,
    alphaChangedLines: Array.from(alphaChangedLines),
    betaChangedLines: Array.from(betaChangedLines),
  };
}

/**
 * Generate conflict markers in standard Git format
 * @param {string} baseContent - Base content
 * @param {string} alphaContent - Alpha content
 * @param {string} betaContent - Beta content
 * @returns {string} Content with conflict markers
 */
function generateConflictMarkers(baseContent, alphaContent, betaContent) {
  const diff = performThreeWayDiff(baseContent, alphaContent, betaContent);

  if (!diff.hasConflicts) {
    // Auto-merge non-conflicting changes
    return autoMergeNonConflictingChanges(
      baseContent,
      alphaContent,
      betaContent,
    );
  }

  // Build merged content with conflict markers
  const baseLines = baseContent.split("\n");
  const alphaLines = alphaContent.split("\n");
  const betaLines = betaContent.split("\n");

  let result = [];
  const processedIndices = new Set();

  // Process each line of the base content
  for (let i = 0; i < baseLines.length; i++) {
    if (processedIndices.has(i)) continue;

    const baseLine = baseLines[i];
    const alphaLine = alphaLines[i] || "";
    const betaLine = betaLines[i] || "";

    // Check if this line has conflicting changes
    if (diff.conflictingLines.includes(i)) {
      result.push(`<<<<<<< HEAD (Alpha Changes)`);
      result.push(alphaLine);
      result.push(`=======`);
      result.push(betaLine);
      result.push(`>>>>>>> Incoming Branch (Beta Changes)`);
      processedIndices.add(i);
    } else if (
      diff.alphaChangedLines.includes(i) &&
      !diff.betaChangedLines.includes(i)
    ) {
      // Only alpha changed
      result.push(alphaLine);
    } else if (
      diff.betaChangedLines.includes(i) &&
      !diff.alphaChangedLines.includes(i)
    ) {
      // Only beta changed
      result.push(betaLine);
    } else {
      // No changes
      result.push(baseLine);
    }
  }

  // Handle additional lines from alpha or beta (if they added more lines)
  for (
    let i = baseLines.length;
    i < Math.max(alphaLines.length, betaLines.length);
    i++
  ) {
    const alphaLine = alphaLines[i] || "";
    const betaLine = betaLines[i] || "";

    if (alphaLine && betaLine && alphaLine !== betaLine) {
      result.push(`<<<<<<< HEAD (Alpha Changes)`);
      result.push(alphaLine);
      result.push(`=======`);
      result.push(betaLine);
      result.push(`>>>>>>> Incoming Branch (Beta Changes)`);
    } else if (alphaLine) {
      result.push(alphaLine);
    } else if (betaLine) {
      result.push(betaLine);
    }
  }

  return result.join("\n");
}

/**
 * Auto-merge non-conflicting changes
 * @param {string} baseContent
 * @param {string} alphaContent
 * @param {string} betaContent
 * @returns {string}
 */
function autoMergeNonConflictingChanges(
  baseContent,
  alphaContent,
  betaContent,
) {
  const baseLines = baseContent.split("\n");
  const alphaLines = alphaContent.split("\n");
  const betaLines = betaContent.split("\n");

  const diff = performThreeWayDiff(baseContent, alphaContent, betaContent);
  let result = [];

  // Process lines intelligently
  for (let i = 0; i < Math.max(alphaLines.length, betaLines.length); i++) {
    const baseLine = baseLines[i] || "";
    const alphaLine = alphaLines[i] || "";
    const betaLine = betaLines[i] || "";

    // If both changed to same value, use it
    if (alphaLine === betaLine && alphaLine !== baseLine) {
      result.push(alphaLine);
    }
    // If only alpha changed
    else if (
      diff.alphaChangedLines.includes(i) &&
      !diff.betaChangedLines.includes(i)
    ) {
      result.push(alphaLine);
    }
    // If only beta changed
    else if (
      diff.betaChangedLines.includes(i) &&
      !diff.alphaChangedLines.includes(i)
    ) {
      result.push(betaLine);
    }
    // If neither changed
    else if (
      !diff.alphaChangedLines.includes(i) &&
      !diff.betaChangedLines.includes(i)
    ) {
      result.push(baseLine);
    }
    // Both changed differently - shouldn't happen if no conflicts
    else {
      result.push(alphaLine || betaLine || baseLine);
    }
  }

  return result.join("\n");
}

/**
 * Extract conflict resolution sections
 * @param {string} mergedContent - Content with conflict markers
 * @returns {Array<Object>} Array of conflict sections
 */
function extractConflictSections(mergedContent) {
  const sections = [];
  const lines = mergedContent.split("\n");
  let currentSection = null;
  let sectionStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("<<<<<<< HEAD")) {
      currentSection = {
        startLine: i,
        headStart: i,
        headContent: [],
        separatorLine: -1,
        incomingContent: [],
        endLine: -1,
      };
      sectionStart = i;
    } else if (line.startsWith("=======") && currentSection) {
      currentSection.separatorLine = i;
    } else if (line.startsWith(">>>>>>> Incoming")) {
      currentSection.endLine = i;
      sections.push(currentSection);
      currentSection = null;
    } else if (currentSection) {
      if (currentSection.separatorLine === -1) {
        currentSection.headContent.push(line);
      } else {
        currentSection.incomingContent.push(line);
      }
    }
  }

  return sections;
}

/**
 * Create initial conflict file object
 * @param {string} filename - Filename
 * @param {string} baseContent - Base content
 * @param {string} alphaContent - Alpha content
 * @param {string} betaContent - Beta content
 * @returns {Object} ConflictFile object
 */
function createConflictFile(filename, baseContent, alphaContent, betaContent) {
  return {
    filename,
    baseContent,
    alphaContent,
    betaContent,
    mergedWithMarkers: generateConflictMarkers(
      baseContent,
      alphaContent,
      betaContent,
    ),
    conflictSections: extractConflictSections(
      generateConflictMarkers(baseContent, alphaContent, betaContent),
    ),
  };
}

module.exports = {
  performThreeWayDiff,
  generateConflictMarkers,
  autoMergeNonConflictingChanges,
  extractConflictSections,
  createConflictFile,
};
