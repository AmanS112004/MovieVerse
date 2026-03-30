const mongoose = require('mongoose');

const similarityCacheSchema = new mongoose.Schema({
  sourceMovieId: { type: Number, required: true },
  mediaType: { type: String, default: 'movie' },
  results: [{ 
    id: Number, 
    score: Number, 
    vibe_tags: [String],
    reason: String 
  }],
  lastComputed: { type: Date, default: Date.now }
});

// Compound index for fast lookup
similarityCacheSchema.index({ sourceMovieId: 1, mediaType: 1 });

module.exports = mongoose.model('SimilarityCache', similarityCacheSchema);
