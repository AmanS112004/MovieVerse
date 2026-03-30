const mongoose = require('mongoose');

const movieVibeSchema = new mongoose.Schema({
  movieId: { type: Number, required: true, unique: true },
  mediaType: { type: String, default: 'movie' },
  title: { type: String },
  tags: [{ type: String }],
  embedding: [{ type: Number }], // 768-dimensional vector from Gemini
  lastAIAnalysis: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MovieVibe', movieVibeSchema);
