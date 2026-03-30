const User = require('../models/User');
const MovieVibe = require('../models/MovieVibe');
const SimilarityCache = require('../models/SimilarityCache');
const { getEmbedding, getVibeTags, cosineSimilarity } = require('../utils/ai');
const axios = require('axios');

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_KEY = process.env.TMDB_API_KEY;

const tmdb = (path, params = {}) =>
  axios.get(`${TMDB_BASE}${path}`, { params: { api_key: TMDB_KEY, ...params } });

/**
 * Advanced Similarity Engine
 */
async function getAdvancedSimilar(req, res) {
  const { id } = req.params;
  const { media_type = 'movie' } = req.query;
  const sourceId = parseInt(id);

  try {
    // 1. Check Cache
    const cache = await SimilarityCache.findOne({ sourceMovieId: sourceId, mediaType: media_type });
    if (cache && (Date.now() - cache.lastComputed < 1000 * 60 * 60 * 24)) {
      return res.json(cache.results);
    }

    // 2. Fetch Source Details
    const sourceRes = await tmdb(`/${media_type}/${sourceId}`, { append_to_response: 'keywords' });
    const sourceData = sourceRes.data;
    
    // Get/Create Source Vibe (Embedding & Tags)
    let sourceVibe = await MovieVibe.findOne({ movieId: sourceId });
    if (!sourceVibe) {
      const embedding = await getEmbedding(`${sourceData.title || sourceData.name}: ${sourceData.overview} ${sourceData.tagline || ''}`);
      const tags = await getVibeTags(sourceData);
      sourceVibe = await MovieVibe.create({ 
        movieId: sourceId, 
        embedding, 
        tags, 
        title: sourceData.title || sourceData.name 
      });
    }

    // 3. COLLABORATIVE FILTERING (40% Weight)
    const usersWithBookmark = await User.find({ bookmarks: sourceId }, 'bookmarks');
    const coOccurrence = {};
    usersWithBookmark.forEach(u => {
      u.bookmarks.forEach(bid => {
        if (bid !== sourceId) coOccurrence[bid] = (coOccurrence[bid] || 0) + 1;
      });
    });
    // Normalize CF scores
    const maxFreq = Math.max(...Object.values(coOccurrence), 1);
    const cfScores = {};
    Object.keys(coOccurrence).forEach(bid => {
      cfScores[bid] = (coOccurrence[bid] / maxFreq);
    });

    // 4. FETCH CANDIDATES (TMDB Recommendations + Similar + Mixed)
    const [recs, sims] = await Promise.all([
      tmdb(`/${media_type}/${sourceId}/recommendations`),
      tmdb(`/${media_type}/${sourceId}/similar`)
    ]);
    
    const candidates = [...recs.data.results, ...sims.data.results].slice(0, 50);
    // Deduplicate
    const uniqueCandidates = Array.from(new Map(candidates.map(c => [c.id, c])).values())
      .filter(c => c.id !== sourceId);

    // 5. COMPUTE HYBRID SCORES
    const sourceGenres = sourceData.genres?.map(g => g.id) || [];
    
    const scoredResults = await Promise.all(uniqueCandidates.map(async (movie) => {
      // Content Score (30%)
      const movieGenres = movie.genre_ids || [];
      const genreOverlap = movieGenres.filter(g => sourceGenres.includes(g)).length;
      const contentScore = genreOverlap / Math.max(sourceGenres.length, 1);

      // Semantic Score (30%)
      let movieVibe = await MovieVibe.findOne({ movieId: movie.id });
      if (!movieVibe) {
        const embedding = await getEmbedding(`${movie.title || movie.name}: ${movie.overview}`);
        movieVibe = await MovieVibe.create({ movieId: movie.id, embedding, title: movie.title || movie.name });
      }
      const semanticScore = cosineSimilarity(sourceVibe.embedding, movieVibe.embedding);
      
      // Collaborative Score (40% - if exists)
      const cfScore = cfScores[movie.id] || 0;

      // Final Weighting
      const finalScore = (cfScore * 0.4) + (contentScore * 0.3) + (semanticScore * 0.3);
      
      return {
        ...movie,
        similarity_score: Math.round(finalScore * 100),
        vibe_tags: movieVibe.tags || [],
        cf_boost: cfScore > 0
      };
    }));

    // Sort by Similarity
    const topResults = scoredResults
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, 30);

    // 6. Generate "Why Recommended" for Top 10
    const finalWithExplanations = await Promise.all(topResults.map(async (movie, idx) => {
      if (idx < 10) {
        // We just use a quick template for speed, or could call LLM
        movie.reason = `Matches ${sourceVibe.tags?.slice(0,2).join(' & ')} vibe with ${movie.cf_boost ? 'very high user overlap' : 'strong thematic similarity'}.`;
      }
      return movie;
    }));

    // Cache results
    await SimilarityCache.create({
      sourceMovieId: sourceId,
      mediaType: media_type,
      results: finalWithExplanations
    });

    res.json(finalWithExplanations);

  } catch (err) {
    console.error('Similarity Engine Exception:', err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAdvancedSimilar };
