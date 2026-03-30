const axios = require('axios');
require('dotenv').config();

async function testGeminiModels() {
  const key = process.env.GEMINI_API_KEY;
  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro'
  ];

  for (const model of models) {
    console.log(`Testing model: ${model}...`);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await axios.post(url, {
        contents: [{ parts: [{ text: 'Hello' }] }]
      });
      console.log(`✅ ${model} works! Output:`, res.data.candidates[0].content.parts[0].text);
      break; 
    } catch (err) {
      console.log(`❌ ${model} failed:`, err.response?.data?.error?.message || err.message);
    }
  }
}

testGeminiModels();
