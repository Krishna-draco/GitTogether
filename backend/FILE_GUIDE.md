# Backend Files Guide - Quick Reference

## 📊 File Organization & Purpose

```
backend/
│
├─── 🚀 SERVER & CORE
│    │
│    └─ server.js (300 lines)
│       ├─ Express app initialization
│       ├─ HTTP server creation
│       ├─ Socket.io setup with CORS
│       ├─ REST endpoint handlers
│       ├─ Error handling middleware
│       └─ Graceful shutdown
│
├─── 🔧 STATE MANAGEMENT
│    │
│    └─ roomManager.js (450 lines)
│       ├─ Room creation & deletion
│       ├─ Player join/leave logic
│       ├─ Phase transition management
│       ├─ Branch content tracking
│       ├─ Conflict generation
│       ├─ Merge commit creation
│       ├─ Session timeout handling
│       └─ FIFO message queue
│
├─── 🎯 ALGORITHMS
│    │
│    ├─ diffEngine.js (280 lines)
│    │  ├─ Three-way diff comparison
│    │  ├─ Conflict marker generation
│    │  ├─ Auto-merge logic
│    │  ├─ Conflict section extraction
│    │  └─ Non-conflicting merge
│    │
│    └─ verificationEngine.js (250 lines)
│       ├─ Pass 1: Marker cleansing
│       ├─ Pass 2: Empty state check
│       ├─ Pass 3: Syntax validation
│       ├─ Pass 4: Integrity check
│       ├─ Complete verification suite
│       └─ Summary generation
│
├─── 📡 NETWORK
│    │
│    └─ socketHandlers.js (400 lines)
│       ├─ Socket connection listener
│       ├─ JOIN_DUEL_ROOM handler
│       ├─ START_EDIT_PHASE handler
│       ├─ SUBMIT_BRANCH_COMMIT handler
│       ├─ SYNC_WORKSPACE_EDIT handler
│       ├─ CURSOR_POSITION_MOVE handler
│       ├─ REQUEST_MERGE_VERIFICATION handler
│       ├─ GET_ROOM_STATE handler
│       ├─ Disconnect handler
│       └─ Event broadcasting logic
│
├─── 🛠️ UTILITIES & CONFIG
│    │
│    ├─ utils.js (180 lines)
│    │  ├─ ID generation (room, commit hash)
│    │  ├─ Timestamp helpers
│    │  ├─ Deep cloning
│    │  ├─ JavaScript syntax validation
│    │  ├─ Conflict marker detection
│    │  ├─ Error/success formatting
│    │  └─ Text metrics calculation
│    │
│    ├─ config.js (35 lines)
│    │  ├─ Port & host configuration
│    │  ├─ CORS settings
│    │  ├─ Socket.io configuration
│    │  ├─ Session timeout
│    │  ├─ Verification settings
│    │  └─ Room limits
│    │
│    ├─ constants.js (70 lines)
│    │  ├─ Phase constants (LOBBY, EDIT, CONFLICT, SUCCESS)
│    │  ├─ Player slot constants (alpha, beta)
│    │  ├─ Status constants (IDLE, TYPING, COMMITTED)
│    │  ├─ Socket event names
│    │  ├─ HTTP endpoint paths
│    │  ├─ Error messages
│    │  ├─ Conflict marker patterns
│    │  └─ Verification error messages
│    │
│    └─ types.js (50 lines)
│       ├─ GitCommit JSDoc definition
│       ├─ ConflictFile JSDoc definition
│       ├─ PlayerInfo JSDoc definition
│       ├─ RepositoryState JSDoc definition
│       └─ DuelRoom JSDoc definition
│
├─── 📦 DEPENDENCIES
│    │
│    ├─ package.json
│    │  ├─ express: ^5.2.1
│    │  ├─ socket.io: ^4.8.3
│    │  ├─ cors: ^2.8.6
│    │  ├─ uuid: ^9.0.1
│    │  ├─ diff: ^5.2.2
│    │  └─ diff-match-patch: ^1.0.5
│    │
│    ├─ package-lock.json (generated)
│    │
│    └─ node_modules/ (300+ packages)
│
├─── 📚 DOCUMENTATION
│    │
│    ├─ README.md (300+ lines)
│    │  ├─ Overview
│    │  ├─ Architecture explanation
│    │  ├─ Data models
│    │  ├─ REST API reference
│    │  ├─ Socket.io events
│    │  ├─ Workflow phases
│    │  ├─ Verification process
│    │  ├─ Session resilience
│    │  ├─ Concurrency management
│    │  ├─ Installation & setup
│    │  ├─ Testing guide
│    │  ├─ WebSocket examples
│    │  └─ Performance notes
│    │
│    ├─ IMPLEMENTATION_SUMMARY.md (400+ lines)
│    │  ├─ Complete status (100% done)
│    │  ├─ Part 1: Core backend system
│    │  ├─ Part 2: Network layer
│    │  ├─ Part 3: Algorithms
│    │  ├─ Part 4: Concurrency
│    │  ├─ File structure
│    │  ├─ Endpoints reference
│    │  ├─ Events reference
│    │  ├─ Metrics & stats
│    │  ├─ Dependencies
│    │  ├─ Configuration
│    │  ├─ Performance characteristics
│    │  ├─ Production readiness
│    │  └─ Next steps
│    │
│    ├─ TESTING.md (450+ lines)
│    │  ├─ Quick start
│    │  ├─ cURL testing examples
│    │  │  ├─ Health check
│    │  │  ├─ Room creation
│    │  │  ├─ List rooms
│    │  │  └─ Statistics
│    │  ├─ WebSocket testing
│    │  │  ├─ Setup examples
│    │  │  ├─ Event emission
│    │  │  └─ Event listening
│    │  ├─ End-to-end test script
│    │  ├─ Error handling tests
│    │  ├─ Performance load tests
│    │  └─ Debugging tips
│    │
│    ├─ FRONTEND_INTEGRATION.md (350+ lines)
│    │  ├─ Connection setup
│    │  ├─ Event flow sequence
│    │  ├─ Frontend functions to implement
│    │  │  ├─ Room creation
│    │  │  ├─ Branch commit
│    │  │  ├─ Workspace sync
│    │  │  ├─ Cursor tracking
│    │  │  └─ Verification
│    │  ├─ UI state management
│    │  ├─ Conflict display
│    │  ├─ Error handling
│    │  ├─ Cursor indicators
│    │  ├─ Session recovery
│    │  ├─ React example component
│    │  ├─ API response formats
│    │  ├─ Testing integration
│    │  ├─ Common patterns
│    │  └─ Debugging tips
│    │
│    ├─ PROJECT_OVERVIEW.md (350+ lines)
│    │  ├─ Project status
│    │  ├─ File structure overview
│    │  ├─ Requirements fulfillment
│    │  ├─ API reference
│    │  ├─ Socket events reference
│    │  ├─ Technology stack
│    │  ├─ Key metrics
│    │  ├─ Features implemented
│    │  ├─ Code quality notes
│    │  ├─ Deployment readiness
│    │  └─ Learning resources
│    │
│    ├─ COMPLETION_SUMMARY.md (200+ lines)
│    │  ├─ What has been built
│    │  ├─ Implementation metrics
│    │  ├─ Requirements completion
│    │  ├─ Server status
│    │  ├─ API endpoints reference
│    │  ├─ Socket events reference
│    │  ├─ Testing guide
│    │  ├─ Technology stack
│    │  ├─ Key features
│    │  ├─ Next steps
│    │  ├─ Security notes
│    │  ├─ Performance characteristics
│    │  └─ Usage examples
│    │
│    └─ This file (FILE_GUIDE.md)
│
└─── ⚙️ CONFIGURATION
     │
     ├─ .env.example
     │  ├─ PORT=5000
     │  ├─ HOST=localhost
     │  ├─ NODE_ENV=development
     │  ├─ SESSION_TIMEOUT_MS=120000
     │  └─ LOG_LEVEL=debug
     │
     └─ .gitignore
        ├─ node_modules/
        ├─ .env
        ├─ *.log
        └─ .DS_Store
```

