require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const db = require('./src/database');
const aiService = require('./src/ai/ai.service');

const runTest = async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const searchLeadsTool = {
    name: 'searchLeads',
    description: 'Search the database for leads based on priority, status, or keyword.',
    parameters: {
      type: 'OBJECT',
      properties: {
        priority: { type: 'STRING' }
      }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: "give me all leads",
      config: { tools: [{ functionDeclarations: [searchLeadsTool] }] }
    });
    
    if (response.functionCalls && response.functionCalls.length > 0) {
      console.log('Model Parts:', JSON.stringify(response.candidates[0].content.parts, null, 2));
      
      const leads = await aiService.searchLeads(null, null, null);
      
      const followUpResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          { role: 'user', parts: [{ text: "give me all leads" }] },
          response.candidates[0].content, // Pass the EXACT model content back
          { 
            role: 'user', 
            parts: [{ 
              functionResponse: {
                name: 'searchLeads',
                response: { leads: leads }
              }
            }] 
          }
        ],
        config: { tools: [{ functionDeclarations: [searchLeadsTool] }] }
      });
      console.log("Final Response:", followUpResponse.text);
    }
  } catch (error) {
    console.error('Test Error:', error);
  } finally {
      if (db && db.pool) await db.pool.end();
  }
};

runTest();
