"use client";
import { useState, useEffect } from "react";
import { Search, Filter, Star, Zap, Brain, Shield } from "lucide-react";

interface Character {
  id: string;
  original_name: string;
  name_full: string;
  image_url: string;
  age: string;
  gender: string;
  universe: string[];
  strengths: string[];
  weaknesses: string[];
  power_level: number;
  speed: number;
  hax: number;
  battle_iq: number;
}

export default function CharacterDatabase() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUniverse, setSelectedUniverse] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  useEffect(() => {
    fetchCharacters();
  }, [searchQuery, selectedUniverse, currentPage]);

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/characters/search?q=${searchQuery || "a"}`;
      if (selectedUniverse) {
        url = `${process.env.NEXT_PUBLIC_API_URL}/api/characters/universe/${selectedUniverse}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setCharacters(data.characters || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getPowerColor = (level: number) => {
    if (level >= 900) return "text-red-400";
    if (level >= 700) return "text-orange-400";
    if (level >= 500) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-2">
            Character Database
          </h1>
          <p className="text-gray-400">Explore {characters.length}+ Manga & Anime Characters</p>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search characters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-purple-500"
            />
          </div>
          <select
            value={selectedUniverse}
            onChange={(e) => setSelectedUniverse(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
          >
            <option value="">All Universes</option>
            <option value="One Piece">One Piece</option>
            <option value="Naruto">Naruto</option>
            <option value="Dragon Ball">Dragon Ball</option>
            <option value="Bleach">Bleach</option>
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Characters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {characters.map((char) => (
            <div
              key={char.id}
              className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-purple-500/50 transition-all hover:scale-105 group"
            >
              {/* Image */}
              <div className="aspect-[3/4] relative overflow-hidden">
                <img
                  src={char.image_url || "/placeholder-character.png"}
                  alt={char.name_full}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg">
                  <span className={`text-sm font-bold ${getPowerColor(char.power_level)}`}>
                    {char.power_level}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-white mb-1">{char.name_full}</h3>
                <p className="text-sm text-gray-400 mb-3">
                  {char.universe?.[0] || "Unknown Universe"}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    <span>Speed: {char.speed}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Brain className="w-3 h-3 text-blue-400" />
                    <span>IQ: {char.battle_iq}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Star className="w-3 h-3 text-purple-400" />
                    <span>Hax: {char.hax}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Shield className="w-3 h-3 text-green-400" />
                    <span>Power: {char.power_level}</span>
                  </div>
                </div>

                {/* Strengths */}
                {char.strengths?.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 mb-1">Strengths:</p>
                    <div className="flex flex-wrap gap-1">
                      {char.strengths.slice(0, 3).map((strength, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs rounded"
                        >
                          {strength}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weaknesses */}
                {char.weaknesses?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Weaknesses:</p>
                    <div className="flex flex-wrap gap-1">
                      {char.weaknesses.slice(0, 2).map((weakness, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-red-900/30 text-red-400 text-xs rounded"
                        >
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

        {/* Pagination */}
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-400">Page {currentPage}</span>
          <button
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={characters.length < ITEMS_PER_PAGE}
            className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}