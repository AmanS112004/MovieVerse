const express = require('express');
const router = express.Router();
const Collection = require('../models/Collection');
const auth = require('../middleware/auth');

/**
 * @route   GET /api/collections
 * @desc    Get all collections for the current user
 */
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching collections for user:', req.user.id);
    const collections = await Collection.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(collections);
  } catch (err) {
    console.error('GET / Error:', err.message);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

/**
 * @route   POST /api/collections/create
 * @desc    Create a new collection
 */
router.post('/create', auth, async (req, res) => {
  const { name, description } = req.body;

  if (!name) return res.status(400).json({ error: 'Collection name is required' });

  try {
    console.log('Creating collection:', name);
    const newCollection = new Collection({
      userId: req.user.id,
      name,
      description,
      movies: []
    });

    const collection = await newCollection.save();
    res.json(collection);
  } catch (err) {
    console.error('POST /create Error:', err.message);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

/**
 * @route   GET /api/collections/:id
 * @desc    Get details for a specific collection
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const collection = await Collection.findOne({ _id: req.params.id, userId: req.user.id });
    if (!collection) return res.status(404).json({ error: 'Collection not found' });
    res.json(collection);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST /api/collections/add-movie
 * @desc    Add a movie to a collection
 */
router.post('/add-movie', auth, async (req, res) => {
  const { collectionId, movie } = req.body;

  if (!collectionId || !movie || !movie.id) {
    return res.status(400).json({ error: 'Invalid movie or collection' });
  }

  try {
    console.log(`Adding movie ${movie.id} to collection ${collectionId}`);
    console.log('Incoming movie object fields:', Object.keys(movie));
    
    // Check DB connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected. ReadyState:', mongoose.connection.readyState);
      return res.status(503).json({ error: 'Database connection is currently unavailable' });
    }

    const collection = await Collection.findOne({ _id: collectionId, userId: req.user.id });
    if (!collection) {
      console.log('Collection not found or unauthorized');
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Check for duplicates
    const mId = parseInt(movie.id);
    if (isNaN(mId)) {
      return res.status(400).json({ error: 'Invalid movie ID format' });
    }

    const exists = collection.movies.some(m => String(m.movieId) === String(mId));
    if (exists) return res.status(400).json({ error: 'Movie already in collection' });

    const movieTitle = movie.title || movie.name || movie.original_title || 'Untitled Content';
    
    collection.movies.push({
      movieId: mId,
      title: movieTitle,
      poster_path: movie.poster_path,
      media_type: movie.media_type || (movie.title ? 'movie' : 'tv'),
      addedAt: new Date()
    });

    try {
      await collection.save();
      console.log(`Successfully added "${movieTitle}" to collection "${collection.name}"`);
      res.json(collection);
    } catch (saveErr) {
      console.error('Mongoose Save Error:', saveErr.message);
      res.status(500).json({ error: 'Database persistence failed', details: saveErr.message });
    }
  } catch (err) {
    console.error('General Error in add-movie:', err.stack);
    res.status(500).json({ error: 'Server Error during addition', message: err.message });
  }
});

/**
 * @route   DELETE /api/collections/:id/remove-movie/:movieId
 * @desc    Remove a movie from a collection
 */
router.delete('/:id/remove-movie/:movieId', auth, async (req, res) => {
  try {
    const collection = await Collection.findOne({ _id: req.params.id, userId: req.user.id });
    if (!collection) return res.status(404).json({ error: 'Collection not found' });

    collection.movies = collection.movies.filter(m => m.movieId !== parseInt(req.params.movieId));
    await collection.save();
    res.json(collection);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   DELETE /api/collections/:id
 * @desc    Delete a collection
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const collection = await Collection.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!collection) return res.status(404).json({ error: 'Collection not found' });
    res.json({ message: 'Collection removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
