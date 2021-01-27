const { ObjectId } = require('bson');
const mongoose = require('mongoose');

const { Schema } = mongoose;
const messageSchema = new Schema({
  senderId: {
    type: ObjectId,
    required: true,
    ref: 'User',
  },
  receiverId: {
    type: ObjectId,
    required: true,
    ref: 'User',
  },
  senderName: {
    type: String,
    required: true,
    ref: 'User',
  },
  receiverName: {
    type: String,
    required: true,
    ref: 'User',
  },
  content: {
    type: String,
    required: true,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Message', messageSchema);
