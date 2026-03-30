const axios = require('axios');
require('dotenv').config();

async function testGroq() {
  const key = process.env.GROQ_API_KEY;
  try {
    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: 'Hello' }]
    }, {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    console.log('✅ Groq works! Output:', res.data.choices[0].message.content);
  } catch (err) {
    console.log('❌ Groq failed:', err.response?.data || err.message);
  }
}

testGroq();
