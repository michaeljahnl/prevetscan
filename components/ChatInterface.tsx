import React, { useState, useRef, useEffect } from 'react';

import { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';
import Button from './Button';

interface ChatInterfaceProps {
  onBack: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm your AI Vet Assistant. I can check symptoms or **audit vet quotes** for fair pricing. How can I help?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Reset input value so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !attachedImage) || isLoading) return;

    const currentImage = attachedImage;
    setAttachedImage(null);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      image: currentImage || undefined,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const tempId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: tempId,
      role: 'model',
      text: '',
      isThinking: true,
      timestamp: Date.now()
    }]);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const imageForService = currentImage ? currentImage.split(',')[1] : null;

      // Call YOUR serverless function
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history,
          message: userMessage.text || "Analyze this image.",
          image: imageForService,
          useDeepThinking: isThinkingMode
        })
      });

      if (!response.ok) throw new Error('Chat failed');

      // Read the streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          fullResponse += chunk;
          
          setMessages(prev => prev.map(msg => 
            msg.id === tempId 
              ? { ...msg, text: fullResponse, isThinking: false } 
              : msg
          ));
        }
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, text: "I'm having trouble connecting right now. Please try again.", isThinking: false } 
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden my-4 border border-slate-200">
      {/* Header */}
      <div className="bg-slate-800 p-4 flex items-center justify-between text-white">
        <div className="flex items-center space-x-3">
          <Button variant="secondary" onClick={onBack} className="!p-1.5 !rounded-full bg-slate-700 hover:bg-slate-600">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
             </svg>
          </Button>
          <div>
            <h2 className="font-bold text-lg">Dr. AI Assistant</h2>
            <div className="flex items-center text-xs text-slate-300 space-x-2">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                Online
              </span>
              <span>•</span>
              <span>Gemini 3 Pro</span>
            </div>
          </div>
        </div>
        
        {/* Thinking Toggle */}
        <div className="flex items-center space-x-2 bg-slate-900/50 p-1.5 rounded-lg border border-slate-600/50">
          <span className={`text-xs font-medium ${isThinkingMode ? 'text-teal-400' : 'text-slate-400'}`}>
            Deep Reasoning
          </span>
          <button 
            onClick={() => setIsThinkingMode(!isThinkingMode)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isThinkingMode ? 'bg-teal-600' : 'bg-slate-600'}`}
          >
            <span 
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isThinkingMode ? 'translate-x-4.5' : 'translate-x-1'}`} 
            />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-teal-600 text-white rounded-br-none' 
                  : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'
              }`}
            >
              {msg.image && (
                <div className="mb-3">
                  <img src={msg.image} alt="User upload" className="rounded-lg max-h-48 border border-white/20" />
                </div>
              )}
              {msg.isThinking && !msg.text ? (
                <div className="flex space-x-1 h-6 items-center">
                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                   <span className="text-xs text-slate-400 ml-2">Thinking...</span>
                </div>
              ) : (
                <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : ''}`}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
         {/* Attachment Preview */}
         {attachedImage && (
           <div className="flex items-center mb-3 bg-slate-100 p-2 rounded-lg w-fit animate-fade-in">
             <div className="relative">
               <img src={attachedImage} className="w-12 h-12 object-cover rounded border border-slate-300" alt="Preview" />
               <button 
                 onClick={() => setAttachedImage(null)}
                 className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600"
               >
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
               </button>
             </div>
             <span className="ml-3 text-xs text-slate-500 font-medium">Ready to analyze</span>
           </div>
         )}
         
         {isThinkingMode && (
           <div className="mb-2 text-xs text-teal-600 flex items-center bg-teal-50 p-2 rounded border border-teal-100">
             <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
             Thinking Budget (32k tokens) active for complex queries.
           </div>
         )}
         
        <form onSubmit={handleSend} className="flex space-x-2 items-end">
          <input 
            type="file" 
            ref={fileInputRef}
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 mb-[1px] text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors border border-transparent hover:border-teal-200"
            title="Upload Vet Quote or Photo"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isThinkingMode ? "Describe the complex issue..." : "Ask a question or upload a quote..."}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-shadow"
              disabled={isLoading}
            />
          </div>
          
          <Button type="submit" disabled={(!input.trim() && !attachedImage) || isLoading} className="!rounded-xl mb-[1px]">
            <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;