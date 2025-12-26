'use client';

import { useState, useRef, useEffect } from 'react';
import { FaRobot, FaPaperPlane, FaTimes, FaMinus, FaLightbulb } from 'react-icons/fa';
import { useTransactions } from '../contexts/TransactionContext';
import { useCategories } from '../contexts/CategoryContext';
import { analyzeRequest } from '../services/ai';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm your Personal Finance AI. How can I help you today?", sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const { transactions } = useTransactions();
  const { categories } = useCategories();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await analyzeRequest(userMessage.text, transactions, categories);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: response.text, sender: 'ai' }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now() + 1, text: "Sorry, I encountered an error.", sender: 'ai' }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-primary text-white rounded-full shadow-lg hover:bg-primary-hover hover:scale-110 transition-all duration-300 z-50 flex items-center gap-2 group"
        aria-label="Open AI Assistant"
      >
        <FaRobot size={24} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
          Ask AI
        </span>
      </button>
    );
  }

  return (
    <div className={`fixed z-50 transition-all duration-300 ${
      isMinimized
        ? 'bottom-6 right-6 w-72'
        : 'bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-96 h-full sm:h-[600px]'
    }`}>
      <div className={`bg-white dark:bg-gray-800 shadow-2xl rounded-t-xl sm:rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden ${isMinimized ? 'h-14' : ''}`}>

        {/* Header */}
        <div className="bg-primary p-4 text-white flex justify-between items-center shrink-0 cursor-pointer" onClick={() => isMinimized && setIsMinimized(false)}>
          <div className="flex items-center gap-2">
            <FaRobot />
            <span className="font-semibold">Finance Assistant</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
              className="p-1 hover:bg-white/20 rounded"
            >
              <FaMinus size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); setIsMinimized(false); }}
              className="p-1 hover:bg-white/20 rounded"
            >
              <FaTimes size={12} />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg text-sm ${
                      msg.sender === 'user'
                        ? 'bg-primary text-white rounded-br-none'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm border dark:border-gray-700 rounded-bl-none'
                    }`}
                  >
                    {msg.sender === 'ai' && <FaLightbulb className="inline-block mr-2 text-yellow-500 mb-1" size={12} />}
                    <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg rounded-bl-none shadow-sm border dark:border-gray-700">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your spending..."
                  className="flex-1 px-4 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="p-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
