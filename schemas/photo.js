const { ObjectId } = require('bson');
const mongoose = require('mongoose');

const { Schema } = mongoose;
const photoSchema = new Schema({
  userId: {
    type: ObjectId,
    required: true,
    ref: 'User',
  },
  name: {
    type: String,
    required: true,
    ref: 'User',
  },
  imageUrl: {
    type: String,
    required: true,
  },
  tags: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Photo', photoSchema);
