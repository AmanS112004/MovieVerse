const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: false, minlength: 6 },
  googleId: { type: String, unique: true, sparse: true },
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
