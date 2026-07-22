require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const runTest = async () => {
  console.log('Testing Gemini API...');
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Hello, this is a test. Reply with OK.',
    });
    console.log('API is working! Response:', response.text);
  } catch (error) {
    console.error('API Error:', error.message);
  }
};

runTest();
