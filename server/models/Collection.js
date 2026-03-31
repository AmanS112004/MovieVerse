const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  movies: [
    {
      movieId: { type: Number, required: true },
      title: { type: String, required: true },
      poster_path: { type: String },
      media_type: { type: String, default: 'movie' },
      addedAt: { type: Date, default: Date.now }
    }
  ],
  isPublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { 
  timestamps: true 
});

// Index for fast user collection lookups
collectionSchema.index({ userId: 1 });

module.exports = mongoose.model('Collection', collectionSchema);
