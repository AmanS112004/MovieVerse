const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get bookmarks
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('bookmarks watchHistory');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle bookmark
router.post('/toggle', auth, async (req, res) => {
  try {
    const { movieId } = req.body;
    if (!movieId) return res.status(400).json({ error: 'movieId required' });

    const user = await User.findById(req.user.id);
    const idx = user.bookmarks.indexOf(movieId);
    if (idx > -1) {
      user.bookmarks.splice(idx, 1);
    } else {
      user.bookmarks.push(movieId);
    }
    await user.save();
    res.json({ bookmarks: user.bookmarks, bookmarked: idx === -1 });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add to watch history
router.post('/history', auth, async (req, res) => {
  try {
    const { movieId } = req.body;
    const user = await User.findById(req.user.id);
    // Remove old entry, add to front
    user.watchHistory = user.watchHistory.filter(h => h.movieId !== movieId);
    user.watchHistory.unshift({ movieId, viewedAt: new Date() });
    user.watchHistory = user.watchHistory.slice(0, 50); // Keep last 50
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
