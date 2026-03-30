const express = require('express');
const axios = require('axios');

const router = express.Router();
const { getAdvancedSimilar } = require('../controllers/similarityController');

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_KEY = process.env.TMDB_API_KEY;
const OMDB_KEY = process.env.OMDB_API_KEY;

const tmdb = (path, params = {}) =>
  axios.get(`${TMDB_BASE}${path}`, { params: { api_key: TMDB_KEY, ...params } });

// Search movies/tv/multi with suggestions
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, language = 'en-US' } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });

    const { data } = await tmdb('/search/multi', { query: q, page, language, include_adult: false });
    const results = data.results.filter(r => r.media_type === 'movie' || r.media_type === 'tv');
    res.json({ results, total_pages: data.total_pages, total_results: data.total_results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trending fallback
router.get('/trending', async (req, res) => {
  try {
    const { time_window = 'week' } = req.query;
    const { data } = await tmdb(`/trending/all/${time_window}`);
    res.json(data.results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get 30+ similar movies based on vibe, tone, themes (Advanced Engine)
router.get('/similar/:id', getAdvancedSimilar);
router.get('/recommend/:id', getAdvancedSimilar);

// Full movie details with OMDB ratings
router.get('/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { media_type = 'movie' } = req.query;

    const [detailRes, creditsRes, videosRes, watchRes] = await Promise.allSettled([
      tmdb(`/${media_type}/${id}`, { append_to_response: 'external_ids,keywords' }),
      tmdb(`/${media_type}/${id}/credits`),
      tmdb(`/${media_type}/${id}/videos`, { language: 'en-US' }),
      tmdb(`/${media_type}/${id}/watch/providers`),
    ]);

    if (detailRes.status === 'rejected') {
      console.error(`TMDB Detail Error (${id}):`, detailRes.reason.message);
      return res.status(404).json({ error: 'Movie not found' });
    }

    const detail = detailRes.value.data;
    const credits = creditsRes.status === 'fulfilled' ? creditsRes.value.data : { cast: [], crew: [] };
    const videos = videosRes.status === 'fulfilled' ? videosRes.value.data.results : [];
    const watchProviders = watchRes.status === 'fulfilled' ? watchRes.value.data.results : {};

    // Get trailer
    const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') ||
                    videos.find(v => v.site === 'YouTube');

    // Get OMDB data for IMDB rating if we have an IMDB id
    let omdbData = null;
    const imdbId = detail.external_ids?.imdb_id;
    if (imdbId && OMDB_KEY) {
      try {
        const omdbRes = await axios.get(`https://www.omdbapi.com/`, {
          params: { i: imdbId, apikey: OMDB_KEY }
        });
        if (omdbRes.data.Response === 'True') omdbData = omdbRes.data;
      } catch (e) { /* ignore OMDB errors */ }
    }

    // Vibe scores computed from genres & keywords
    const genreIds = (detail.genres || detail.genre_ids || []).map(g => typeof g === 'object' ? g.id : g);
    const keywords = (detail.keywords?.keywords || detail.keywords?.results || []).map(k => k.name.toLowerCase());

    const vibeScore = (keyword_list, bonus_genres = []) => {
      const kwScore = keywords.filter(k => keyword_list.some(kw => k.includes(kw))).length;
      const genreBonus = bonus_genres.filter(g => genreIds.includes(g)).length;
      return Math.min(10, kwScore * 2 + genreBonus * 3 + 1);
    };

    const vibe = {
      action: vibeScore(['action', 'fight', 'battle', 'war', 'combat', 'explosion'], [28, 10752]),
      comedy: vibeScore(['comedy', 'funny', 'humor', 'laugh', 'satire', 'parody'], [35]),
      dark: vibeScore(['dark', 'death', 'murder', 'crime', 'villain', 'dystopia', 'psychological'], [27, 53, 80]),
      romance: vibeScore(['love', 'romance', 'relationship', 'wedding', 'kiss'], [10749]),
      violence: vibeScore(['violence', 'blood', 'brutal', 'gore', 'torture', 'kill'], [27, 53]),
    };

    res.json({
      ...detail,
      credits,
      trailer: trailer ? { key: trailer.key, name: trailer.name } : null,
      watchProviders,
      omdb: omdbData,
      vibe,
    });
  } catch (err) {
    console.error('Detail Route Exception:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Actor/person details
router.get('/person/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [personRes, creditsRes] = await Promise.all([
      tmdb(`/person/${id}`),
      tmdb(`/person/${id}/combined_credits`),
    ]);

    const person = personRes.data;
    const credits = creditsRes.data;

    // Top movies sorted by popularity
    const topMovies = [...(credits.cast || [])].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 12);

    res.json({ ...person, topMovies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Compare two movies (Advanced Engine)
router.get('/compare/:id1/:id2', async (req, res) => {
  try {
    const { id1, id2 } = req.params;
    const { media_type = 'movie' } = req.query;

    const [res1, res2] = await Promise.allSettled([
      tmdb(`/${req.query.media_type1 || 'movie'}/${id1}`, { append_to_response: 'external_ids,keywords,credits,reviews' }),
      tmdb(`/${req.query.media_type2 || 'movie'}/${id2}`, { append_to_response: 'external_ids,keywords,credits,reviews' }),
    ]);
    
    if (res1.status === 'rejected' || res2.status === 'rejected') {
       const failed = res1.status === 'rejected' ? res1 : res2;
       throw new Error(`Failed to build the arena: ${failed.reason.message || 'Third-party API error'}`);
    }

    const compute = (result) => {
      if (result.status === 'rejected') return null;
      const detail = result.value.data;
      const genreIds = detail.genres?.map(g => g.id) || [];
      const keywords = (detail.keywords?.keywords || detail.keywords?.results || []).map(k => k.name.toLowerCase());
      
      const vibeScore = (kw_list, bonus = []) =>
        Math.min(10, keywords.filter(k => kw_list.some(kw => k.includes(kw))).length * 2 + bonus.filter(g => genreIds.includes(g)).length * 3 + 1);

      const topCast = detail.credits?.cast?.slice(0, 5) || [];
      const starPower = topCast.reduce((acc, c) => acc + (c.popularity || 0), 0) / Math.max(topCast.length, 1);

      return {
        id: detail.id,
        title: detail.title || detail.name,
        poster_path: detail.poster_path,
        backdrop_path: detail.backdrop_path,
        vote_average: detail.vote_average,
        popularity: detail.popularity,
        genres: detail.genres || [],
        overview: detail.overview,
        runtime: detail.runtime,
        release_date: detail.release_date || detail.first_air_date,
        media_type: detail.media_type || media_type,
        genreIds,
        keywords,
        star_power: starPower,
        cast: detail.credits?.cast || [],
        reviews: detail.reviews?.results || [],
        vibe: {
          action: vibeScore(['action', 'fight', 'battle', 'war'], [28]),
          comedy: vibeScore(['comedy', 'funny', 'humor'], [35]),
          dark: vibeScore(['dark', 'death', 'murder', 'crime'], [27, 53]),
          romance: vibeScore(['love', 'romance'], [10749]),
          violence: vibeScore(['violence', 'blood', 'brutal'], [27]),
          story: vibeScore(['mystery', 'twist', 'complex', 'philosophy'], [96, 18, 53]), // Story complexity
          pacing: vibeScore(['fast', 'thrill', 'intense', 'suspense'], [53, 27]), // Pacing vibe
        }
      };
    };

    const m1 = compute(res1);
    const m2 = compute(res2);

    // 1. Shared Cast
    const sharedCast = m1.cast.filter(c1 => m2.cast.some(c2 => c1.id === c2.id)).slice(0, 10);

    // 2. Audience Overlap
    const union = new Set([...m1.genreIds, ...m2.genreIds]);
    const intersection = m1.genreIds.filter(g => m2.genreIds.includes(g));
    const audienceOverlap = union.size > 0 ? Math.round((intersection.length / union.size) * 100) : 0;

    // 3. Scoring System
    // final_score = (0.25 × rating) + (0.20 × popularity) + (0.20 × vibe_match) + (0.15 × awards) + (0.20 × audience_sentiment)
    // For simplicity, vibe_match is keyword similarity, awards is based on popularity/rating combo here, audience_sentiment from reviews later
    
    const normalize = (val, max) => Math.min(10, (val / max) * 10);
    
    const s1 = {
      rating: m1.vote_average,
      popularity: normalize(m1.popularity, 2000), 
      vibe: Object.values(m1.vibe).reduce((a, b) => a + b, 0) / 7,
      awards: normalize(m1.popularity * (m1.vote_average/5), 3000), // Proxy for awards if OMDB not reached yet
      audience: 7.5, // Default placeholder for sentiment
    };

    const s2 = {
      rating: m2.vote_average,
      popularity: normalize(m2.popularity, 2000),
      vibe: Object.values(m2.vibe).reduce((a, b) => a + b, 0) / 7,
      awards: normalize(m2.popularity * (m2.vote_average/5), 3000),
      audience: 7.5,
    };

    const calcFinal = (s) => (s.rating * 0.25 * 1.25) + (s.popularity * 0.2) + (s.vibe * 2.0) + (s.awards * 1.5) + (s.audience * 2.0);
    
    // 4. AI Insights Layer
    let insights = null;
    const aiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
    if (aiKey) {
      const prompt = `COMPARE these two movies:
      Movie A: ${m1.title} (${m1.overview.slice(0, 200)}...)
      Movie B: ${m2.title} (${m2.overview.slice(0, 200)}...)
      
      Audience Consensus for A: ${m1.reviews.slice(0, 2).map(r => r.content.slice(0, 100)).join('; ')}
      Audience Consensus for B: ${m2.reviews.slice(0, 2).map(r => r.content.slice(0, 100)).join('; ')}

      Return a JSON object:
      {
        "winner_id": ${m1.vote_average > m2.vote_average ? m1.id : m2.id},
        "recommendation": "Short 1-sentence winner recommendation",
        "watch_a_if": "Reason to watch Movie A",
        "watch_b_if": "Reason to watch Movie B",
        "pros_a": ["pro1", "pro2"],
        "cons_a": ["con1", "con2"],
        "pros_b": ["pro1", "pro2"],
        "cons_b": ["con1", "con2"],
        "audience_sentiment": "Overall comparison sentiment",
        "audience_type": "Best for [type] viewers",
        "scoring_explanation": "Why the winner was chosen"
      }`;

      try {
        if (process.env.GROQ_API_KEY) {
          const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
          }, { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, timeout: 8000 });
          insights = JSON.parse(groqRes.data.choices[0].message.content);
        } else if (process.env.GEMINI_API_KEY) {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;
          const geminiRes = await axios.post(geminiUrl, { contents: [{ parts: [{ text: prompt + " (Return JSON only)" }] }] });
          const text = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          insights = JSON.parse(text.replace(/```json|```/g, ''));
        }
      } catch (e) {
        console.error('Comparison AI Error:', e.message);
      }
    }

    res.json({
      movie1: m1,
      movie2: m2,
      audienceOverlap,
      genreOverlap: intersection.length,
      sharedCast,
      scores: {
        movie1: Math.round(calcFinal(s1)),
        movie2: Math.round(calcFinal(s2)),
        breakdown: {
          rating: [m1.vote_average, m2.vote_average],
          popularity: [s1.popularity, s2.popularity],
          vibe: [s1.vibe, s2.vibe],
          awards: [s1.awards, s2.awards],
          audience: [s1.audience, s2.audience]
        }
      },
      insights
    });
  } catch (err) {
    console.error('Comparison Route Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Discover with filters
router.get('/discover', async (req, res) => {
  try {
    const { genre, language, sort_by = 'popularity.desc', page = 1, media_type = 'movie' } = req.query;
    const params = { sort_by, page, 'vote_count.gte': 50 };
    if (genre) params.with_genres = genre;
    if (language) params.with_original_language = language;

    const { data } = await tmdb(`/discover/${media_type}`, params);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Streaming availability (RapidAPI)
router.get('/streaming/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { media_type = 'movie', country = 'in' } = req.query; // Default to India as per user request
    
    if (!process.env.RAPIDAPI_KEY) {
      return res.json({ result: null, error: 'RapidAPI key missing' });
    }

    // RapidAPI Streaming Availability V2
    const options = {
      method: 'GET',
      url: 'https://streaming-availability.p.rapidapi.com/v2/get/basic',
      params: { 
        tmdb_id: `${media_type}/${id}`,
        country: country.toLowerCase()
      },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'streaming-availability.p.rapidapi.com'
      }
    };

    const { data } = await axios.request(options);
    res.json(data);
  } catch (err) {
    console.error(`Streaming API Error (${req.params.id}):`, err.response?.data || err.message);
    res.json({ result: null, error: err.message });
  }
});

// TMDB User Reviews
router.get('/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { media_type = 'movie', page = 1 } = req.query;
    
    // Use try-catch specifically for the TMDB call to avoid 500ing the whole route if reviews fail
    try {
      const { data } = await tmdb(`/${media_type}/${id}/reviews`, { page });
      res.json(data);
    } catch (tmdbErr) {
      console.error(`TMDB Reviews Error for ${id}:`, tmdbErr.message);
      res.json({ results: [], page: 1, total_pages: 0, total_results: 0 }); // Graceful fallback
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Review Summary (Groq/Gemini)
router.get('/reviews-summary/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { media_type = 'movie', title = 'this movie' } = req.query;
    
    // 1. Fetch reviews from TMDB
    let reviews = [];
    try {
      const { data: reviewsData } = await tmdb(`/${media_type}/${id}/reviews`);
      reviews = reviewsData.results || [];
    } catch (e) {
      console.error(`Reviews fetch failed for ${id}:`, e.message);
    }
    
    if (reviews.length === 0) {
      return res.json({ summary: "No user reviews available yet for this title." });
    }

    // 2. Prepare text for AI (up to ~3000 chars)
    const combinedReviews = reviews
      .slice(0, 5)
      .map(r => `Author: ${r.author}\nContent: ${r.content}`)
      .join('\n\n')
      .slice(0, 3000);

    const prompt = `You are a movie critic assistant. Summarize the following user reviews for "${title}" into a concise, 3-4 sentence paragraph highlighting the consensus on plot, acting, and overall vibe. Be objective.
    
    REVIEWS:
    ${combinedReviews}`;

    // 3. Try Groq (Primary)
    if (process.env.GROQ_API_KEY) {
      try {
        const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'mixtral-8x7b-32768',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
          max_tokens: 300
        }, {
          headers: { 
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 
            'Content-Type': 'application/json' 
          },
          timeout: 8000
        });
        if (groqRes.data?.choices?.[0]?.message?.content) {
          return res.json({ summary: groqRes.data.choices[0].message.content });
        }
      } catch (e) {
        console.error('Groq AI Error:', e.response?.data || e.message);
      }
    }

    // 4. Fallback to Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        // Updated URL and model for better compatibility
        const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const geminiRes = await axios.post(geminiUrl, {
          contents: [{ parts: [{ text: prompt }] }]
        }, { timeout: 8000 });
        
        if (geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          return res.json({ summary: geminiRes.data.candidates[0].content.parts[0].text });
        }
      } catch (e) {
        console.error('Gemini AI Error:', e.response?.data || e.message);
      }
    }

    res.json({ summary: "Audience says: A compelling watch with strong performances and a unique atmosphere. (AI summary unavailable)" });
  } catch (err) {
    console.error('Reviews Summary Exception:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
