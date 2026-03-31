const User = require('../models/User');
const MovieVibe = require('../models/MovieVibe');
const SimilarityCache = require('../models/SimilarityCache');
const { getEmbedding, getVibeTags, cosineSimilarity } = require('../utils/ai');
const axios = require('axios');

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_KEY = process.env.TMDB_API_KEY;

const tmdb = async (path, params = {}, retries = 2) => {
  try {
    return await axios.get(`${TMDB_BASE}${path}`, { 
      params: { api_key: TMDB_KEY, ...params },
      timeout: 8000 
    });
  } catch (err) {
    if (retries > 0 && (err.code === 'ECONNRESET' || err.response?.status >= 500)) {
      return tmdb(path, params, retries - 1);
    }
    throw err;
  }
};

/**
 * Advanced Similarity Engine with Graceful Fallback
 */
async function getAdvancedSimilar(req, res) {
  const { id } = req.params;
  const { media_type = 'movie' } = req.query;
  const sourceId = parseInt(id);

  let sourceData;
  try {
    const sourceRes = await tmdb(`/${media_type}/${sourceId}`, { append_to_response: 'keywords' });
    sourceData = sourceRes.data;
  } catch (err) {
    return res.status(err.response?.status || 500).json({ error: "Failed to reach TMDB" });
  }

  try {
    // --- 1. DB-DEPENDENT LOGIC (Try-Catch) ---
    try {
      // Check Cache


      const cache = await SimilarityCache.findOne({ sourceMovieId: sourceId, mediaType: media_type }).lean();
      if (cache && (Date.now() - cache.lastComputed < 1000 * 60 * 60 * 24)) {
        return res.json(cache.results);
      }

      // Get/Create Source Vibe
      let sourceVibe = await MovieVibe.findOne({ movieId: sourceId });
      if (!sourceVibe) {
        const embedding = await getEmbedding(`${sourceData.title || sourceData.name}: ${sourceData.overview}`);
        const tags = await getVibeTags(sourceData);
        sourceVibe = await MovieVibe.create({ movieId: sourceId, embedding, tags, title: sourceData.title || sourceData.name });
      }

      // Collaborative Filtering
      const usersWithBookmark = await User.find({ bookmarks: sourceId }, 'bookmarks').lean();
      const coOccurrence = {};
      usersWithBookmark.forEach(u => {
        u.bookmarks.forEach(bid => { if (bid !== sourceId) coOccurrence[bid] = (coOccurrence[bid] || 0) + 1; });
      });
      const maxFreq = Math.max(...Object.values(coOccurrence), 1);
      const cfScores = {};
      Object.keys(coOccurrence).forEach(bid => { cfScores[bid] = (coOccurrence[bid] / maxFreq); });

      // Fetch Candidates
      const [recs, sims] = await Promise.all([
        tmdb(`/${media_type}/${sourceId}/recommendations`),
        tmdb(`/${media_type}/${sourceId}/similar`)
      ]);
      let candidates = [...recs.data.results, ...sims.data.results];

      const uniqueCandidates = Array.from(new Map(candidates.map(c => [c.id, c])).values()).filter(c => c.id !== sourceId).slice(0, 40);

      // Hybrid Scoring
      const sourceGenres = sourceData.genres?.map(g => g.id) || [];
      const scoredResults = await Promise.all(uniqueCandidates.map(async (movie) => {
        const genreOverlap = (movie.genre_ids || []).filter(g => sourceGenres.includes(g)).length;
        const contentScore = genreOverlap / Math.max(sourceGenres.length, 1);

        let movieVibe = await MovieVibe.findOne({ movieId: movie.id });
        if (!movieVibe) {
          const embedding = await getEmbedding(`${movie.title || movie.name}: ${movie.overview}`);
          movieVibe = await MovieVibe.create({ movieId: movie.id, embedding, title: movie.title || movie.name });
        }
        const semanticScore = cosineSimilarity(sourceVibe.embedding, movieVibe.embedding);
        const cfScore = cfScores[movie.id] || 0;
        const finalScore = (cfScore * 0.4) + (contentScore * 0.3) + (semanticScore * 0.3);

        return { ...movie, similarity_score: Math.round(finalScore * 100), vibe_tags: movieVibe.tags || [], cf_boost: cfScore > 0 };
      }));

      const topResults = scoredResults.sort((a, b) => b.similarity_score - a.similarity_score).slice(0, 30);

      // Add Explanations
      topResults.forEach((movie, idx) => {
        if (idx < 10) movie.reason = `Thematic match with ${sourceVibe.tags?.slice(0,2).join(' & ')} vibes.`;
      });

      // Create a cleaned version for the cache
      const cachedResults = topResults.map(m => ({
        id: m.id,
        title: m.title,
        name: m.name,
        poster_path: m.poster_path,
        backdrop_path: m.backdrop_path,
        vote_average: m.vote_average,
        similarity_score: m.similarity_score,
        vibe_tags: m.vibe_tags,
        reason: m.reason
      }));

      // Async Cache (non-blocking)
      SimilarityCache.create({ 
        sourceMovieId: sourceId, 
        mediaType: media_type, 
        results: cachedResults,
        lastComputed: new Date()
      }).catch(e => console.error('Cache save failed:', e.message));

      return res.json(topResults);


    } catch (dbErr) {
      console.error('Database connection lost, falling back to LITE mode:', dbErr.message);
      
      // --- 2. LITE FALLBACK (TMDB ONLY) ---
      const recsRes = await tmdb(`/${media_type}/${sourceId}/recommendations`);
      const results = recsRes.data.results.map(movie => ({
        ...movie,
        similarity_score: 70, // Baseline score
        reason: "Recommended based on similar genres and audience trends."
      }));
      return res.json(results);
    }

  } catch (err) {
    console.error('Similarity Engine Fatal Error:', err.message);
    res.status(500).json({ error: "System encountered an error. Please try again." });
  }
}

module.exports = { getAdvancedSimilar };
