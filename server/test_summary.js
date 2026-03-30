const axios = require('axios');
require('dotenv').config();

const TMDB_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const GROQ_KEY = process.env.GROQ_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

async function testSummary() {
  try {
    const movieId = 157336; // Interstellar
    console.log('Fetching reviews for Interstellar...');
    const res = await axios.get(`${TMDB_BASE}/movie/${movieId}/reviews`, { params: { api_key: TMDB_KEY } });
    const reviews = res.data.results || [];
    console.log(`Found ${reviews.length} reviews.`);

    if (reviews.length === 0) {
      console.log('No reviews found.');
      return;
    }

    const combinedReviews = reviews
      .slice(0, 5)
      .map(r => `Author: ${r.author}\nContent: ${r.content}`)
      .join('\n\n')
      .slice(0, 3000);

    const prompt = `Summarize these reviews: ${combinedReviews}`;

    if (GROQ_KEY) {
      console.log('Testing Groq summary...');
      try {
        const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'mixtral-8x7b-32768',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
          max_tokens: 300
        }, {
          headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
          timeout: 10000
        });
        console.log('Groq Success:', groqRes.data.choices[0].message.content);
      } catch (e) {
        console.error('Groq Failure:', e.response?.data || e.message);
      }
    }

    if (GEMINI_KEY) {
      console.log('Testing Gemini summary...');
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
        const geminiRes = await axios.post(geminiUrl, {
          contents: [{ parts: [{ text: prompt }] }]
        }, { timeout: 10000 });
        console.log('Gemini Success:', geminiRes.data.candidates[0].content.parts[0].text);
      } catch (e) {
        console.error('Gemini Failure:', e.response?.data || e.message);
      }
    }
  } catch (err) {
    console.error('Failure:', err.response?.data || err.message);
  }
}

testSummary();
