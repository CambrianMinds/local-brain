import dotenv from 'dotenv';
dotenv.config();

async function checkModels() {
  try {
    const res = await fetch('https://api.x.ai/v1/models', {
      headers: { 'Authorization': 'Bearer ' + process.env.XAI_API_KEY }
    });
    console.log('HTTP Status:', res.status);
    const data = await res.json();
    console.log('Available models for this key:\n', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Fetch error:', e);
  }
}

checkModels();
