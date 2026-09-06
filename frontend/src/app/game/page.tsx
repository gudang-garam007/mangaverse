"use client";
import { useState, useEffect } from "react";
import { Script } from "next/script"; // ✅ ADDED FOR ADS
import FastImage from "@/components/FastImage";
import ShareCard from "@/components/ShareCard";

interface Hint {
  value: string | number;
  status: "correct" | "incorrect" | "close";
  direction?: string;
}

interface GuessResult {
  hints: {
    universe: Hint;
    gender: Hint;
    name_length: Hint;
    first_letter: Hint;
  };
  is_correct: boolean;
  guess_name: string;
}

type GameMode = "silhouette" | "quote" | "radar" | "progressive";

const MAX_ATTEMPTS = 6;
const STORAGE_KEY = "mangaldle_state";
const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/game`;

export default function GamePage() {
  const [guess, setGuess] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [attempts, setAttempts] = useState<GuessResult[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [puzzleDate, setPuzzleDate] = useState("");
  const [puzzleId, setPuzzleId] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);

  // 🎮 Game Mode State
  const [gameMode, setGameMode] = useState<GameMode>("silhouette");
  const [quote, setQuote] = useState("");
  const [radarStats, setRadarStats] = useState({
    speed: 0,
    power: 0,
    hax: 0,
    battle_iq: 0,
    stamina: 0,
    experience: 0
  });
  const [revealedStats, setRevealedStats] = useState<string[]>([]);
  const [progressiveHints, setProgressiveHints] = useState<{
    universe_first?: string;
    gender?: string;
    power_tier?: string;
    debut_decade?: string;
  }>({});

  // Load saved state on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const today = new Date().toISOString().split("T")[0];

    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.date === today) {
          setAttempts(state.attempts || []);
          setWon(state.won || false);
          setGameOver(state.gameOver || false);
          setRevealed(state.revealed || false);
          setAnswer(state.answer || "");
          setGameMode(state.gameMode || "silhouette");
          setQuote(state.quote || "");
          setRadarStats(state.radarStats || { speed: 0, power: 0, hax: 0, battle_iq: 0, stamina: 0, experience: 0 });
          setRevealedStats(state.revealedStats || []);
          setProgressiveHints(state.progressiveHints || {});
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    // Fetch today's puzzle with mode
    fetch(`${API_BASE}/today`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status === "success") {
          setPuzzleDate(d.date);
          setPuzzleId(d.puzzle_number);
          setGameMode(d.mode || "silhouette");
          setQuote(d.quote || "");
          setRadarStats(d.radarStats || { speed: 0, power: 0, hax: 0, battle_iq: 0, stamina: 0, experience: 0 });
        }
      })
      .catch(() => {});
  }, []);

  // Save state on every change
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        date: today,
        attempts,
        won,
        gameOver,
        revealed,
        answer,
        gameMode,
        quote,
        radarStats,
        revealedStats,
        progressiveHints,
      })
    );
  }, [attempts, won, gameOver, revealed, answer, gameMode, quote, radarStats, revealedStats, progressiveHints]);

  const handleGuessChange = async (value: string) => {
    setGuess(value);
    if (value.length >= 2) {
      try {
        const res = await fetch(`${API_BASE}/autocomplete?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  const submitGuess = async (selectedGuess?: string) => {
    const guessToUse = (selectedGuess || guess).trim();
    if (!guessToUse || attempts.length >= MAX_ATTEMPTS || gameOver) return;

    setLoading(true);
    setError("");
    setSuggestions([]);

    try {
      const res = await fetch(`${API_BASE}/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess: guessToUse }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      const newAttempts = [...attempts, data];
      setAttempts(newAttempts);
      setGuess("");

      // 🎮 Reveal one more stat for Radar mode
      if (gameMode === "radar" && revealedStats.length < 6) {
        const allStats = ["speed", "power", "hax", "battle_iq", "stamina", "experience"];
        const nextStat = allStats[revealedStats.length];
        setRevealedStats([...revealedStats, nextStat]);
      }

      // 🎮 Reveal progressive hints
      if (gameMode === "progressive") {
        const newHints = { ...progressiveHints };
        if (newAttempts.length === 1) newHints.universe_first = "O";
        if (newAttempts.length === 2) newHints.gender = "Male";
        if (newAttempts.length === 3) newHints.power_tier = "6-8";
        if (newAttempts.length === 4) newHints.debut_decade = "2000s";
        setProgressiveHints(newHints);
      }

      if (data.is_correct) {
        setWon(true);
        setGameOver(true);
        setShowShareCard(true);
      } else if (newAttempts.length >= MAX_ATTEMPTS) {
        setGameOver(true);
        // ✅ AUTO-REVEAL: Jab user haar jaye, character reveal karo
        try {
          const revealRes = await fetch(`${API_BASE}/reveal`);
          const revealData = await revealRes.json();
          if (revealData.status === "success") {
            setAnswer(revealData.name);
            setRevealed(true);
          }
        } catch (err) {
          console.error("Failed to reveal answer:", err);
        }
        setShowShareCard(true);
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const revealAnswer = async () => {
    if (revealed || gameOver) return;
    try {
      const res = await fetch(`${API_BASE}/reveal`);
      const data = await res.json();
      if (data.status === "success") {
        setAnswer(data.name);
        setRevealed(true);
        setGameOver(true);
      }
    } catch {
      setError("Failed to reveal answer");
    }
  };

  // ✅ FIXED: Emoji grid bug (was missing green squares)
  const getShareText = () => {
    const emojiGrid = attempts
      .map((a) => {
        const u = a.hints.universe.status === "correct" ? "🟩" : "🟥";
        const g = a.hints.gender.status === "correct" ? "🟩" : "🟥";
        const n = a.hints.name_length.status === "correct" ? "🟩" : a.hints.name_length.status === "close" ? "🟨" : "🟥";
        const f = a.hints.first_letter.status === "correct" ? "🟩" : "🟥";
        return `${u}${g}${n}${f}`;
      })
      .join("\n");

    return `🎌 MangaLdle #${puzzleId}\nMode: ${gameMode.toUpperCase()}\n${won ? `✅ Solved in ${attempts.length}/${MAX_ATTEMPTS}!` : `❌ Failed!`}\n\n${emojiGrid}\n\n👉 Play: manga-ta.vercel.app/game`;
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(getShareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Copy failed. Try manually.");
    }
  };

  const getHintColor = (status: string) => {
    if (status === "correct") return "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-green-500/30";
    if (status === "close") return "bg-gradient-to-br from-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-500/30";
    return "bg-gradient-to-br from-rose-600 to-red-700 text-white shadow-lg shadow-red-500/20";
  };

  const getDirectionArrow = (hint: Hint) => {
    if (hint.direction === "higher") return "⬆️";
    if (hint.direction === "lower") return "⬇️";
    return "";
  };

  const revealPercent = gameOver ? 100 : (attempts.length / MAX_ATTEMPTS) * 100;

  // 🎮 Render different modes
  const renderModeContent = () => {
    switch (gameMode) {
      case "silhouette":
        return (
          <div className="mb-8 flex justify-center">
            <FastImage
              src={`https://image.pollinations.ai/prompt/anime%20manga%20character%20portrait%20shonen%20style%20masterpiece?width=512&height=512&nologo=true&seed=${puzzleId}&model=flux`}
              alt="Mystery Character"
              className="w-48 h-48 md:w-64 md:h-64 rounded-2xl border-2 border-purple-500/30 shadow-2xl shadow-purple-900/20"
              silhouette={true}
              revealPercent={revealPercent}
            />
          </div>
        );

      case "quote":
        return (
          <div className="mb-8 p-8 bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-2xl border border-purple-500/30 text-center backdrop-blur-sm animate-in fade-in zoom-in duration-500">
            <div className="text-5xl mb-4 opacity-80">💬</div>
            <blockquote className="text-xl md:text-2xl font-medium text-white italic mb-6 leading-relaxed">
              "{quote || 'Loading iconic quote...'}"
            </blockquote>
            <div className="flex items-center justify-center gap-2">
              <span className="px-3 py-1 bg-purple-500/20 rounded-full border border-purple-500/30 text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Guess who said this!
              </span>
            </div>
          </div>
        );

      case "radar":
        return (
          <div className="mb-8 p-6 bg-gray-900/60 rounded-2xl border border-gray-800">
            <h3 className="text-sm font-bold text-gray-300 mb-4 text-center">📊 Power Stats Radar</h3>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(radarStats).map(([stat, value]) => {
                const isRevealed = revealedStats.includes(stat) || gameOver;
                return (
                  <div key={stat} className={`p-3 rounded-lg border transition-all duration-300 ${isRevealed ? "bg-purple-900/30 border-purple-500/30" : "bg-gray-800/50 border-gray-700"}`}>
                    <div className="text-[10px] uppercase text-gray-400 mb-1">{stat.replace("_", " ")}</div>
                    <div className="text-lg font-bold text-white">{isRevealed ? value : "❓"}</div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">One stat revealed per guess</p>
          </div>
        );

      case "progressive":
        return (
          <div className="mb-8 p-6 bg-gray-900/60 rounded-2xl border border-gray-800">
            <h3 className="text-sm font-bold text-gray-300 mb-4 text-center">🎯 Progressive Hints</h3>
            <div className="space-y-2">
              <div className={`flex justify-between p-3 rounded-lg transition-all ${progressiveHints.universe_first ? "bg-emerald-900/30 border border-emerald-500/30" : "bg-gray-800/50 border border-gray-700"}`}>
                <span className="text-xs text-gray-400">Universe (1st Letter)</span>
                <span className="text-sm font-bold text-white">{progressiveHints.universe_first || "🔒"}</span>
              </div>
              <div className={`flex justify-between p-3 rounded-lg transition-all ${progressiveHints.gender ? "bg-emerald-900/30 border border-emerald-500/30" : "bg-gray-800/50 border border-gray-700"}`}>
                <span className="text-xs text-gray-400">Gender</span>
                <span className="text-sm font-bold text-white">{progressiveHints.gender || "🔒"}</span>
              </div>
              <div className={`flex justify-between p-3 rounded-lg transition-all ${progressiveHints.power_tier ? "bg-emerald-900/30 border border-emerald-500/30" : "bg-gray-800/50 border border-gray-700"}`}>
                <span className="text-xs text-gray-400">Power Tier</span>
                <span className="text-sm font-bold text-white">{progressiveHints.power_tier || "🔒"}</span>
              </div>
              <div className={`flex justify-between p-3 rounded-lg transition-all ${progressiveHints.debut_decade ? "bg-emerald-900/30 border border-emerald-500/30" : "bg-gray-800/50 border border-gray-700"}`}>
                <span className="text-xs text-gray-400">Debut Decade</span>
                <span className="text-sm font-bold text-white">{progressiveHints.debut_decade || "🔒"}</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950 text-gray-100 p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 pt-4">
          <div className="inline-block">
            <h1 className="text-5xl font-black bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent tracking-tight">
              MangaLdle
            </h1>
            <p className="text-xs text-gray-400 mt-1 tracking-widest uppercase">
              Daily Manga Character Puzzle
            </p>
          </div>
          <div className="flex justify-center items-center gap-3 mt-3 text-xs text-gray-500">
            <span className="px-2 py-1 bg-gray-900/50 rounded border border-gray-800">📅 {puzzleDate || "Loading..."}</span>
            <span className="px-2 py-1 bg-gray-900/50 rounded border border-gray-800">#{puzzleId || "----"}</span>
            <span className="px-2 py-1 bg-purple-900/50 rounded border border-purple-800 text-purple-300 uppercase font-bold">{gameMode}</span>
          </div>
          <button onClick={() => setShowRules(!showRules)} className="mt-3 text-xs text-purple-400 hover:text-purple-300 underline">
            {showRules ? "Hide Rules" : "How to Play?"}
          </button>

          {showRules && (
            <div className="mt-3 p-4 bg-gray-900/60 rounded-lg border border-purple-500/20 text-left text-sm text-gray-300">
              <p className="mb-2">🎯 Guess today's mystery manga character in <strong className="text-white">6 attempts</strong>.</p>
              <p className="mb-2"><strong>Mode: {gameMode.toUpperCase()}</strong></p>
              {gameMode === "silhouette" && <p>👁️ Silhouette reveals 20% with each guess</p>}
              {gameMode === "quote" && <p>💬 Guess who said the iconic quote</p>}
              {gameMode === "radar" && <p>📊 One stat revealed per guess</p>}
              {gameMode === "progressive" && <p>🎯 Hints unlock progressively</p>}
              <p className="mt-2 mb-2">🟩 <strong className="text-emerald-400">Green</strong> = Correct</p>
              <p className="mb-2">🟨 <strong className="text-amber-400">Yellow</strong> = Close</p>
              <p>🟥 <strong className="text-rose-400">Red</strong> = Incorrect</p>
            </div>
          )}
        </div>

        {/* ✅ ADSTERRA NATIVE BANNER (TOP - HIGH VISIBILITY) */}
        <div className="w-full flex justify-center my-6 min-h-[100px] bg-gray-900/30 rounded-xl border border-gray-800/50 overflow-hidden">
          <Script
            src="https://pl31218662.profitableratecpmnetwork.com/fb65e70ebb201c3fe329914b0de99570/invoke.js"
            strategy="afterInteractive"
            async
            data-cfasync="false"
          />
          <div id="container-fb65e70ebb201c3fe329914b0de99570"></div>
        </div>

        {/* 🎮 MODE-SPECIFIC CONTENT */}
        {renderModeContent()}

        {/* Attempts Counter */}
        <div className="flex justify-center gap-1 mb-6">
          {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold transition-all ${
                i < attempts.length
                  ? attempts[i].is_correct
                    ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white scale-110"
                    : "bg-gradient-to-br from-rose-600 to-red-700 text-white"
                  : "bg-gray-800/50 text-gray-600 border border-gray-700"
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Guess History */}
        <div className="space-y-3 mb-6">
          {attempts.map((attempt, idx) => (
            <div key={idx} className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 border border-gray-800 animate-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-white">{attempt.guess_name}</span>
                {attempt.is_correct && (
                  <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">✅ CORRECT</span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className={`rounded-lg p-2 text-center ${getHintColor(attempt.hints.universe.status)}`}>
                  <div className="text-[10px] uppercase opacity-80 mb-1">Universe</div>
                  <div className="text-sm font-bold truncate">{attempt.hints.universe.value}</div>
                </div>
                <div className={`rounded-lg p-2 text-center ${getHintColor(attempt.hints.gender.status)}`}>
                  <div className="text-[10px] uppercase opacity-80 mb-1">Gender</div>
                  <div className="text-sm font-bold">{attempt.hints.gender.value}</div>
                </div>
                <div className={`rounded-lg p-2 text-center ${getHintColor(attempt.hints.name_length.status)}`}>
                  <div className="text-[10px] uppercase opacity-80 mb-1">Length</div>
                  <div className="text-sm font-bold">{attempt.hints.name_length.value} {getDirectionArrow(attempt.hints.name_length)}</div>
                </div>
                <div className={`rounded-lg p-2 text-center ${getHintColor(attempt.hints.first_letter.status)}`}>
                  <div className="text-[10px] uppercase opacity-80 mb-1">1st Letter</div>
                  <div className="text-sm font-bold">{attempt.hints.first_letter.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Win/Lose Screen */}
        {gameOver && (
          <div className="mb-6 p-6 bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-2xl border border-purple-500/30 text-center backdrop-blur-sm animate-in fade-in zoom-in duration-500">
            {won ? (
              <>
                <div className="text-5xl mb-2">🎉</div>
                <h2 className="text-2xl font-black text-white mb-1">You Got It!</h2>
                <p className="text-purple-300 mb-4">Solved in {attempts.length}/{MAX_ATTEMPTS} attempts</p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-2">💀</div>
                <h2 className="text-2xl font-black text-white mb-1">Better Luck Tomorrow!</h2>

                {/* ✅ CHARACTER REVEAL SECTION */}
                {revealed && answer && (
                  <div className="mt-6 p-4 bg-black/30 rounded-xl border border-white/10">
                    <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">Today's Mystery Character Was</p>
                    <h3 className="text-3xl font-black text-white mb-2">{answer}</h3>

                    {/* Character Image */}
                    <div className="my-4 flex justify-center">
                      <img
                        src={`https://image.pollinations.ai/prompt/anime%20manga%20character%20${encodeURIComponent(answer)}%20portrait%20shonen%20style?width=300&height=300&nologo=true&seed=${puzzleId}&model=flux`}
                        alt={answer}
                        className="w-32 h-32 rounded-xl border-2 border-purple-500/50 shadow-lg shadow-purple-500/20 object-cover"
                      />
                    </div>

                    <p className="text-xs text-gray-400">
                      Come back tomorrow for a new challenge!
                    </p>
                  </div>
                )}
              </>
            )}

            <button
              onClick={() => setShowShareCard(true)}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-lg transition shadow-lg shadow-purple-500/30"
            >
              Share Result
            </button>
          </div>
        )}

        {/* Input Section */}
        {!gameOver && (
          <div className="relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={guess}
                  onChange={(e) => handleGuessChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitGuess(); }}
                  placeholder="Type a character name..."
                  disabled={loading}
                  className="w-full bg-gray-900/80 backdrop-blur-sm border-2 border-purple-500/30 focus:border-purple-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition"
                />
                {suggestions.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {suggestions.map((s) => (
                      <button key={s} onClick={() => submitGuess(s)} className="w-full text-left px-4 py-2 hover:bg-purple-900/40 text-sm text-gray-200 border-b border-gray-800 last:border-0">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => submitGuess()} disabled={loading || !guess.trim()} className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow-lg shadow-purple-500/30">
                {loading ? "..." : "Guess"}
              </button>
            </div>

            {error && (
              <div className="mt-2 p-3 bg-rose-900/30 border border-rose-500/30 rounded-lg text-rose-300 text-sm">⚠️ {error}</div>
            )}

            {attempts.length >= 3 && !gameOver && !revealed && (
              <button onClick={revealAnswer} className="mt-3 w-full py-2 text-xs text-gray-500 hover:text-rose-400 transition">🏳️ Give up & reveal answer</button>
            )}
          </div>
        )}

        {/* Next Puzzle Countdown */}
        <div className="mt-8 text-center text-xs text-gray-500">
          New puzzle in:{" "}
          <span className="text-purple-400 font-mono font-bold">
            {(() => {
              const now = new Date();
              const tomorrow = new Date(now);
              tomorrow.setUTCHours(24, 0, 0, 0);
              const diff = tomorrow.getTime() - now.getTime();
              const h = Math.floor(diff / 3600000);
              const m = Math.floor((diff % 3600000) / 60000);
              return `${h}h ${m}m`;
            })()}
          </span>
        </div>

        {/* ✅ ADSTERRA 320x50 MOBILE BANNER (BOTTOM OF GAME) */}
        <div className="w-full flex justify-center my-8">
          <Script id="adsterra-mobile-config-game" strategy="afterInteractive">
            {`
              atOptions = {
                'key' : '5857abbf9515619a371c38758a4e2461',
                'format' : 'iframe',
                'height' : 50,
                'width' : 320,
                'params' : {}
              };
            `}
          </Script>
          <Script
            src="https://www.highrevenueformat.com/5857abbf9515619a371c38758a4e2461/invoke.js"
            strategy="afterInteractive"
          />
        </div>

        {showShareCard && (
          <ShareCard
            attempts={attempts.length}
            won={won}
            gameMode={gameMode}
            puzzleId={puzzleId}
            onClose={() => setShowShareCard(false)}
          />
        )}
      </div>
    </main>
  );
}