---

## 📊 Lines of Code Distribution

```
Total Backend: ~2,500 lines

Core Logic:
  roomManager.js      450 lines    18%
  socketHandlers.js   400 lines    16%
  diffEngine.js       280 lines    11%
  verificationEngine  250 lines    10%
  server.js           300 lines    12%
  utils.js            180 lines     7%
  Configs & Types     155 lines     6%

Documentation:
  README.md           300+ lines
  Implementation      400+ lines
  Testing             450+ lines
  Frontend Integration 350+ lines
  Project Overview    350+ lines
  Completion Summary  200+ lines

Total: 2,000+ documentation lines
```

---

## 🎯 File Purpose Matrix

| File                      | Purpose           | Lines | Type      |
| ------------------------- | ----------------- | ----- | --------- |
| server.js                 | Main server entry | 300   | Core      |
| roomManager.js            | State machine     | 450   | Core      |
| diffEngine.js             | Merge algorithm   | 280   | Algorithm |
| verificationEngine.js     | Validation        | 250   | Algorithm |
| socketHandlers.js         | Network layer     | 400   | Core      |
| utils.js                  | Helpers           | 180   | Utility   |
| config.js                 | Configuration     | 35    | Config    |
| constants.js              | Constants         | 70    | Config    |
| types.js                  | Type definitions  | 50    | Config    |
| README.md                 | Tech docs         | 300+  | Docs      |
| IMPLEMENTATION_SUMMARY.md | Details           | 400+  | Docs      |
| TESTING.md                | API tests         | 450+  | Docs      |
| FRONTEND_INTEGRATION.md   | Integration       | 350+  | Docs      |
| PROJECT_OVERVIEW.md       | Overview          | 350+  | Docs      |
| COMPLETION_SUMMARY.md     | Summary           | 200+  | Docs      |

