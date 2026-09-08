"use client";
import { useState, useEffect, useRef } from "react";
import { Send, User, Bot, Loader2, MessageCircle, Search, X } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  image_url?: string;
}

interface Character {
  id: string;
  name: string;
  universe: string;
  image_url: string;
}

export default function ChatPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [filteredCharacters, setFilteredCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingChars, setLoadingChars] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        setLoadingChars(true);
        const res = await fetch("https://api.tenrai.org/v1/characters?limit=120");

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const chars: Character[] = data.data?.map((c: any) => ({
          id: c.id?.toString() || Math.random().toString(),
          name: c.attributes?.name || c.attributes?.names?.en || "Unknown",
          universe: c.attributes?.media?.nodes?.[0]?.title || "Unknown",
          image_url: c.attributes?.image?.large || c.attributes?.image?.original || ""
        })) || [];

        console.log(`✅ Loaded ${chars.length} characters from Tenrai API`);
        setCharacters(chars);
        setFilteredCharacters(chars);
      } catch (err) {
        console.error("❌ Failed to fetch characters:", err);
        const fallback: Character[] = [
          { id: "1", name: "Monkey D. Luffy", universe: "One Piece", image_url: "" },
          { id: "2", name: "Naruto Uzumaki", universe: "Naruto", image_url: "" },
          { id: "3", name: "Son Goku", universe: "Dragon Ball", image_url: "" },
          { id: "4", name: "Satoru Gojo", universe: "Jujutsu Kaisen", image_url: "" }
        ];
        setCharacters(fallback);
        setFilteredCharacters(fallback);
      } finally {
        setLoadingChars(false);
      }
    };
    fetchCharacters();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredCharacters(characters.filter(char =>
        char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        char.universe.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } else {
      setFilteredCharacters(characters.slice(0, 50));
    }
  }, [searchQuery, characters]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedCharacter || loading) return;

    const userMsg: Message = { role: "user", content: inputMessage, timestamp: new Date(), image_url: selectedCharacter.image_url };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
      const res = await fetch(`${apiUrl}/api/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character_name: selectedCharacter.name,
          message: inputMessage,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.reply,
          timestamp: new Date(),
          image_url: data.image_url || selectedCharacter.image_url
        }]);
      } else {
        throw new Error("No reply received");
      }
    } catch (err: any) {
      console.error("❌ Chat error:", err);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `⚠️ Error: ${err.message || "Failed to get response"}`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageContent = (content: string) => {
    const parts = content.split(/(\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("*") && part.endsWith("*")) {
        return <span key={i} className="italic text-purple-300 font-medium">{part.slice(1, -1)}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950 text-gray-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent mb-2">
            💬 Character Chat
          </h1>
          <p className="text-gray-400 text-sm">Talk to your favorite anime characters</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 h-[calc(100vh-200px)]">
          <div className="lg:col-span-1 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 flex flex-col">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Search characters..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loadingChars ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>
              ) : filteredCharacters.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-4">No characters found</p>
              ) : (
                filteredCharacters.map((char) => (
                  <button key={char.id} onClick={() => { setSelectedCharacter(char); setMessages([]); }} className={`w-full p-3 rounded-xl transition-all text-left flex items-center gap-3 ${selectedCharacter?.id === char.id ? "bg-purple-600/30 border-2 border-purple-500" : "bg-gray-800/50 border border-gray-700 hover:bg-gray-800"}`}>
                    <img src={char.image_url || `https://api.dicebear.com/9.0/bottts-neutral/svg?seed=${char.name}`} alt={char.name} className="w-10 h-10 rounded-full object-cover border-2 border-purple-500/30 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.0/bottts-neutral/svg?seed=${char.name}&backgroundColor=1a1a2e`; }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{char.name}</div>
                      <div className="text-xs text-gray-400 truncate">{char.universe}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-3 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl flex flex-col overflow-hidden">
            {selectedCharacter ? (
              <>
                <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-b border-gray-800 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={selectedCharacter.image_url || `https://api.dicebear.com/9.0/bottts-neutral/svg?seed=${selectedCharacter.name}`} alt={selectedCharacter.name} className="w-12 h-12 rounded-full object-cover border-2 border-purple-500" onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.0/bottts-neutral/svg?seed=${selectedCharacter.name}&backgroundColor=1a1a2e`; }} />
                    <div>
                      <h3 className="text-xl font-bold text-white">{selectedCharacter.name}</h3>
                      <p className="text-sm text-purple-300">{selectedCharacter.universe}</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedCharacter(null); setMessages([]); }} className="p-2 hover:bg-gray-800 rounded-lg transition"><X className="w-5 h-5 text-gray-400" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageCircle className="w-16 h-16 text-purple-500/30 mb-4" />
                      <p className="text-gray-400 text-lg">Start chatting with {selectedCharacter.name}!</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`flex gap-3 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                          <img src={msg.role === "user" ? `https://api.dicebear.com/9.0/avataaars/svg?seed=user&backgroundColor=1a1a2e` : msg.image_url || `https://api.dicebear.com/9.0/bottts-neutral/svg?seed=${selectedCharacter.name}&backgroundColor=1a1a2e`} alt={msg.role} className="w-10 h-10 rounded-full object-cover border-2 border-purple-500/30 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = msg.role === "user" ? `https://api.dicebear.com/9.0/avataaars/svg?seed=user&backgroundColor=1a1a2e` : `https://api.dicebear.com/9.0/bottts-neutral/svg?seed=${selectedCharacter.name}&backgroundColor=1a1a2e`; }} />
                          <div className={`rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-gradient-to-br from-cyan-600 to-blue-700 text-white" : "bg-gray-800 border border-gray-700 text-gray-100"}`}>
                            <div className="text-sm leading-relaxed whitespace-pre-wrap">{renderMessageContent(msg.content)}</div>
                            <div className={`text-xs mt-1 ${msg.role === "user" ? "text-cyan-200" : "text-gray-500"}`}>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="flex gap-3">
                        <img src={selectedCharacter.image_url || `https://api.dicebear.com/9.0/bottts-neutral/svg?seed=${selectedCharacter.name}`} alt="typing" className="w-10 h-10 rounded-full object-cover border-2 border-purple-500/30" />
                        <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 flex gap-1 items-center">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="border-t border-gray-800 p-4 bg-gray-900/30">
                  <div className="flex gap-3">
                    <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder={`Message ${selectedCharacter.name}...`} className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" disabled={loading} />
                    <button type="submit" disabled={loading || !inputMessage.trim()} className={`px-6 py-3 rounded-xl font-bold transition ${loading || !inputMessage.trim() ? "bg-gray-700 cursor-not-allowed opacity-50" : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"}`}>
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-6"><Bot className="w-12 h-12 text-white" /></div>
                <h2 className="text-2xl font-bold text-white mb-2">Select a Character</h2>
                <p className="text-gray-400 max-w-md">Choose from the sidebar to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}