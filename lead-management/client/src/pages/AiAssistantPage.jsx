import React, { useState } from 'react';
import apiClient from '../services/api/apiClient';

const AiAssistantPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { text: input, role: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/ai-assistant/chat', {
        message: userMessage.text,
      });

      const aiMessage = { text: response.data.reply, role: 'ai' };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      let errorMessage = 'Sorry, I encountered an unknown error.';
      
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = `Error: ${error.response.data.error}`;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      setMessages((prev) => [...prev, { text: errorMessage, role: 'ai', isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Chat with AI</h1>
      </div>
      <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-indigo-600">
          <h2 className="text-xl font-bold text-white">Lead Search Assistant</h2>
          <p className="text-indigo-200 text-sm">Ask me to find leads based on priority or status.</p>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-10">
              <p>No messages yet. Try asking:</p>
              <p className="italic">"Show me all high priority leads."</p>
            </div>
          )}
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] p-4 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : msg.isError
                    ? 'bg-red-100 text-red-800 rounded-bl-none border border-red-300'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-500 p-4 rounded-lg rounded-bl-none">
                <span className="animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your leads..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
        
      </div>
    </div>
  );
};

export default AiAssistantPage;
