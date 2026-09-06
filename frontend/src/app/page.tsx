"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"battle" | "manga">("battle");
  const [char1, setChar1] = useState("");
  const [char2, setChar2] = useState("");
  const [battleResult, setBattleResult] = useState<any>(null);
  const [battleLoading, setBattleLoading] = useState(false);
  const [battleError, setBattleError] = useState("");
  const [mangaPrompt, setMangaPrompt] = useState("");
  const [mangaStyle, setMangaStyle] = useState("shonen");
  const [mangaImage, setMangaImage] = useState<string | null>(null);
  const [mangaLoading, setMangaLoading] = useState(false);
  const [mangaError, setMangaError] = useState("");
  const [allCharacters, setAllCharacters] = useState<string[]>([]);

  // 🎮 NEW: Daily Puzzle State
  const [dailyPuzzle, setDailyPuzzle] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Characters
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/battle/characters`);
        const data = await res.json();
        if (data.status === "success") {
          setAllCharacters(data.characters);
        }
      } catch (err) {
        console.error("Failed to fetch characters");
      }

      // 2. Fetch Daily Puzzle
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/today`);
        const data = await res.json();
        if (data.status === "success") {
          setDailyPuzzle(data);
        }
      } catch (err) {
        console.error("Failed to fetch daily puzzle");
      }
    };
    fetchData();
  }, []);

  const handleBattle = async (e: React.FormEvent) => {
    e.preventDefault();
    setBattleLoading(true);
    setBattleResult(null);
    setBattleError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/battle/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character_1: char1, character_2: char2 }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBattleResult(data);
      } else {
        setBattleError(data.error || data.detail || "Battle analysis failed");
      }
    } catch (err: any) {
      setBattleError(`Connection Error: ${err.message}`);
    } finally {
      setBattleLoading(false);
    }
  };

  const generateMangaFromBattle = () => {
    if (!battleResult) return;

    const c1 = battleResult.character_1_stats?.name || char1;
    const c2 = battleResult.character_2_stats?.name || char2;

    const prompt = `Generate 4 manga panels of ${c1} vs ${c2}:
Panel 1: Opening clash / intense stare down
Panel 2: Stronger character using signature ability
Panel 3: Weaker character's best attempt
Panel 4: Decisive finishing moment
Style: High quality black & white manga, dynamic action, detailed expressions`;

    setMangaPrompt(prompt);
    setActiveTab("manga");
  };

  const handleMangaGen = async (e: React.FormEvent) => {
    e.preventDefault();
    setMangaLoading(true);
    setMangaImage(null);
    setMangaError("");
    try {
      const formData = new FormData();
      formData.append("prompt", mangaPrompt);
      formData.append("style", mangaStyle);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/convert/text-to-manga`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMangaImage(data.image_base64);
      } else {
        setMangaError(data.detail || "Generation failed");
      }
    } catch (err: any) {
      setMangaError(`Connection Error: ${err.message}`);
    } finally {
      setMangaLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          MangaVerse Oracle
        </h1>
        <p className="text-center text-gray-400 mb-8">AI-Powered Battle Analysis & Manga Generation</p>

        {/* ==================== 🎮 MANGALDLE HERO WIDGET ==================== */}
        {dailyPuzzle && (
          <div className="mb-10">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 border border-purple-500/30 shadow-2xl shadow-purple-500/20">
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(236,72,153,0.3),transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.3),transparent_50%)]" />

              <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
                {/* Left: Game Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-3">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">Live Daily Puzzle</span>
                  </div>

                  <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                    🎌 MangaLdle
                  </h2>
                  <p className="text-sm md:text-base text-purple-200 mb-4 max-w-lg mx-auto md:mx-0">
                    Can you guess today's mystery manga character in 6 attempts?
                    <span className="font-bold text-white"> {dailyPuzzle.mode === "silhouette" ? "Decode the silhouette" : dailyPuzzle.mode === "quote" ? "Match the iconic quote" : dailyPuzzle.mode === "radar" ? "Read the power stats" : "Unlock progressive hints"}</span>
                  </p>

                  <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                    <div className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                      <span className="text-xs text-purple-200">📅</span>
                      <span className="text-sm font-bold text-white ml-1">{dailyPuzzle.date}</span>
                    </div>
                    <div className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                      <span className="text-xs text-purple-200">🎮</span>
                      <span className="text-sm font-bold text-white ml-1 uppercase">{dailyPuzzle.mode}</span>
                    </div>
                  </div>

                  <a
                    href="/game"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-105"
                  >
                    🎯 Play Now
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                </div>

                {/* Right: Visual Teaser */}
                <div className="flex-shrink-0">
                  <div className="relative w-32 h-32 md:w-40 md:h-40">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 to-purple-600/30 rounded-2xl blur-2xl animate-pulse" />
                    <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-gray-900 to-black border-2 border-purple-500/50 flex items-center justify-center overflow-hidden">
                      <div className="text-5xl md:text-6xl opacity-80">🎭</div>
                      <div className="absolute bottom-2 left-0 right-0 text-center">
                        <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">Mystery</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ==================== END MANGALDLE WIDGET ==================== */}

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <a href="/chat" className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 text-sm">💬 Chat</a>
          <a href="/whatif" className="px-3 py-1 bg-purple-600 rounded hover:bg-purple-700 text-sm">🔮 What-If</a>
          <a href="/panel" className="px-3 py-1 bg-green-600 rounded hover:bg-green-700 text-sm">📊 Panel</a>
          <a href="/dna" className="px-3 py-1 bg-yellow-600 rounded hover:bg-yellow-700 text-sm">🧬 DNA</a>
          <a href="/theory" className="px-3 py-1 bg-pink-600 rounded hover:bg-pink-700 text-sm">💡 Theory</a>
          <a href="/learn" className="px-3 py-1 bg-indigo-600 rounded hover:bg-indigo-700 text-sm">📚 Learn</a>
          <a href="/universe" className="px-3 py-1 bg-cyan-600 rounded hover:bg-cyan-700 text-sm">🌌 Universe</a>
          <a href="/feed" className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 text-sm">🔥 Feed</a>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <button onClick={() => setActiveTab("battle")} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === "battle" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>⚔️ Battle Arena</button>
          <button onClick={() => setActiveTab("manga")} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === "manga" ? "bg-pink-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>🎨 Manga Generator</button>
        </div>

        {/* ==================== BATTLE ARENA ==================== */}
        {activeTab === "battle" && (
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl">
            <form onSubmit={handleBattle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Character 1</label>
                <select value={char1} onChange={(e) => setChar1(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" required>
                  <option value="">-- Select Character 1 --</option>
                  {allCharacters.map((char) => (
                    <option key={char} value={char.split(" (")[0]}>{char}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Character 2</label>
                <select value={char2} onChange={(e) => setChar2(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" required>
                  <option value="">-- Select Character 2 --</option>
                  {allCharacters.map((char) => (
                    <option key={char} value={char.split(" (")[0]}>{char}</option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={battleLoading || !char1 || !char2} className={`w-full font-bold py-3 rounded-lg transition ${battleLoading || !char1 || !char2 ? "bg-gray-600 cursor-not-allowed opacity-50 text-gray-300" : "bg-purple-600 hover:bg-purple-700 text-white"}`}>
                {battleLoading ? "⏳ Analyzing Battle (Please wait 10-15s)..." : "⚔️ Start Battle Analysis"}
              </button>
            </form>

            {battleError && (<div className="mt-6 p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-300">{battleError}</div>)}

            {battleResult && battleResult.success && (
              <div className="mt-6 space-y-6">
                {battleResult.extreme_mismatch && (
                  <div className="bg-red-900/30 border-2 border-red-500 p-4 rounded-lg">
                    <h4 className="font-bold text-red-400 mb-2">⚠️ EXTREME POWER GAP DETECTED</h4>
                    <p className="text-red-300 text-sm">{battleResult.mismatch_warning}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-blue-500">
                    <h3 className="font-bold text-blue-400 text-lg">{battleResult.character_1_stats?.name || char1}</h3>
                    <p className="text-sm text-gray-400">{battleResult.character_1_stats?.universe || "Unknown"}</p>
                    <p className="text-sm mt-2 text-gray-300">{battleResult.character_1_stats?.key_abilities || "N/A"}</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-red-500">
                    <h3 className="font-bold text-red-400 text-lg">{battleResult.character_2_stats?.name || char2}</h3>
                    <p className="text-sm text-gray-400">{battleResult.character_2_stats?.universe || "Unknown"}</p>
                    <p className="text-sm mt-2 text-gray-300">{battleResult.character_2_stats?.key_abilities || "N/A"}</p>
                  </div>
                </div>

                {battleResult.category_scores && Object.keys(battleResult.category_scores).length > 0 && (
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-bold text-yellow-400 mb-3">📊 Category Scores (0-10)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(battleResult.category_scores).map(([cat, sc]: [string, any]) => (
                        <div key={cat} className="bg-gray-900 p-3 rounded">
                          <p className="text-xs text-gray-400 capitalize mb-2">{cat.replace(/_/g, ' ')}</p>
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-400 font-bold">{sc?.char1 ?? sc?.character_1 ?? "?"}</span>
                            <span className="text-gray-500">vs</span>
                            <span className="text-red-400 font-bold">{sc?.char2 ?? sc?.character_2 ?? "?"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {battleResult.battle_dynamics && (
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-bold text-yellow-400 mb-2">⚡ Battle Dynamics</h4>
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{battleResult.battle_dynamics}</p>
                  </div>
                )}

                {battleResult.verdict && (
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-bold text-green-400 mb-2">🏆 Verdict</h4>
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{battleResult.verdict}</p>
                    {battleResult.win_probability && (
                      <div className="mt-4 flex items-center gap-4">
                        <div className="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
                          <div className="bg-blue-500 h-full" style={{ width: `${battleResult.win_probability.character_1 || battleResult.win_probability.char1 || 50}%` }}></div>
                        </div>
                        <span className="text-sm font-mono">
                          {battleResult.win_probability.character_1 || battleResult.win_probability.char1 || 50}% vs {battleResult.win_probability.character_2 || battleResult.win_probability.char2 || 50}%
                        </span>
                        <div className="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
                          <div className="bg-red-500 h-full" style={{ width: `${battleResult.win_probability.character_2 || battleResult.win_probability.char2 || 50}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button onClick={generateMangaFromBattle} className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold py-4 rounded-lg transition shadow-lg">
                  🎨 Generate Fight Manga Panels
                </button>
              </div>
            )}
          </div>
        )}


        {/* Weapons Arsenal Section */}
