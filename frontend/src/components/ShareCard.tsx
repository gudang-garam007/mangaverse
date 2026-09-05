"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Share2, Trophy, X, Flame } from "lucide-react";

interface ShareCardProps {
  attempts: number;
  won: boolean;
  gameMode: string;
  puzzleId: string;
  onClose: () => void;
}

export default function ShareCard({ attempts, won, gameMode, puzzleId, onClose }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Get Rank
  const getRank = () => {
    if (!won) return {
      label: "FAILED",
      color: "text-rose-500",
      glow: "shadow-rose-500/50",
      bg: "from-rose-900/40 to-rose-950/40",
      message: "The mystery defeated me... can you solve it?",
      emoji: "💀"
    };
    if (attempts <= 2) return {
      label: "LEGEND",
      color: "text-amber-400",
      glow: "shadow-amber-400/50",
      bg: "from-amber-900/40 to-amber-950/40",
      message: "I cracked it in just " + attempts + " guesses! Beat this!",
      emoji: "👑"
    };
    if (attempts <= 4) return {
      label: "EXPERT",
      color: "text-cyan-400",
      glow: "shadow-cyan-400/50",
      bg: "from-cyan-900/40 to-cyan-950/40",
      message: "Another day, another victory! Your turn!",
      emoji: "⚡"
    };
    return {
      label: "CHALLENGER",
      color: "text-purple-400",
      glow: "shadow-purple-400/50",
      bg: "from-purple-900/40 to-purple-950/40",
      message: "I survived the challenge! Think you can?",
      emoji: "🔥"
    };
  };

  const rank = getRank();

  // Convert hash to readable day number
  const getDayNumber = () => {
    // Convert first few chars of hash to a number
    const num = parseInt(puzzleId.slice(0, 8), 16) % 1000;
    return num || 1;
  };

  const dayNumber = getDayNumber();

  // FOMO Text based on mode
  const getFOMOText = () => {
    const modeTexts: Record<string, string> = {
      silhouette: "👁️ Can you identify the character from the shadows?",
      quote: " Do you know who said this iconic line?",
      radar: "📊 Can you read the power stats correctly?",
      progressive: "🎯 Can you handle the progressive hints?"
    };
    return modeTexts[gameMode] || "🎮 Test your anime knowledge!";
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setIsCapturing(true);

    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        backgroundColor: "#0a0a0f",
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        },
      });

      if (navigator.share && navigator.canShare) {
        const file = new File([await (await fetch(dataUrl)).blob()], `mangaldle-${dayNumber}.png`, { type: "image/png" });
        await navigator.share({
          title: `MangaLdle #${dayNumber} - ${rank.label}`,
          text: `${rank.message} Play now: mangaverse.com`,
          files: [file],
        });
      } else {
        const link = document.createElement("a");
        link.download = `mangaldle-${dayNumber}-${rank.label}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("Failed to capture card:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-gray-400 hover:text-white transition"
        >
          <X className="w-8 h-8" />
        </button>

        {/* THE CARD */}
                {/* THE CARD */}
        <div
          ref={cardRef}
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${rank.bg} border border-white/10 shadow-2xl ${rank.glow} p-8 text-center`}
          style={{ width: "400px", minHeight: "550px", margin: "0 auto" }}
        >
          {/* ✅ CLOSE BUTTON INSIDE CARD */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-black/60 hover:bg-black/80 rounded-full border border-white/20 text-white transition-all hover:scale-110 backdrop-blur-sm"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          {/* Holographic Shine */}
          <div className="absolute inset-0 opacity-30 pointer-events-none bg-[linear-gradient(115deg,transparent_20%,rgba(255,255,255,0.4)_40%,rgba(255,255,255,0.6)_50%,rgba(255,255,255,0.4)_60%,transparent_80%)] animate-[shimmer_3s_infinite_linear]" />

          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

          {/* Header */}
          <div className="relative z-10 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">{rank.emoji}</span>
              <h2 className="text-4xl font-black text-white tracking-tight">MangaLdle</h2>
              <span className="text-2xl">{rank.emoji}</span>
            </div>
            <div className="text-sm font-bold text-gray-300 uppercase tracking-[0.2em]">Daily Challenge #{dayNumber}</div>
          </div>

          {/* Rank Badge */}
          <div className="relative z-10 mb-6">
            <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-black/40 border-2 border-white/20 backdrop-blur-md shadow-xl`}>
              <Trophy className={`w-6 h-6 ${rank.color}`} />
              <span className={`text-3xl font-black tracking-wider ${rank.color}`}>{rank.label}</span>
              <Trophy className={`w-6 h-6 ${rank.color}`} />
            </div>
          </div>

          {/* FOMO Message */}
          <div className="relative z-10 mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-base text-gray-200 italic leading-relaxed">
              "{rank.message}"
            </p>
          </div>

          {/* Mode & Challenge */}
          <div className="relative z-10 mb-8 space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Mode: <span className="font-bold text-white uppercase">{gameMode}</span></span>
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-xs text-gray-400 px-4">
              {getFOMOText()}
            </p>
          </div>

          {/* Footer with QR */}
          <div className="relative z-10 mt-auto pt-6 border-t border-white/10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/40 animate-pulse">
                🎌
              </div>
              <div className="text-left">
                <div className="text-lg font-black text-white">MangaVerse</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">The Ultimate Anime Puzzle</div>
              </div>
            </div>

            {/* QR Code */}
            <div className="mx-auto w-28 h-28 bg-white rounded-xl p-2 shadow-2xl shadow-black/50">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://mangaverse.com/game&color=0a0a0f&bgcolor=ffffff`}
                alt="Scan to Play"
                className="w-full h-full rounded-lg"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-3 uppercase tracking-[0.2em] font-bold">Scan to Challenge</p>
            <p className="text-[9px] text-gray-500 mt-1">mangaverse.com/game</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleShare}
            disabled={isCapturing}
            className="flex-1 py-4 bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 hover:from-pink-500 hover:via-purple-500 hover:to-cyan-500 text-white font-black rounded-xl transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 disabled:opacity-50 text-lg"
          >
            {isCapturing ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Share2 className="w-6 h-6" />
                SHARE RESULT
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition border border-gray-700"
          >
            Close
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-150%) skewX(-15deg); }
          100% { transform: translateX(150%) skewX(-15deg); }
        }
      `}</style>
    </div>
  );
}