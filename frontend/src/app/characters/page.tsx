"use client";
import { useState, useEffect } from "react";
import { Search, Zap, Brain, Star, Shield, CheckCircle, Loader2 } from "lucide-react";

interface Character {
  id: string;
  name: string;
  image_url: string;
  universe: string;
  gender: string;
  age: string;
  strengths: string[];
  weaknesses: string[];
  power_level: number;
  speed: number;
  hax: number;
  battle_iq: number;
}

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUniverse, setSelectedUniverse] = useState("");
  const [fromCache, setFromCache] = useState(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    setOffset(0); // Reset offset on search/universe change
    fetchCharacters(true);
  }, [searchQuery, selectedUniverse]);

  const fetchCharacters = async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      let url = "";
      const limit = 50;

      if (selectedUniverse) {
        url = `${process.env.NEXT_PUBLIC_API_URL}/api/characters/universe/${selectedUniverse}?limit=${limit}&offset=${offset}`;
      } else if (searchQuery) {
        url = `${process.env.NEXT_PUBLIC_API_URL}/api/characters/search?q=${searchQuery}&limit=${limit}&offset=${offset}`;
      } else {
        url = `${process.env.NEXT_PUBLIC_API_URL}/api/characters/search?q=a&limit=${limit}&offset=${offset}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (isInitial) {
        setCharacters(data.characters || []);
      } else {
        setCharacters(prev => [...prev, ...(data.characters || [])]);
      }

      setFromCache(data.cached || false);
      setOffset(prev => prev + limit);

    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const getPowerColor = (level: number) => {
    if (level >= 800) return "text-red-400";
    if (level >= 650) return "text-orange-400";
    if (level >= 500) return "text-yellow-400";
    return "text-green-400";
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
              onKeyDown={(e) => e.key === 'Enter' && fetchCharacters(true)}
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
                  className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-purple-500/50 transition-all hover:scale-[1.02] group shadow-lg"
                >
                  <div className="aspect-[3/4] relative overflow-hidden bg-gray-800">
                    <img
                      src={char.image_url}
                      alt={char.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => {
                        // ✅ FALLBACK: Agar image fail ho, toh mystery silhouette dikha do
                        (e.target as HTMLImageElement).src = "https://image.pollinations.ai/prompt/mysterious%20anime%20character%20silhouette%20dark%20background?width=400&height=600&nologo=true";
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

                    <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-950/50 p-2 rounded-lg">
                      <div className="flex items-center gap-1.5 text-xs text-gray-300">
                        <Zap className="w-3.5 h-3.5 text-yellow-400" />
                        <span>SPD: {char.speed}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-300">
                        <Brain className="w-3.5 h-3.5 text-blue-400" />
                        <span>IQ: {char.battle_iq}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-300">
                        <Star className="w-3.5 h-3.5 text-purple-400" />
                        <span>HAX: {char.hax}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-300">
                        <Shield className="w-3.5 h-3.5 text-green-400" />
                        <span>PWR: {char.power_level}</span>
                      </div>
                    </div>

                    {char.strengths?.length > 0 && (
                      <div className="mb-2">
                        <div className="flex flex-wrap gap-1">
                          {char.strengths.slice(0, 3).map((strength, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-green-900/40 text-green-400 text-[10px] font-bold rounded border border-green-800">
                              {strength}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {char.weaknesses?.length > 0 && (
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {char.weaknesses.slice(0, 2).map((weakness, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-red-900/40 text-red-400 text-[10px] font-bold rounded border border-red-800">
                              {weakness}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            <div className="flex justify-center mt-10 mb-10">
              <button
                onClick={() => fetchCharacters(false)}
                disabled={loadingMore}
                className="flex items-center gap-2 px-8 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-bold transition disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading More...
                  </>
                ) : (
                  "Load More Characters"
                )}
              </button>
            </div>
          </>
        )}

        {!loading && characters.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl">No characters found. Try a different search.</p>
          </div>
        )}
      </div>
    </div>
  );
}