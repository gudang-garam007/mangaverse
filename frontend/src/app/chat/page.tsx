"use client";
import { useState, useEffect, useRef } from "react";
import { Send, User, Bot, Loader2, MessageCircle, Search } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Character {
  name: string;
  universe: string;
  image_url: string;
}

// Helper to generate consistent image URLs
const getCharacterImage = (name: string) => {
  const seed = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `https://image.pollinations.ai/prompt/anime%20manga%20character%20${encodeURIComponent(name)}%20portrait%20high%20quality?width=100&height=100&nologo=true&seed=${seed}`;
};

// 113 Featured Characters with Auto-Generated Images
const RAW_CHARACTERS = [
  { name: "Monkey D. Luffy", universe: "One Piece" }, { name: "Naruto Uzumaki", universe: "Naruto" },
  { name: "Son Goku", universe: "Dragon Ball" }, { name: "Roronoa Zoro", universe: "One Piece" },
  { name: "Nami", universe: "One Piece" }, { name: "Satoru Gojo", universe: "Jujutsu Kaisen" },
  { name: "Itachi Uchiha", universe: "Naruto" }, { name: "Light Yagami", universe: "Death Note" },
  { name: "Ichigo Kurosaki", universe: "Bleach" }, { name: "Mikasa Ackerman", universe: "Attack on Titan" },
  { name: "Levi Ackerman", universe: "Attack on Titan" }, { name: "Sasuke Uchiha", universe: "Naruto" },
  { name: "Eren Yeager", universe: "Attack on Titan" }, { name: "Saitama", universe: "One-Punch Man" },
  { name: "Kakashi Hatake", universe: "Naruto" }, { name: "Denji", universe: "Chainsaw Man" },
  { name: "Tanjiro Kamado", universe: "Demon Slayer" }, { name: "Guts", universe: "Berserk" },
  { name: "Ken Kaneki", universe: "Tokyo Ghoul" }, { name: "Sung Jinwoo", universe: "Solo Leveling" },
  { name: "Sukuna", universe: "Jujutsu Kaisen" }, { name: "Megumi Fushiguro", universe: "Jujutsu Kaisen" },
  { name: "Izuku Midoriya", universe: "My Hero Academia" }, { name: "Vegeta", universe: "Dragon Ball" },
  { name: "L Lawliet", universe: "Death Note" }, { name: "Rintarou Okabe", universe: "Steins;Gate" },
  { name: "Killua Zoldyck", universe: "Hunter x Hunter" }, { name: "Gon Freecss", universe: "Hunter x Hunter" },
  { name: "Nezuko Kamado", universe: "Demon Slayer" }, { name: "Edward Elric", universe: "Fullmetal Alchemist" },
  { name: "Rimuru Tempest", universe: "That Time I Got Reincarnated as a Slime" }, { name: "Shoto Todoroki", universe: "My Hero Academia" },
  { name: "Kurisu Makise", universe: "Steins;Gate" }, { name: "Marin Kitagawa", universe: "My Dress-Up Darling" },
  { name: "Rem", universe: "Re:Zero" }, { name: "Spike Spiegel", universe: "Cowboy Bebop" },
  { name: "Yuta Okkotsu", universe: "Jujutsu Kaisen" }, { name: "Joseph Joestar", universe: "JoJo's Bizarre Adventure" },
  { name: "Sakata Gintoki", universe: "Gintama" }, { name: "Katsuki Bakugo", universe: "My Hero Academia" },
  { name: "Yami Sukehiro", universe: "Black Clover" }, { name: "Hisoka Morow", universe: "Hunter x Hunter" },
  { name: "Anya Forger", universe: "Spy x Family" }, { name: "Zenitsu Agatsuma", universe: "Demon Slayer" },
  { name: "Power", universe: "Chainsaw Man" }, { name: "Dio Brando", universe: "JoJo's Bizarre Adventure" },
  { name: "Maki Zenin", universe: "Jujutsu Kaisen" }, { name: "Makima", universe: "Chainsaw Man" },
  { name: "Asuka Langley Soryu", universe: "Neon Genesis Evangelion" }, { name: "Kyojuro Rengoku", universe: "Demon Slayer" },
  { name: "Aizen Sosuke", universe: "Bleach" }, { name: "Toji Fushiguro", universe: "Jujutsu Kaisen" },
  { name: "Chrollo Lucilfer", universe: "Hunter x Hunter" }, { name: "Saber", universe: "Fate" },
  { name: "Roy Mustang", universe: "Fullmetal Alchemist" }, { name: "Alucard", universe: "Hellsing" },
  { name: "Mob", universe: "Mob Psycho 100" }, { name: "Kageyama Tobio", universe: "Haikyu!!" },
  { name: "Sanji", universe: "One Piece" }, { name: "Lelouch Lamperouge", universe: "Code Geass" },
  { name: "Hinata Hyuga", universe: "Naruto" }, { name: "Giyu Tomioka", universe: "Demon Slayer" },
  { name: "Hinata Shoyo", universe: "Haikyu!!" }, { name: "Erza Scarlet", universe: "Fairy Tail" },
  { name: "Portgas D. Ace", universe: "One Piece" }, { name: "Aqua", universe: "KonoSuba" },
  { name: "Thorfinn Karlsefni", universe: "Vinland Saga" }, { name: "Lucy Heartfilia", universe: "Fairy Tail" },
  { name: "Norman", universe: "The Promised Neverland" }, { name: "Shinra Kusakabe", universe: "Fire Force" },
  { name: "Kurapika", universe: "Hunter x Hunter" }, { name: "Megumin", universe: "KonoSuba" },
  { name: "Gaara", universe: "Naruto" }, { name: "Minato Namikaze", universe: "Naruto" },
  { name: "Trafalgar D. Water Law", universe: "One Piece" }, { name: "Kenshin Himura", universe: "Rurouni Kenshin" },
  { name: "Emilia", universe: "Re:Zero" }, { name: "Sango", universe: "InuYasha" },
  { name: "Boa Hancock", universe: "One Piece" }, { name: "Rias Gremory", universe: "High School DxD" },
  { name: "Tsunade", universe: "Naruto" }, { name: "Kaguya Shinomiya", universe: "Love is War" },
  { name: "Fubuki", universe: "One-Punch Man" }, { name: "Yor Forger", universe: "Spy x Family" },
  { name: "Mitsuri Kanroji", universe: "Demon Slayer" }, { name: "Mai Sakurajima", universe: "Bunny Girl Senpai" },
  { name: "Fern", universe: "Frieren" }, { name: "Kaoruko Waguri", universe: "Fragrant Flower" },
  { name: "Momo Ayase", universe: "Dandadan" }, { name: "Yoruichi Shihouin", universe: "Bleach" },
  { name: "Nobara Kugisaki", universe: "Jujutsu Kaisen" }, { name: "Mirko", universe: "My Hero Academia" },
  { name: "Esdeath", universe: "Akame ga Kill!" }, { name: "Jolyne Cujoh", universe: "JoJo's Bizarre Adventure" },
  { name: "Revy", universe: "Black Lagoon" }, { name: "Nico Robin", universe: "One Piece" },
  { name: "Sakura Haruno", universe: "Naruto" }, { name: "Orihime Inoue", universe: "Bleach" },
  { name: "Rukia Kuchiki", universe: "Bleach" }, { name: "Android 18", universe: "Dragon Ball" },
  { name: "Bulma", universe: "Dragon Ball" }, { name: "Ino Yamanaka", universe: "Naruto" },
  { name: "Violet Evergarden", universe: "Violet Evergarden" }, { name: "Chizuru Ichinose", universe: "Rent-a-Girlfriend" },
  { name: "Albedo", universe: "Overlord" }, { name: "C.C.", universe: "Code Geass" },
  { name: "Zero Two", universe: "Darling in the Franxx" }, { name: "Minene Uryu", universe: "Future Diary" },
  { name: "Komi Shouko", universe: "Komi Can't Communicate" }, { name: "Akane Kurokawa", universe: "Oshi no Ko" },
  { name: "Kana Arima", universe: "Oshi no Ko" }, { name: "Touka Kirishima", universe: "Tokyo Ghoul" },
  { name: "Shinobu Kocho", universe: "Demon Slayer" }
];

