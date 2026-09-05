"use client";

import { useState, useEffect, useRef } from "react";
import { Sword, Zap, Shield, Search, Share2, X, Flame, Sparkles, Trophy } from "lucide-react";

const API_BASE = "http://localhost:8000/api/weapons";

interface Weapon {
  name: string;
  owner: string;
  anime: string;
  type: string;
  power: number;
  speed: number;
  hax: number;
  ability: string;
  weakness: string;
  lore: string;
  image_url?: string;
}

type Tab = "database" | "quiz" | "battle";

export default function WeaponsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("database");
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Quiz states
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<Weapon | null>(null);

  // Battle states
  const [battleW1, setBattleW1] = useState("");
  const [battleW2, setBattleW2] = useState("");
  const [battleResult, setBattleResult] = useState<any>(null);

  useEffect(() => {
    fetchWeapons();
  }, []);

  const fetchWeapons = async (q?: string) => {
    try {
      const url = q ? `${API_BASE}/search?q=${encodeURIComponent(q)}` : `${API_BASE}/all`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.weapons) setWeapons(data.weapons);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (q.length >= 2) fetchWeapons(q);
    else if (q.length === 0) fetchWeapons();
  };

  // Quiz Logic
  const quizQuestions = [
    { key: "style", q: "What's your fighting style?", options: ["Aggressive ⚔️", "Defensive 🛡️", "Strategic 🧠", "Speed-based ⚡"] },
    { key: "element", q: "Choose your element!", options: ["Fire 🔥", "Ice ❄️", "Lightning ⚡", "Shadow 🌑", "Wind 🌪️", "Light ✨"] },
    { key: "personality", q: "Your personality?", options: ["Hot-headed 😤", "Calm & Collected 😌", "Chaotic Evil 😈", "Silent Warrior 🤫"] },
    { key: "range", q: "Preferred range?", options: ["Melee (Close) 🗡️", "Mid-range 🏹", "Long-range 🔫", "All-range 🌀"] },
  ];

  const handleQuizAnswer = (key: string, value: string) => {
    const newAnswers = { ...quizAnswers, [key]: value };
    setQuizAnswers(newAnswers);

    if (quizStep < quizQuestions.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      generateQuizWeapon(newAnswers);
    }
  };

  const generateQuizWeapon = async (answers: Record<string, string>) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (data.weapon) setQuizResult(data.weapon);
    } catch (err) {
      console.error("Quiz error:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetQuiz = () => {
    setQuizStep(0);
    setQuizAnswers({});
    setQuizResult(null);
  };

  // Funny Personalized Messages
  const getFunnyMessage = (weapon: Weapon) => {
    const messages: Record<string, string[]> = {
      high_power: [
        "With this kind of power, you could probably cut through your ex's excuses! 💪",
        "Your weapon is so powerful, it makes Saitama look lazy! 🔥",
        "Congratulations! You're now 90% more dangerous than average! ⚔️"
      ],
      high_speed: [
        "So fast, you'll finish battles before your enemies realize they started! ⚡",
        "Speed demon detected! Even Flash would be jealous! 💨",
        "You move so fast, you're basically everywhere at once! 🌪️"
      ],
      high_hax: [
        "Your weapon breaks reality more than your sleep schedule! 🌀",
        "So hax it should be illegal... oh wait, it is! ⚖️",
        "Reality? More like 'reality-minus' with this weapon! 🎮"
      ],
      balanced: [
        "Jack of all trades, master of... well, all trades actually! 🎯",
        "Perfectly balanced, as all things should be! ⚖️",
        "You're the Swiss Army knife of manga warriors! 🔧"
      ],
      low_stats: [
        "It's not about the size of the weapon, it's how you use it! 😅",
        "Underdog energy! David would be proud! 💪",
        "Sometimes the weakest weapon makes the strongest story! 📖"
      ]
    };

    const avg = (weapon.power / 10 + weapon.speed + weapon.hax) / 3;

    if (weapon.power >= 900) return messages.high_power[Math.floor(Math.random() * messages.high_power.length)];
    if (weapon.speed >= 95) return messages.high_speed[Math.floor(Math.random() * messages.high_speed.length)];
    if (weapon.hax >= 85) return messages.high_hax[Math.floor(Math.random() * messages.high_hax.length)];
    if (avg >= 80) return messages.balanced[Math.floor(Math.random() * messages.balanced.length)];
    return messages.low_stats[Math.floor(Math.random() * messages.low_stats.length)];
  };

  // Share Function
  const handleShareWeapon = async () => {
    setIsCapturing(true);

    try {
      const { toPng } = await import("html-to-image");
      const card = document.getElementById("weapon-share-card");

      if (!card) throw new Error("Card not found");

      const dataUrl = await toPng(card, {
        pixelRatio: 3,
        backgroundColor: "#0a0a0f",
        quality: 1.0,
      });

      // Try native share first
      if (navigator.share && navigator.canShare) {
        const file = new File([await (await fetch(dataUrl)).blob()], `my-weapon-${quizResult?.name.replace(/\s+/g, '-').toLowerCase()}.png`, { type: "image/png" });
        await navigator.share({
          title: `My Manga Weapon: ${quizResult?.name}`,
          text: `I got ${quizResult?.name} in the MangaVerse quiz! ${getFunnyMessage(quizResult!)}`,
          files: [file],
        });
      } else {
        // Fallback to download
        const link = document.createElement("a");
        link.download = `my-weapon-${quizResult?.name.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("Share error:", err);
      alert("Could not generate image. Try taking a screenshot!");
    } finally {
      setIsCapturing(false);
    }
  };

  // Battle Logic
  const handleBattle = async () => {
    if (!battleW1 || !battleW2) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/battle?weapon1=${encodeURIComponent(battleW1)}&weapon2=${encodeURIComponent(battleW2)}`);
      const data = await res.json();
      if (data.status === "success") setBattleResult(data);
    } catch (err) {
      console.error("Battle error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getPowerColor = (val: number) => {
    if (val >= 900) return "text-red-400";
    if (val >= 700) return "text-orange-400";
    if (val >= 500) return "text-yellow-400";
    return "text-green-400";
  };

  const getStatBar = (val: number, max: number = 100) => {
    const pct = Math.min((val / max) * 100, 100);
    return (
      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            pct >= 90 ? "bg-gradient-to-r from-red-500 to-pink-500" :
            pct >= 70 ? "bg-gradient-to-r from-orange-500 to-yellow-500" :
            pct >= 50 ? "bg-gradient-to-r from-yellow-500 to-green-500" :
            "bg-gradient-to-r from-green-500 to-cyan-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-red-950/10 to-gray-950 text-gray-100 p-4 pb-20">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-4">
          <h1 className="text-5xl font-black bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent tracking-tight mb-2">
            ⚔️ Manga Arsenal
          </h1>
          <p className="text-sm text-gray-400">
            Browse 90+ Iconic Weapons • Take the Quiz • Battle Simulator
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 justify-center">
          {(["database", "quiz", "battle"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-500/30"
                  : "bg-gray-900/60 text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              {tab === "database" && "🗡️ "}
              {tab === "quiz" && "🎯 "}
              {tab === "battle" && "💥 "}
              {tab}
            </button>
          ))}
        </div>

        {/* DATABASE TAB */}
        {activeTab === "database" && (
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search weapons, characters, or anime..."
                className="w-full bg-gray-900/80 border border-gray-800 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
              />
            </div>

            {/* Weapons Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weapons.map((w) => (
                <div
                  key={w.name}
                  onClick={() => setSelectedWeapon(w)}
                  className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800 hover:border-red-500/50 p-4 cursor-pointer transition-all hover:scale-[1.02] group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition">{w.name}</h3>
                    <span className={`text-sm font-black ${getPowerColor(w.power)}`}>{w.power}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-1">{w.owner} • {w.anime}</p>
                  <p className="text-xs text-gray-500 mb-3">{w.type}</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500 w-12">PWR</span>
                      {getStatBar(w.power, 1000)}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500 w-12">SPD</span>
                      {getStatBar(w.speed)}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500 w-12">HAX</span>
                      {getStatBar(w.hax)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {weapons.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Sword className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>No weapons found. Run the seed script first!</p>
              </div>
            )}
          </div>
        )}

        {/* QUIZ TAB */}
        {activeTab === "quiz" && (
          <div className="max-w-lg mx-auto">
            {!quizResult ? (
              <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800 p-8">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-2">🎯</div>
                  <h2 className="text-2xl font-black text-white">What's Your Manga Weapon?</h2>
                  <p className="text-sm text-gray-400 mt-1">Answer 4 questions to discover your weapon</p>
                  <div className="flex gap-1 justify-center mt-4">
                    {quizQuestions.map((_, i) => (
                      <div key={i} className={`w-8 h-1 rounded ${i <= quizStep ? "bg-red-500" : "bg-gray-700"}`} />
                    ))}
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-300">Forging your weapon...</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4 text-center">
                      {quizQuestions[quizStep].q}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {quizQuestions[quizStep].options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleQuizAnswer(quizQuestions[quizStep].key, opt)}
                          className="p-4 bg-gray-800 hover:bg-red-900/40 border border-gray-700 hover:border-red-500/50 rounded-xl text-white font-medium transition-all text-sm"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                {/* Beautiful Shareable Card */}
                <div
                  id="weapon-share-card"
                  className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-900/60 via-orange-900/60 to-yellow-900/60 border-2 border-red-500/50 shadow-2xl shadow-red-500/30 p-8"
                >
                  {/* Animated Background */}
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_50%)] animate-pulse" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,200,100,0.3),transparent_50%)]" />
                  </div>

                  {/* Holographic Shine Effect */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none bg-[linear-gradient(115deg,transparent_20%,rgba(255,255,255,0.5)_40%,rgba(255,255,255,0.7)_50%,rgba(255,255,255,0.5)_60%,transparent_80%)] animate-[shimmer_3s_infinite_linear]" />

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Header */}
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full border border-red-500/50 mb-3">
                        <span className="text-xs font-bold text-red-300 uppercase tracking-wider">⚔️ My Manga Weapon</span>
                      </div>
                      <h2 className="text-3xl font-black text-white mb-1 leading-tight">
                        {quizResult.name}
                      </h2>
                      <p className="text-sm text-orange-300">{quizResult.type}</p>
                    </div>

                    {/* Weapon Image or Icon */}
                    <div className="my-6 flex justify-center">
                      {quizResult.image_url ? (
                        <div className="relative w-40 h-40 rounded-2xl overflow-hidden border-4 border-red-500/50 shadow-2xl shadow-red-500/40">
                          <img
                            src={quizResult.image_url}
                            alt={quizResult.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden absolute inset-0 bg-gradient-to-br from-red-900 to-orange-900 flex items-center justify-center text-6xl">
                            ⚔️
                          </div>
                        </div>
                      ) : (
                        <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-red-900 to-orange-900 flex items-center justify-center text-6xl border-4 border-red-500/50 shadow-2xl">
                          ⚔️
                        </div>
                      )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="p-3 bg-black/40 backdrop-blur-sm rounded-xl border border-red-500/30 text-center">
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">POWER</div>
                        <div className={`text-2xl font-black ${getPowerColor(quizResult.power)}`}>
                          {quizResult.power}
                        </div>
                      </div>
                      <div className="p-3 bg-black/40 backdrop-blur-sm rounded-xl border border-orange-500/30 text-center">
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">SPEED</div>
                        <div className="text-2xl font-black text-cyan-400">{quizResult.speed}</div>
                      </div>
                      <div className="p-3 bg-black/40 backdrop-blur-sm rounded-xl border border-purple-500/30 text-center">
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">HAX</div>
                        <div className="text-2xl font-black text-purple-400">{quizResult.hax}</div>
                      </div>
                    </div>

                    {/* Funny Personalized Message */}
                    <div className="p-4 bg-gradient-to-r from-black/40 to-gray-900/40 backdrop-blur-sm rounded-xl border border-white/10 mb-4">
                      <p className="text-sm text-white italic text-center leading-relaxed">
                        {getFunnyMessage(quizResult)}
                      </p>
                    </div>

                    {/* Ability */}
                    <div className="p-3 bg-black/30 rounded-xl border border-white/10 mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-3 h-3 text-yellow-400" />
                        <span className="text-[10px] text-gray-400 uppercase">Special Ability</span>
                      </div>
                      <p className="text-xs text-white font-medium">{quizResult.ability}</p>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-white/10 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="text-xl">🎌</span>
                        <span className="text-sm font-bold text-white">MangaVerse</span>
                      </div>
                      <p className="text-[10px] text-gray-400">mangaverse.com/weapons</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleShareWeapon}
                    disabled={isCapturing}
                    className="flex-1 py-4 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 hover:from-red-500 hover:via-orange-500 hover:to-yellow-500 text-white font-bold rounded-xl transition shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                  >
                    {isCapturing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating Card...
                      </>
                    ) : (
                      <>
                        <Share2 className="w-5 h-5" />
                        Share Weapon
                      </>
                    )}
                  </button>
                  <button
                    onClick={resetQuiz}
                    className="px-6 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition border border-gray-700"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BATTLE TAB */}
        {activeTab === "battle" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800 p-6">
              <h2 className="text-2xl font-black text-white text-center mb-6">💥 Weapon vs Weapon</h2>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-xs text-gray-400 uppercase mb-1 block">Weapon 1</label>
                  <input
                    type="text"
                    value={battleW1}
                    onChange={(e) => setBattleW1(e.target.value)}
                    placeholder="e.g., Rasengan"
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase mb-1 block">Weapon 2</label>
                  <input
                    type="text"
                    value={battleW2}
                    onChange={(e) => setBattleW2(e.target.value)}
                    placeholder="e.g., Chidori"
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <button
                onClick={handleBattle}
                disabled={loading || !battleW1 || !battleW2}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-lg shadow-red-500/30"
              >
                {loading ? "⚔️ Fighting..." : "⚔️ START BATTLE"}
              </button>
            </div>

            {battleResult && (
              <div className="bg-gradient-to-br from-red-900/40 to-orange-900/40 rounded-2xl border border-red-500/30 p-6 text-center animate-in fade-in zoom-in duration-500">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-3xl font-black text-white mb-2">{battleResult.winner}</h3>
                <p className="text-sm text-red-300 mb-4">
                  Wins with {battleResult.win_chance}% probability!
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className={`p-4 rounded-xl border ${battleResult.winner === battleResult.weapon1.name ? "bg-green-900/30 border-green-500/50" : "bg-gray-900/50 border-gray-700"}`}>
                    <p className="text-sm font-bold text-white">{battleResult.weapon1.name}</p>
                    <p className="text-xs text-gray-400">{battleResult.weapon1.owner}</p>
                    <p className="text-lg font-black text-red-400 mt-2">Score: {battleResult.score1}</p>
                  </div>
                  <div className={`p-4 rounded-xl border ${battleResult.winner === battleResult.weapon2.name ? "bg-green-900/30 border-green-500/50" : "bg-gray-900/50 border-gray-700"}`}>
                    <p className="text-sm font-bold text-white">{battleResult.weapon2.name}</p>
                    <p className="text-xs text-gray-400">{battleResult.weapon2.owner}</p>
                    <p className="text-lg font-black text-red-400 mt-2">Score: {battleResult.score2}</p>
                  </div>
                </div>

                <button
                  onClick={() => setBattleResult(null)}
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition"
                >
                  New Battle
                </button>
              </div>
            )}
          </div>
        )}

        {/* Weapon Detail Modal */}
        {selectedWeapon && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-red-500/30 p-6 shadow-2xl">
              <button
                onClick={() => setSelectedWeapon(null)}
                className="absolute top-3 right-3 p-2 bg-black/80 hover:bg-red-600 rounded-full border border-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-black text-white mb-1">{selectedWeapon.name}</h2>
              <p className="text-sm text-red-400 mb-1">{selectedWeapon.owner}</p>
              <p className="text-xs text-gray-500 mb-4">{selectedWeapon.anime} • {selectedWeapon.type}</p>

              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">⚔️ Power</span>
                    <span className={`font-bold ${getPowerColor(selectedWeapon.power)}`}>{selectedWeapon.power}/1000</span>
                  </div>
                  {getStatBar(selectedWeapon.power, 1000)}
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">💨 Speed</span>
                    <span className="font-bold text-cyan-400">{selectedWeapon.speed}/100</span>
                  </div>
                  {getStatBar(selectedWeapon.speed)}
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">🌀 Hax</span>
                    <span className="font-bold text-purple-400">{selectedWeapon.hax}/100</span>
                  </div>
                  {getStatBar(selectedWeapon.hax)}
                </div>
              </div>

              <div className="p-3 bg-black/30 rounded-lg border border-white/10 mb-3">
                <p className="text-xs text-gray-400 uppercase mb-1">Special Ability</p>
                <p className="text-sm text-white">{selectedWeapon.ability}</p>
              </div>

              <div className="p-3 bg-black/30 rounded-lg border border-white/10 mb-3">
                <p className="text-xs text-gray-400 uppercase mb-1">Weakness</p>
                <p className="text-sm text-red-300">{selectedWeapon.weakness}</p>
              </div>

              <div className="p-3 bg-black/30 rounded-lg border border-white/10">
                <p className="text-xs text-gray-400 uppercase mb-1">Lore</p>
                <p className="text-sm text-gray-300 italic">{selectedWeapon.lore}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-150%) skewX(-15deg); }
          100% { transform: translateX(150%) skewX(-15deg); }
        }
      `}</style>
    </main>
  );
}