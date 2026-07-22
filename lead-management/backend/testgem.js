require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({});

async function test() {
  try {
    const response = await ai.models.list();
    console.log(response);
    if (response.data) {
        console.log(response.data.map(m => m.name));
    }
  } catch (err) {
    console.error(err);
  }
}
test();
