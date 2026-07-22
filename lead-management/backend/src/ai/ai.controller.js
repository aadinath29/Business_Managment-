const { GoogleGenAI } = require('@google/genai');
const aiService = require('./ai.service');

// Initialize the SDK. It automatically picks up GEMINI_API_KEY from environment.
const ai = new GoogleGenAI({});

// Define the tool for the AI
const searchLeadsTool = {
  name: 'searchLeads',
  description: 'Search the database for leads based on priority, status, or keyword. Use this tool if the user asks questions about their leads.',
  parameters: {
    type: 'OBJECT',
    properties: {
      priority: {
        type: 'STRING',
        description: 'The priority level to filter by, e.g., "High", "Medium", "Low".'
      },
      status: {
        type: 'STRING',
        description: 'The status to filter by, e.g., "New", "Contacted", "Qualified".'
      },
      keyword: {
        type: 'STRING',
        description: 'A general search term to find a lead by name, company, or email.'
      }
    }
  }
};

const handleChat = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // 1. Send the user's message to Gemini with the tool definition
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: message,
      config: {
        tools: [{ functionDeclarations: [searchLeadsTool] }],
        systemInstruction: "You are a helpful business management AI assistant. You can search for leads using the provided tools. Be concise and polite."
      }
    });

    let finalResponseText = '';

    // 2. Check if the AI decided to call a function
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      
      if (call.name === 'searchLeads') {
        const { priority, status, keyword } = call.args;
        
        // 3. Execute the local function
        console.log(`AI called searchLeads with priority=${priority}, status=${status}, keyword=${keyword}`);
        const leads = await aiService.searchLeads(priority, status, keyword);
        
        // 4. Extract the model's response content and user/function messages safely
        const userContent = { role: 'user', parts: [{ text: message }] };
        
        const modelContent = response.candidates?.[0]?.content;
        if (!modelContent) {
          throw new Error('No content returned from the model response.');
        }

        const functionResponseContent = { 
          role: 'user', 
          parts: [{ 
            functionResponse: {
              name: 'searchLeads',
              response: { leads }
            }
          }] 
        };

        const followUpResponse = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: [userContent, modelContent, functionResponseContent]
        });
        
        finalResponseText = followUpResponse.text;
      }
    } else {
      // The AI didn't call a tool, just replied normally
      finalResponseText = response.text;
    }

    res.json({ reply: finalResponseText });
  } catch (error) {
    console.error('AI Chat Error:', error);
    
    // Check if it is a Quota Exceeded error (429)
    if (error.status === 429) {
      return res.status(429).json({ error: 'Google Gemini API Quota Exceeded. Please check your API key credits or try again later.' });
    }
    
    // Check for Model Not Found / Deprecated for new users (404)
    if (error.status === 404) {
      return res.status(404).json({ error: 'The AI model version requested is no longer available to this API key. Please check the backend model configuration.' });
    }
    
    // Check for authentication / missing key error
    if (error.message && error.message.includes('API key')) {
      return res.status(401).json({ error: 'API Key missing or invalid. Please check your backend .env file.' });
    }
    
    // Check for High Demand (503)
    if (error.status === 503) {
      return res.status(503).json({ error: 'Google Gemini is currently experiencing high demand. Please try again in a few moments.' });
    }

    // Generic error
    res.status(500).json({ error: 'Failed to process AI request. The server encountered an unexpected error.' });
  }
};

module.exports = {
  handleChat
};
