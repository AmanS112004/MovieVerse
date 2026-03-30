const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  name: { type: String, required: true },
  avatar: { type: String, default: '' },
  bookmarks: [{ type: Number }],
  watchHistory: [{ 
    movieId: { type: Number },
    viewedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
