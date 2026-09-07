"use client";
import { useState, useEffect } from "react";
import { Search, Zap, Brain, Star, Shield, CheckCircle, Loader2, X, Share2, Download, User, Users } from "lucide-react";

interface Character {
  id: string;
  name: string;
  image_url: string;
  universe: string;
  gender: string;
  age: string;
  strengths: string[];
  weaknesses: string[];
  abilities: string[];
  power_level: number;
  speed: number;
  hax: number;
  battle_iq: number;
  description: string;
}

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUniverse, setSelectedUniverse] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [fromCache, setFromCache] = useState(false);
  const [offset, setOffset] = useState(0);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  useEffect(() => {
    setOffset(0);
    fetchCharacters(true);
  }, [searchQuery, selectedUniverse, selectedGender]);

  const fetchCharacters = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/characters/search?q=${searchQuery || "a"}&limit=50&offset=${offset}`;
      if (selectedUniverse) {
        url = `${process.env.NEXT_PUBLIC_API_URL}/api/characters/universe/${selectedUniverse}?limit=50&offset=${offset}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      let chars = data.characters || [];

      // Gender filter client-side (API mein abhi nahi hai)
      if (selectedGender) {
        chars = chars.filter(c => c.gender?.toLowerCase() === selectedGender.toLowerCase());
      }

      if (isInitial) setCharacters(chars);
      else setCharacters(prev => [...prev, ...chars]);

      setFromCache(data.cached || false);
      setOffset(prev => prev + 50);

    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const getPowerColor = (level: number) => {
    if (level >= 900) return "text-red-400";
    if (level >= 750) return "text-orange-400";
    if (level >= 600) return "text-yellow-400";
    return "text-green-400";
  };

  const handleShare = async (char: Character) => {
    const shareText = `🎌 ${char.name}\n Power: ${char.power_level}\n ${char.universe}\n Strengths: ${char.strengths.join(', ')}\n\nExplore on MangaVerse!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: char.name,
          text: shareText,
          url: window.location.href
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert("Copied to clipboard!");
    }
  };

  const handleDownload = async (char: Character) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Background
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, 400, 600);

      // Title
      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(char.name, 20, 40);

      // Stats
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.fillText(` Power: ${char.power_level}`, 20, 80);
      ctx.fillText(` ${char.universe}`, 20, 105);
      ctx.fillText(`️ Speed: ${char.speed}`, 20, 130);
      ctx.fillText(`🧠 IQ: ${char.battle_iq}`, 20, 155);
      ctx.fillText(`✨ HAX: ${char.hax}`, 20, 180);

      // Download
      const link = document.createElement('a');
      link.download = `${char.name.replace(/\s+/g, '_')}_MangaVerse.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-2">
            Character Database
          </h1>
          <p className="text-gray-400">Explore 8,300+ Manga & Anime Characters</p>
          {fromCache && (
            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-green-900/30 border border-green-500/30 rounded-full">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-400 font-semibold">⚡ Instant Load (Cached)</span>
            </div>
          )}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search characters (e.g., Luffy, Gojo)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          <select
            value={selectedUniverse}
            onChange={(e) => setSelectedUniverse(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition"
          >
            <option value="">All Universes</option>
            <option value="One Piece">One Piece</option>
            <option value="Naruto">Naruto</option>
            <option value="Jujutsu Kaisen">Jujutsu Kaisen</option>
            <option value="Dragon Ball">Dragon Ball</option>
            <option value="Bleach">Bleach</option>
            <option value="Chainsaw Man">Chainsaw Man</option>
          </select>

          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition"
          >
            <option value="">All Genders</option>
            <option value="Male">Male ♂</option>
            <option value="Female">Female ♀</option>
          </select>

          <button
            onClick={() => fetchCharacters(true)}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold transition"
          >
            Search
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-purple-400 font-bold animate-pulse">Querying the Multiverse...</p>
          </div>
        )}

        {/* Characters Grid */}
        {!loading && characters.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {characters.map((char) => (
                <div
                  key={char.id}
                  onClick={() => setSelectedCharacter(char)}
                  className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-purple-500/50 transition-all hover:scale-105 cursor-pointer group shadow-lg"
                >
                  <div className="aspect-[3/4] relative overflow-hidden bg-gray-800">
                    <img
                      src={char.image_url}
                      alt={char.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.0/bottts-neutral/svg?seed=${encodeURIComponent(char.name)}&backgroundColor=1a1a2e&size=400`;
                      }}
                    />
                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-sm rounded-lg border border-white/10">
                      <span className={`text-sm font-black ${getPowerColor(char.power_level)}`}>
                        ⚡ {char.power_level}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-bold text-white mb-1 truncate" title={char.name}>{char.name}</h3>
                    <p className="text-xs text-purple-400 font-semibold mb-3 uppercase tracking-wider">{char.universe}</p>

                    <div className="grid grid-cols-2 gap-2 mb-3 bg-gray-950/50 p-2 rounded-lg">
                      <div className="flex items-center gap-1.5 text-xs text-gray-300">
                        <Zap className="w-3.5 h-3.5 text-yellow-400" />
                        <span>{char.speed}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-300">
                        <Brain className="w-3.5 h-3.5 text-blue-400" />
                        <span>{char.battle_iq}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-300">
                        <Star className="w-3.5 h-3.5 text-purple-400" />
                        <span>{char.hax}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-300">
                        <Shield className="w-3.5 h-3.5 text-green-400" />
                        <span>{char.power_level}</span>
                      </div>
                    </div>

                    {char.strengths?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {char.strengths.slice(0, 2).map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-green-900/40 text-green-400 text-[10px] font-bold rounded border border-green-800">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-10 mb-10">
              <button
                onClick={() => fetchCharacters(false)}
                disabled={loadingMore}
                className="flex items-center gap-2 px-8 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-bold transition disabled:opacity-50"
              >
                {loadingMore ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                Load More Characters
              </button>
            </div>
          </>
        )}

        {/* Character Detail Modal */}
        {selectedCharacter && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-2xl bg-gray-900 rounded-2xl border border-purple-500/30 overflow-hidden max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedCharacter(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-red-600 rounded-full transition z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="grid md:grid-cols-2 gap-6 p-6">
                {/* Image */}
                <div className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-purple-500/30">
                  <img
                    src={selectedCharacter.image_url}
                    alt={selectedCharacter.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.0/bottts-neutral/svg?seed=${encodeURIComponent(selectedCharacter.name)}&backgroundColor=1a1a2e&size=400`;
                    }}
                  />
                </div>

                {/* Info */}
                <div>
                  <h2 className="text-3xl font-black text-white mb-2">{selectedCharacter.name}</h2>
                  <p className="text-purple-400 font-semibold mb-4">{selectedCharacter.universe}</p>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-400 mb-1">
                        <Zap className="w-4 h-4" />
                        <span className="text-xs uppercase">Speed</span>
                      </div>
                      <div className="text-2xl font-bold">{selectedCharacter.speed}</div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-400 mb-1">
                        <Brain className="w-4 h-4" />
                        <span className="text-xs uppercase">Battle IQ</span>
                      </div>
                      <div className="text-2xl font-bold">{selectedCharacter.battle_iq}</div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-purple-400 mb-1">
                        <Star className="w-4 h-4" />
                        <span className="text-xs uppercase">HAX</span>
                      </div>
                      <div className="text-2xl font-bold">{selectedCharacter.hax}</div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-green-400 mb-1">
                        <Shield className="w-4 h-4" />
                        <span className="text-xs uppercase">Power</span>
                      </div>
                      <div className={`text-2xl font-bold ${getPowerColor(selectedCharacter.power_level)}`}>
                        {selectedCharacter.power_level}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div>
                      <h3 className="text-sm font-bold text-gray-400 mb-2">Gender</h3>
                      <p className="text-white">{selectedCharacter.gender || 'Unknown'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-400 mb-2">Age</h3>
                      <p className="text-white">{selectedCharacter.age || 'Unknown'}</p>
                    </div>
                  </div>

                  {selectedCharacter.description && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-gray-400 mb-2">Description</h3>
                      <p className="text-gray-300 text-sm leading-relaxed">{selectedCharacter.description}</p>
                    </div>
                  )}

                  {selectedCharacter.strengths?.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-gray-400 mb-2">Strengths</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCharacter.strengths.map((s, i) => (
                          <span key={i} className="px-3 py-1 bg-green-900/40 text-green-400 text-xs font-bold rounded border border-green-800">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCharacter.weaknesses?.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-gray-400 mb-2">Weaknesses</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCharacter.weaknesses.map((w, i) => (
                          <span key={i} className="px-3 py-1 bg-red-900/40 text-red-400 text-xs font-bold rounded border border-red-800">
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleShare(selectedCharacter)}
                      className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold transition flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-5 h-5" />
                      Share
                    </button>
                    <button
                      onClick={() => handleDownload(selectedCharacter)}
                      className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold transition flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}