const axios = require('axios');
require('dotenv').config();

const TMDB_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';

async function testTMDB() {
  try {
    console.log('Testing TMDB with key:', TMDB_KEY);
    const res = await axios.get(`${TMDB_BASE}/movie/550`, { params: { api_key: TMDB_KEY } });
    console.log('Success!', res.data.title);
  } catch (err) {
    console.error('Failure:', err.response?.data || err.message);
  }
}

testTMDB();
