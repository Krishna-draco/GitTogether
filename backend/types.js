/**
 * @typedef {Object} GitCommit
 * @property {string} hash - Unique commit identifier
 * @property {string|null} parentHash - Parent commit hash for lineage tracking
 * @property {string} author - Commit author identifier
 * @property {string} message - Commit message
 * @property {Object.<string, string>} snapshot - File contents at this commit
 */

/**
 * @typedef {Object} ConflictFile
 * @property {string} filename - Name of the file with conflict
 * @property {string} baseContent - Original common ancestor code
 * @property {string} alphaContent - Developer Alpha's modified code
 * @property {string} betaContent - Developer Beta's modified code
 * @property {string} mergedWithMarkers - File with conflict markers
 */

/**
 * @typedef {Object} PlayerInfo
 * @property {string} socketId - Socket.io connection ID
 * @property {string} username - Player username
 * @property {'IDLE' | 'TYPING' | 'COMMITTED'} status - Current player status
 */

/**
 * @typedef {Object} RepositoryState
 * @property {Object} branches - Branch references
 * @property {string} branches.main - Main branch tip commit hash
 * @property {string} branches.alpha - Alpha branch tip commit hash
 * @property {string} branches.beta - Beta branch tip commit hash
 * @property {Object.<string, GitCommit>} commits - Complete commit history
 */

/**
 * @typedef {Object} DuelRoom
 * @property {string} roomId - Unique room identifier
 * @property {'LOBBY' | 'EDIT_PHASE' | 'CONFLICT_MODE' | 'SUCCESS_SCREEN'} currentPhase - Current phase
 * @property {Object} players - Player information
 * @property {PlayerInfo} players.alpha - Developer Alpha's info
 * @property {PlayerInfo} players.beta - Developer Beta's info
 * @property {RepositoryState} repository - Repository state
 * @property {ConflictFile[]} activeConflicts - Active conflict files
 * @property {string} liveResolvedCode - Shared resolution editor content
 * @property {number} createdAt - Room creation timestamp
 * @property {number} lastActivityAt - Last activity timestamp
 * @property {number|null} sessionTimeout - Session timeout handler ID
 */

module.exports = {
  // Placeholder for type definitions
  // Node.js doesn't have native TypeScript, but we use JSDoc for type hinting
};
