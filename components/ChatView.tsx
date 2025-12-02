import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { ChatMessage, UserSettings, Cycle } from '../types';
import { chatWithLuna } from '../services/geminiService';
import { storageService } from '../services/storageService';

interface ChatViewProps {
  settings: UserSettings;
  latestCycle: Cycle;
}

const SUGGESTED_QUESTIONS = [
  "Is my cycle length normal?",
  "Why do I have cramps?",
  "Signs of ovulation?",
  "How to reduce bloating?",
  "Tips for PMS?"
];

export const ChatView: React.FC<ChatViewProps> = ({ settings, latestCycle }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  // Load history strictly once on mount
  useEffect(() => {
      const history = storageService.getChatHistory();
      if (history && history.length > 0) {
          setMessages(history);
      } else {
          setMessages([{
            id: 'welcome',
            role: 'model',
            text: `Hi ${settings.name}! I'm Flow. How are you feeling today? You can ask me about your cycle, symptoms, or sexual health.`,
            timestamp: Date.now()
          }]);
      }
      isFirstLoad.current = false;
  }, []);

  // Save history whenever messages change, but skip the initial empty state if pertinent
  useEffect(() => {
      if (!isFirstLoad.current && messages.length > 0) {
          storageService.saveChatHistory(messages);
      }
      scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    // Small timeout to ensure DOM is updated
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async (text: string = inputText) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: Date.now()
    };

    // Optimistic update
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    let ageContext = "";
    if (settings.dob) {
        const birthDate = new Date(settings.dob);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs); 
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        ageContext = `User Age: ${age}`;
    }

    const context = `
      User Name: ${settings.name}
      ${ageContext}
      Cycle Length: ${settings.avgCycleLength} days
      Period Length: ${settings.avgPeriodLength} days
      Last Period Start: ${latestCycle.startDate}
      Cycle Day: ${Math.floor((Date.now() - new Date(latestCycle.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}
    `;

    // Context window: Last 10 messages
    const responseText = await chatWithLuna(messages.slice(-10), userMsg.text, context);

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText || "I'm having trouble thinking right now. Could you ask me that again?",
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  const handleClearChat = () => {
      if(window.confirm("Are you sure you want to clear the chat history?")) {
          const resetMsg: ChatMessage = {
            id: 'welcome-' + Date.now(),
            role: 'model',
            text: `Chat cleared! How can I help you now, ${settings.name}?`,
            timestamp: Date.now()
          };
          setMessages([resetMsg]);
          storageService.saveChatHistory([resetMsg]);
      }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: number) => {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    // Use dvh (Dynamic Viewport Height) for better mobile browser support
    <div className="h-[calc(100dvh-150px)] md:h-[calc(100dvh-100px)] flex flex-col bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-purple-500/5 dark:shadow-none overflow-hidden animate-fade-in-up border border-gray-100 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shadow-lg shadow-purple-500/30">
                <img src="https://iili.io/fC1i0s1.md.jpg" alt="Flow Index Logo" className="w-full h-full object-cover" />
            </div>
            <div className="ml-3">
                <h3 className="font-bold text-gray-900 dark:text-white leading-tight">Flow AI</h3>
                <p className="text-xs text-green-500 font-bold flex items-center">
                    <span className="relative flex h-2 w-2 mr-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Online
                </p>
            </div>
        </div>
        <button 
            onClick={handleClearChat} 
            className="p-2 text-gray-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 rounded-full transition-colors" 
            title="Clear Chat"
        >
            <Trash2 size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 dark:bg-gray-900 scroll-smooth">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[75%] px-4 py-3 md:p-5 rounded-2xl text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-gray-900 dark:bg-purple-600 text-white rounded-br-none'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none shadow-gray-200 dark:shadow-none'
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1 font-medium flex items-center">
                {formatTime(msg.timestamp)}
            </span>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-bl-none border border-gray-100 dark:border-gray-700 shadow-sm flex space-x-2 items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150"></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Chips */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-3 overflow-x-auto no-scrollbar">
          <div className="flex space-x-2">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSend(q)}
                    disabled={isLoading}
                    className="flex-shrink-0 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-full border border-purple-100 dark:border-purple-800 transition-colors whitespace-nowrap disabled:opacity-50"
                  >
                      {q}
                  </button>
              ))}
          </div>
      </div>

      {/* Input */}
      <div className="p-3 md:p-4 bg-white dark:bg-gray-800 pb-safe">
        <div className="relative flex items-center">
            <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask Flow..."
                disabled={isLoading}
                className="w-full pl-5 pr-14 py-3 md:py-4 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-100 dark:border-gray-600 focus:border-purple-300 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/20 transition-all text-gray-800 dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 outline-none text-base disabled:opacity-70 disabled:bg-gray-100" 
            />
            <button 
                onClick={() => handleSend()}
                disabled={isLoading || !inputText.trim()}
                className="absolute right-2 p-2 bg-gray-900 dark:bg-purple-600 text-white rounded-xl hover:bg-black dark:hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-900/20"
            >
                <Send size={18} />
            </button>
        </div>
      </div>
    </div>
  );
};