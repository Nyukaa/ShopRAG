"use client";

import { createElement as h, useState, useEffect, useRef } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate a unique session ID when the user enters the page
  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  // Auto-scroll to the bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessageText = input;
    setInput("");
    setIsLoading(true);

    // Add the user's message to the chat
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: userMessageText,
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Request to the Next.js API route, which will forward the request to the FastAPI service
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessageText, sessionId }),
      });

      const data = await response.json();

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: data.reply,
          },
        ]);
      } else {
        throw new Error(
          data.error || "Something went wrong with the AI service.",
        );
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "❌ An error occurred while sending the request. Please ensure the Python server is running.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-stone-50 border-x border-stone-200">
      {/* Header of the chat */}
      <header className="p-4 border-b border-stone-200 bg-white flex justify-between items-center">
        <div>
          <h1 className="font-semibold text-stone-800 text-lg">
            Nordic Shop Assistant
          </h1>
          <p className="text-xs text-emerald-600 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            MCP Agent Online
          </p>
        </div>
      </header>

      {/* Messages window */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-stone-400 py-12 text-sm">
            Hi! I am your Nordic-shop assistant. Ask me about lamps or stock
            availability.
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-stone-800 text-white rounded-br-none"
                  : "bg-white text-stone-800 border border-stone-200 rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Indicator that the assistant is thinking or calling tools */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-stone-500 border border-stone-200 rounded-2xl rounded-bl-none px-4 py-2.5 text-sm flex items-center gap-2 shadow-sm">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </span>
              <span className="text-xs text-stone-400">
                I am looking in the product catalog...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Form for sending messages */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 bg-white border-t border-stone-200"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Спросите про лампы..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 text-sm disabled:bg-stone-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-stone-800 text-white font-medium rounded-xl text-sm hover:bg-stone-700 transition-colors disabled:bg-stone-200 disabled:text-stone-400"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
