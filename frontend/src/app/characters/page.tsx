"use client";
import { useState, useEffect } from "react";
import { Search, CheckCircle, Loader2, X, Share2, Download, User } from "lucide-react";

interface Character {
  id: string;
  name: string;
  image_url: string;
  universe: string;
  gender: string;
  age: string;
  description: string;
  personality_traits: string[];
  strengths: string[];
  weaknesses: string[];
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

      // Gender filter client-side
      if (selectedGender) {
        chars = chars.filter((c: Character) => c.gender?.toLowerCase() === selectedGender.toLowerCase());
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

  const handleShare = async (char: Character) => {
    const shareText = `🎌 ${char.name}\n${char.universe}\n${char.gender} • ${char.age}\n\nPersonality: ${char.personality_traits.join(', ')}\n\n${char.description}\n\nExplore on MangaVerse!`;

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
      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, 600);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 600);

      // Title
      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 28px Arial';
      ctx.fillText(char.name, 20, 50);

      // Universe
      ctx.fillStyle = '#c084fc';
      ctx.font = '18px Arial';
      ctx.fillText(char.universe, 20, 85);

      // Info
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px Arial';
      ctx.fillText(`${char.gender} • ${char.age}`, 20, 110);

      // Personality
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('Personality:', 20, 150);
      ctx.font = '14px Arial';
      ctx.fillStyle = '#cbd5e1';
      char.personality_traits.slice(0, 4).forEach((trait, i) => {
        ctx.fillText(`• ${trait}`, 20, 175 + (i * 25));
      });

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
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-bold text-white mb-1 truncate" title={char.name}>{char.name}</h3>
                    <p className="text-xs text-purple-400 font-semibold mb-2">{char.universe}</p>
                    <p className="text-xs text-gray-500 mb-3">{char.gender} • {char.age}</p>

                    {char.personality_traits?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {char.personality_traits.slice(0, 2).map((trait, i) => (
                          <span key={i} className="px-2 py-0.5 bg-purple-900/40 text-purple-400 text-[10px] rounded border border-purple-800">
                            {trait}
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

                  <div className="flex gap-4 mb-6 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <User className="w-4 h-4" />
                      <span>{selectedCharacter.gender}</span>
                    </div>
                    <div className="text-gray-600">•</div>
                    <div className="text-gray-400">{selectedCharacter.age}</div>
                  </div>

                  {/* Personality Traits */}
                  {selectedCharacter.personality_traits?.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-gray-400 mb-3">Personality Traits</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCharacter.personality_traits.map((trait, i) => (
                          <span key={i} className="px-3 py-1.5 bg-purple-900/40 text-purple-300 text-sm rounded-lg border border-purple-800">
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {selectedCharacter.description && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-gray-400 mb-2">About</h3>
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                        {selectedCharacter.description}
                      </p>
                    </div>
                  )}

                  {/* Strengths */}
                  {selectedCharacter.strengths?.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-gray-400 mb-2">Abilities & Strengths</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCharacter.strengths.map((s, i) => (
                          <span key={i} className="px-3 py-1.5 bg-green-900/40 text-green-400 text-sm rounded-lg border border-green-800">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {selectedCharacter.weaknesses?.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-gray-400 mb-2">Weaknesses</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCharacter.weaknesses.map((w, i) => (
                          <span key={i} className="px-3 py-1.5 bg-red-900/40 text-red-400 text-sm rounded-lg border border-red-800">
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-800">
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

        {!loading && characters.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl">No characters found. Try a different search.</p>
          </div>
        )}
      </div>
    </div>
  );
}