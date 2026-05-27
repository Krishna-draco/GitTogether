const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code1: {
      type: String,
      default: '// Paste or write your code here (Panel 1)',
    },
    code2: {
      type: String,
      default: '// Paste or write your code here (Panel 2)',
    },
    codeMerged: {
      type: String,
      default: '// Collab and resolve conflict here (Panel 3)',
    },
    language: {
      type: String,
      default: 'javascript',
    },
    user1: {
      type: String, // username of user editing editor 1
      default: '',
    },
    user2: {
      type: String, // username of user editing editor 2
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
