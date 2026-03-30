const axios = require('axios');

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;

/**
 * Get semantic embeddings from Google Gemini
 */
async function getEmbedding(text) {
  if (!GEMINI_KEY) return null;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_KEY}`;
    const response = await axios.post(url, {
      content: { parts: [{ text }] }
    });
    return response.data.embedding.values;
  } catch (err) {
    console.error('Gemini Embedding Error:', err.response?.data || err.message);
    return null;
  }
}

/**
 * Generate descriptive "vibe" tags using Groq (Mixtral)
 */
async function getVibeTags(movie) {
  if (!GROQ_KEY) return ['action', 'drama']; // Fallback
  
  const prompt = `Analyze the movie "${movie.title}" (${movie.release_date || ''}). 
  Overview: ${movie.overview}
  Keywords: ${movie.keywords?.map(k => k.name).join(', ')}
  
  Return exactly 5 highly descriptive personality/vibe tags (e.g., "chaotic energy", "dark humor", "slow-burn", "visually stunning", "witty dialogue").
  Format: comma-separated list only.`;

  try {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'mixtral-8x7b-32768',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 100
    }, {
      headers: { 'Authorization': `Bearer ${GROQ_KEY}` }
    });
    
    const content = response.data.choices[0].message.content;
    return content.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
  } catch (err) {
    console.error('Groq Vibe Error:', err.message);
    return ['cinematic', 'engaging'];
  }
}

/**
 * Cosine Similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

module.exports = { getEmbedding, getVibeTags, cosineSimilarity };