<section className="mb-16">
  <div className="max-w-5xl mx-auto">
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-900/40 via-orange-900/40 to-yellow-900/40 border border-red-500/30 shadow-2xl shadow-red-500/20">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(239,68,68,0.3),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(249,115,22,0.3),transparent_50%)]" />

      <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
        {/* Left: Content */}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 backdrop-blur-sm rounded-full border border-red-500/30 mb-4">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-red-300 uppercase tracking-wider">90+ Weapons</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
            ️ Manga Arsenal
          </h2>
          <p className="text-lg text-red-200 mb-6 max-w-lg">
            Browse 90+ iconic weapons from One Piece, Bleach, Naruto & more.
            <span className="font-bold text-white"> Take the quiz, battle weapons!</span>
          </p>

          <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-6">
            <div className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <span className="text-xs text-red-200">🗡️</span>
              <span className="text-sm font-bold text-white ml-1">Database</span>
            </div>
            <div className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <span className="text-xs text-red-200">🎯</span>
              <span className="text-sm font-bold text-white ml-1">Quiz</span>
            </div>
            <div className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <span className="text-xs text-red-200">💥</span>
              <span className="text-sm font-bold text-white ml-1">Battle</span>
            </div>
          </div>

          <Link
            href="/weapons"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 hover:from-red-500 hover:via-orange-500 hover:to-yellow-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105"
          >
            Explore Arsenal
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        {/* Right: Visual */}
        <div className="flex-shrink-0">
          <div className="relative w-48 h-48 md:w-56 md:h-56">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 to-orange-600/30 rounded-2xl blur-2xl animate-pulse" />
            <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-gray-900 to-black border-2 border-red-500/50 flex items-center justify-center overflow-hidden">
              <div className="text-7xl md:text-8xl opacity-80">⚔️</div>
              <div className="absolute bottom-3 left-0 right-0 text-center">
                <span className="text-xs font-bold text-red-300 uppercase tracking-wider">90+ Weapons</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

        {/* ==================== MANGA GENERATOR ==================== */}
        {activeTab === "manga" && (
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl">
            <form onSubmit={handleMangaGen} className="space-y-4">
              <textarea placeholder="Describe the manga panel you want to generate..." value={mangaPrompt} onChange={(e) => setMangaPrompt(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 h-24" required />
              <select value={mangaStyle} onChange={(e) => setMangaStyle(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500">
                <option value="shonen">Shonen (Bold, Dynamic)</option>
                <option value="shojo">Shojo (Soft, Sparkly)</option>
                <option value="seinen">Seinen (Dark, Detailed)</option>
                <option value="chibi">Chibi (Cute, Small)</option>
              </select>
              <button type="submit" disabled={mangaLoading} className={`w-full font-bold py-3 rounded-lg transition ${mangaLoading ? "bg-gray-600 cursor-not-allowed opacity-50 text-gray-300" : "bg-pink-600 hover:bg-pink-700 text-white"}`}>
                {mangaLoading ? "🎨 Generating Manga (Please wait)..." : "✨ Generate Manga Panel"}
              </button>
            </form>
            {mangaError && (<div className="mt-6 p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-300">{mangaError}</div>)}
            {mangaImage && (
              <div className="mt-6 flex justify-center">
                <img src={mangaImage} alt="Generated Manga" className="rounded-lg border-2 border-pink-500 shadow-2xl max-w-full h-auto" />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}