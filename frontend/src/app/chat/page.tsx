"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, User, Bot, Loader2, MessageCircle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Character {
  id: string;
  name: string;
  image_url: string;
  universe: string;
  personality_traits: string[];
}

export default function ChatPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch popular characters on mount
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/characters/search?q=a&limit=20&offset=0`);
        const data = await res.json();
        setCharacters(data.characters || []);
      } catch (err) {
        console.error("Failed to fetch characters:", err);
      } finally {
        setLoadingCharacters(false);
      }
    };
    fetchCharacters();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedCharacter || loading) return;

    const userMessage: Message = {
      role: "user",
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character_name: selectedCharacter.name,
          message: inputMessage,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await res.json();

      if (res.ok) {
        const assistantMessage: Message = {
          role: "assistant",
          content: data.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          role: "assistant",
          content: `Error: ${data.detail || "Character is unavailable"}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (err: any) {
      const errorMessage: Message = {
        role: "assistant",
        content: `Connection Error: ${err.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageContent = (content: string) => {
    // Convert *actions* to italic styled text
    const parts = content.split(/(\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <span key={i} className="italic text-purple-300 font-medium">
            {part.slice(1, -1)}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950 text-gray-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent mb-2">
            💬 Character Chat
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Talk to your favorite anime & manga characters in real-time
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 h-[calc(100vh-200px)]">
          {/* Character Selection Sidebar */}
          <div className="lg:col-span-1 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 overflow-y-auto">
            <h2 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Select Character
            </h2>

            {loadingCharacters ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              </div>
            ) : (
              <div className="space-y-2">
                {characters.map((char) => (
                  <button
                    key={char.id}
                    onClick={() => {
                      setSelectedCharacter(char);
                      setMessages([]);
                    }}
                    className={`w-full p-3 rounded-xl transition-all ${
                      selectedCharacter?.id === char.id
                        ? "bg-purple-600/30 border-2 border-purple-500 scale-105"
                        : "bg-gray-800/50 border border-gray-700 hover:bg-gray-800 hover:border-purple-500/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={char.image_url}
                        alt={char.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-purple-500/30"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.0/bottts-neutral/svg?seed=${encodeURIComponent(char.name)}`;
                        }}
                      />
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{char.name}</div>
                        <div className="text-xs text-gray-400 truncate">{char.universe}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl flex flex-col overflow-hidden">
            {selectedCharacter ? (
              <>
                {/* Character Info Header */}
                <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-b border-gray-800 p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedCharacter.image_url}
                      alt={selectedCharacter.name}
                      className="w-16 h-16 rounded-full object-cover border-3 border-purple-500 shadow-lg shadow-purple-500/30"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.0/bottts-neutral/svg?seed=${encodeURIComponent(selectedCharacter.name)}`;
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">{selectedCharacter.name}</h3>
                      <p className="text-sm text-purple-300">{selectedCharacter.universe}</p>
                      {selectedCharacter.personality_traits?.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {selectedCharacter.personality_traits.slice(0, 3).map((trait, i) => (
                            <span key={i} className="px-2 py-0.5 bg-purple-900/50 text-purple-300 text-xs rounded-full border border-purple-700">
                              {trait}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageCircle className="w-16 h-16 text-purple-500/30 mb-4" />
                      <p className="text-gray-400 text-lg">Start chatting with {selectedCharacter.name}!</p>
                      <p className="text-gray-500 text-sm mt-2">Type a message below to begin</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`flex gap-3 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            {msg.role === "user" ? (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                              </div>
                            ) : (
                              <img
                                src={selectedCharacter.image_url}
                                alt={selectedCharacter.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-purple-500/50"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.0/bottts-neutral/svg?seed=${encodeURIComponent(selectedCharacter.name)}`;
                                }}
                              />
                            )}
                          </div>

                          {/* Message Bubble */}
                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              msg.role === "user"
                                ? "bg-gradient-to-br from-cyan-600 to-blue-700 text-white"
                                : "bg-gray-800 border border-gray-700 text-gray-100"
                            }`}
                          >
                            <div className="text-sm leading-relaxed whitespace-pre-wrap">
                              {renderMessageContent(msg.content)}
                            </div>
                            <div className={`text-xs mt-1 ${msg.role === "user" ? "text-cyan-200" : "text-gray-500"}`}>
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Typing Indicator */}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="flex gap-3">
                        <img
                          src={selectedCharacter.image_url}
                          alt={selectedCharacter.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-purple-500/50"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.0/bottts-neutral/svg?seed=${encodeURIComponent(selectedCharacter.name)}`;
                          }}
                        />
                        <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="border-t border-gray-800 p-4 bg-gray-900/30">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={`Message ${selectedCharacter.name}...`}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      disabled={loading || !inputMessage.trim()}
                      className={`px-6 py-3 rounded-xl font-bold transition-all ${
                        loading || !inputMessage.trim()
                          ? "bg-gray-700 cursor-not-allowed opacity-50"
                          : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30"
                      }`}
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-purple-500/30">
                  <Bot className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Select a Character</h2>
                <p className="text-gray-400 max-w-md">
                  Choose a character from the sidebar to start an immersive roleplay conversation
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}