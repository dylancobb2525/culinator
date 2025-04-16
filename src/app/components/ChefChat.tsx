"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "ai/react";
import { ChefHat, X, Send, CornerDownLeft } from "lucide-react";

interface ChefChatProps {
  recipe: string;
  ingredients: string;
  additionalNotes?: string;
  recipeContent: string;
}

export default function ChefChat({ recipe, ingredients, additionalNotes, recipeContent }: ChefChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFirstOpen, setIsFirstOpen] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Suggested questions for first-time users
  const suggestedQuestions = [
    "How can I make this recipe healthier?",
    "What can I substitute for an ingredient I don't have?",
    "How would I adjust this for dietary restrictions?",
    "Can I prepare any parts of this in advance?"
  ];

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages
  } = useChat({
    api: "/api/anthropic/chat",
    body: {
      recipe,
      ingredients,
      additionalNotes,
      recipeContent
    },
    onFinish: () => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }
  });

  // Auto-scroll to bottom of chat when new messages appear
  useEffect(() => {
    if (chatContainerRef.current && isOpen) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSuggestedQuestion = (question: string) => {
    if (isFirstOpen) {
      setMessages([]);
      setIsFirstOpen(false);
    }
    
    const userMessage = { id: Date.now().toString(), role: "user", content: question };
    setMessages([...messages, userMessage as any]);
    
    fetch("/api/anthropic/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [...messages, userMessage],
        recipe,
        ingredients,
        additionalNotes,
        recipeContent
      })
    })
      .then(res => res.json())
      .then(data => {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: data.response }]);
      })
      .catch(error => {
        console.error("Error sending message:", error);
      });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isFirstOpen) {
      setIsFirstOpen(false);
    }
    handleSubmit(e);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Button */}
      <button
        onClick={toggleChat}
        className="w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center"
        aria-label="Chat with Chef Claude"
      >
        {isOpen ? <X size={24} /> : <ChefHat size={28} />}
      </button>
      
      {/* Tooltip */}
      {!isOpen && (
        <div className="absolute -top-16 right-0 bg-white text-gray-800 rounded-lg p-3 shadow-md w-64 text-sm">
          Chat with Chef Claude about your recipe
          <div className="absolute bottom-[-8px] right-8 w-4 h-4 bg-white transform rotate-45"></div>
        </div>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 bg-white rounded-lg shadow-xl w-[350px] sm:w-[400px] h-[500px] overflow-hidden flex flex-col border border-gray-200">
          {/* Header */}
          <div className="bg-blue-600 text-white p-3 flex items-center">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-3">
              <ChefHat size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium">Chef Claude</h3>
              <p className="text-xs opacity-80">Ask me about your recipe</p>
            </div>
            <button 
              onClick={toggleChat}
              className="ml-auto bg-blue-700 hover:bg-blue-800 p-1.5 rounded-full"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {/* Welcome message */}
            {isFirstOpen && messages.length === 0 && (
              <div className="bg-gray-100 rounded-lg p-3 text-gray-800">
                <p className="text-sm font-medium mb-2">👋 Hello! I&apos;m Chef Claude.</p>
                <p className="text-sm mb-3">I can help answer questions about your recipe for {recipe}. What would you like to know?</p>
                <div className="space-y-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="block w-full text-left bg-white p-2 rounded border border-gray-300 text-sm hover:bg-blue-50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map(message => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`rounded-lg p-3 max-w-[85%] ${
                  message.role === "user" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {message.content}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 max-w-[85%]">
                  <div className="flex space-x-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleFormSubmit} className="border-t border-gray-200 p-3 flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                placeholder="Ask Chef Claude..."
                className="w-full rounded-md border border-gray-300 focus:border-blue-500 px-3 py-2 resize-none text-sm min-h-[40px]"
                rows={1}
              />
              <div className="absolute right-2 bottom-1 text-xs text-gray-400">
                <CornerDownLeft size={14} />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`rounded-md p-2 ${
                isLoading || !input.trim() 
                  ? "bg-gray-200 text-gray-500" 
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
} 