---

## 🔄 File Dependencies

```
server.js
├── roomManager.js
├── socketHandlers.js
│   ├── roomManager.js
│   ├── verificationEngine.js
│   │   └── utils.js
│   └── utils.js
├── express
├── socket.io
└── cors

roomManager.js
├── utils.js
│   ├── uuid
│   └── diffEngine.js
└── diffEngine.js
    └── diff library

diffEngine.js
├── diff library
└── No local dependencies

verificationEngine.js
├── utils.js
└── No external dependencies

socketHandlers.js
├── roomManager.js
├── verificationEngine.js
└── utils.js
```

---

## 📝 Reading Order (Recommended)

1. **Start here**: COMPLETION_SUMMARY.md (5 min)
2. **Overview**: PROJECT_OVERVIEW.md (10 min)
3. **Architecture**: README.md (20 min)
4. **Details**: IMPLEMENTATION_SUMMARY.md (15 min)
5. **Integration**: FRONTEND_INTEGRATION.md (15 min)
6. **Testing**: TESTING.md (10 min)

---

## 🔍 File Navigation Guide

### I need to understand...

**...how the server starts?**
→ server.js (lines 1-50)

**...how rooms work?**
→ roomManager.js (entire file)

**...how conflicts are detected?**
→ diffEngine.js (performThreeWayDiff function)

**...how verification works?**
→ verificationEngine.js (all pass functions)

**...how socket events are handled?**
→ socketHandlers.js (event handlers)

**...what events are available?**
→ constants.js (SOCKET_EVENTS)

**...how to test the API?**
→ TESTING.md (all examples)

**...how to integrate with frontend?**
→ FRONTEND_INTEGRATION.md (all sections)

---

## ✨ Key Features by File

| File                  | Feature             | Function                   |
| --------------------- | ------------------- | -------------------------- |
| roomManager.js        | Phase transitions   | transitionPhase()          |
| roomManager.js        | Conflict generation | generateConflicts()        |
| roomManager.js        | Session recovery    | setSessionTimeout()        |
| diffEngine.js         | Three-way merge     | performThreeWayDiff()      |
| diffEngine.js         | Conflict markers    | generateConflictMarkers()  |
| verificationEngine.js | Marker check        | markerCleansing()          |
| verificationEngine.js | Syntax check        | syntaxSmokeTest()          |
| socketHandlers.js     | Real-time sync      | SYNC_WORKSPACE_EDIT        |
| socketHandlers.js     | Verification        | REQUEST_MERGE_VERIFICATION |
| server.js             | REST API            | All endpoints              |

---

## 🚀 Quick Reference

### To start server:

```bash
cd backend && npm start
```

### To understand the flow:

1. Read server.js (entry point)
2. Review roomManager.js (state machine)
3. Study socketHandlers.js (events)

### To test API:

Follow TESTING.md examples

### To integrate frontend:

Follow FRONTEND_INTEGRATION.md

### To deploy:

Review config.js and .env.example

---

## 📊 Module Breakdown

### networkModule (socketHandlers.js)

- Inbound: 7 events
- Outbound: 6 events
- Total: 13 events

### stateModule (roomManager.js)

- Methods: 15+
- Data structures: 5
- Phase management: 4 phases

### algorithmModule (diffEngine.js)

- Three-way diff: 1
- Merge functions: 2
- Parsing: 1

### validationModule (verificationEngine.js)

- Validation passes: 4
- Helper functions: 2

### serverModule (server.js)

- Endpoints: 6
- Middleware: 3

---

## 🎓 Learning Path

1. **Beginner**: Start with COMPLETION_SUMMARY.md
2. **Intermediate**: Read README.md and PROJECT_OVERVIEW.md
3. **Advanced**: Study source code files
4. **Expert**: Extend and customize

---

Total Backend Files: **17 files**

- Code: 9 files
- Config: 4 files
- Docs: 6 files

Status: **✅ Production Ready**