const FEATURED_CHARACTERS: Character[] = RAW_CHARACTERS.map(char => ({
  ...char,
  image_url: getCharacterImage(char.name)
}));

export default function ChatPage() {
  const [filteredCharacters, setFilteredCharacters] = useState<Character[]>(FEATURED_CHARACTERS);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const filtered = FEATURED_CHARACTERS.filter(char =>
      char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.universe.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCharacters(filtered);
  }, [searchQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedCharacter || loading) return;

    const userMessage: Message = { role: "user", content: inputMessage, timestamp: new Date() };
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
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await res.json();

      // ✅ Smart fallback: Agar backend ne dynamic prompt se reply diya, toh wo dikhao
      if (res.ok && data.reply) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply, timestamp: new Date() }]);
      } else {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: `⚠️ ${data.detail || "Character is temporarily unavailable. Please try again."}`,
          timestamp: new Date()
        }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `⚠️ Connection Error: ${err.message}`,
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

  // Reusable Image Component with Fallback
  const CharacterAvatar = ({ name, size = "w-10 h-10", className = "" }: { name: string, size?: string, className?: string }) => {
    const imageUrl = getCharacterImage(name);
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${size} rounded-full object-cover border-2 border-purple-500/30 flex-shrink-0 ${className}`}
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.0/bottts-neutral/svg?seed=${encodeURIComponent(name)}&backgroundColor=1a1a2e`;
        }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950 text-gray-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent mb-2">
            💬 Character Chat
          </h1>
          <p className="text-gray-400 text-sm md:text-base">Talk to 113+ favorite anime & manga characters in real-time</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 h-[calc(100vh-200px)]">
          {/* Character Selection Sidebar */}
          <div className="lg:col-span-1 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 flex flex-col">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search characters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredCharacters.map((char, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedCharacter(char); setMessages([]); }}
                  className={`w-full p-3 rounded-xl transition-all text-left flex items-center gap-3 ${
                    selectedCharacter?.name === char.name
                      ? "bg-purple-600/30 border-2 border-purple-500 scale-[1.02]"
                      : "bg-gray-800/50 border border-gray-700 hover:bg-gray-800 hover:border-purple-500/50"
                  }`}
                >
                  <CharacterAvatar name={char.name} size="w-10 h-10" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{char.name}</div>
                    <div className="text-xs text-gray-400 truncate">{char.universe}</div>
                  </div>
                </button>
              ))}
              {filteredCharacters.length === 0 && (
                <p className="text-center text-gray-500 text-sm py-4">No characters found.</p>
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl flex flex-col overflow-hidden">
            {selectedCharacter ? (
              <>
                <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-b border-gray-800 p-4 flex items-center gap-4">
                  <CharacterAvatar name={selectedCharacter.name} size="w-12 h-12" className="border-purple-500" />
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-white truncate">{selectedCharacter.name}</h3>
                    <p className="text-sm text-purple-300 truncate">{selectedCharacter.universe}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageCircle className="w-16 h-16 text-purple-500/30 mb-4" />
                      <p className="text-gray-400 text-lg">Start chatting with {selectedCharacter.name}!</p>
                      <p className="text-gray-500 text-sm mt-2">Type a message below to begin</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            msg.role === "user" ? "bg-gradient-to-br from-cyan-500 to-blue-600" : "bg-gradient-to-br from-purple-500 to-pink-600"
                          }`}>
                            {msg.role === "user" ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                          </div>
                          <div className={`rounded-2xl px-4 py-3 ${
                            msg.role === "user" ? "bg-gradient-to-br from-cyan-600 to-blue-700 text-white" : "bg-gray-800 border border-gray-700 text-gray-100"
                          }`}>
                            <div className="text-sm leading-relaxed whitespace-pre-wrap">{renderMessageContent(msg.content)}</div>
                            <div className={`text-xs mt-1 ${msg.role === "user" ? "text-cyan-200" : "text-gray-500"}`}>
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="flex gap-3">
                        <CharacterAvatar name={selectedCharacter.name} size="w-10 h-10" className="border-purple-500/50" />
                        <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 flex gap-1 items-center">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

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
                        loading || !inputMessage.trim() ? "bg-gray-700 cursor-not-allowed opacity-50" : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30"
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
                <p className="text-gray-400 max-w-md">Choose from 113+ characters in the sidebar to start an immersive roleplay conversation.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}