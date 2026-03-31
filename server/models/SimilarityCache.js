const mongoose = require('mongoose');

const similarityCacheSchema = new mongoose.Schema({
  sourceMovieId: { type: Number, required: true },
  mediaType: { type: String, default: 'movie' },
  results: [mongoose.Schema.Types.Mixed],
  lastComputed: { type: Date, default: Date.now }
});

// Compound index for fast lookup
similarityCacheSchema.index({ sourceMovieId: 1, mediaType: 1 });

module.exports = mongoose.model('SimilarityCache', similarityCacheSchema);
