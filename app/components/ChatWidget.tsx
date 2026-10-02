'use client';

import { useState, useEffect, useRef } from 'react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessageText = input;
    setInput('');
    setIsLoading(true);

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', text: userMessageText },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessageText, sessionId }),
      });

      const data = await response.json();

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', text: data.reply },
        ]);
      } else {
        throw new Error(data.error || 'Something went wrong');
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: '❌ Something went wrong sending that. Make sure the assistant service is running.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating panel — only rendered when open, sits above the launcher button */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[22rem] h-[32rem] bg-stone-50 border border-stone-200 rounded-2xl shadow-xl flex flex-col overflow-hidden">
          <header className="p-4 border-b border-stone-200 bg-white flex justify-between items-center shrink-0">
            <div>
              <h2 className="font-semibold text-stone-800 text-sm">Nordic Shop Assistant</h2>
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Online
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="text-stone-400 hover:text-stone-600 text-lg leading-none px-1"
            >
              ✕
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-stone-400 py-8 text-sm">
                Ask me about lamps, candles, or anything else in the shop.
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-stone-800 text-white rounded-br-none'
                      : 'bg-white text-stone-800 border border-stone-200 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-stone-500 border border-stone-200 rounded-2xl rounded-bl-none px-3.5 py-2 text-sm flex items-center gap-2 shadow-sm">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-stone-200 shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a product..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 text-sm disabled:bg-stone-50"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-3 py-2 bg-stone-800 text-white font-medium rounded-xl text-sm hover:bg-stone-700 transition-colors disabled:bg-stone-200 disabled:text-stone-400"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Launcher button — always visible, toggles the panel */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close chat assistant' : 'Open chat assistant'}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-stone-800 hover:bg-stone-700 text-white shadow-lg flex items-center justify-center transition-colors"
      >
        {isOpen ? (
          <span className="text-xl leading-none">✕</span>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        )}
      </button>
    </>
  );
}
