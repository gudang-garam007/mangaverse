"use client";
import { useState } from "react";

// Helper function to clean markdown artifacts
const cleanMarkdown = (text: string) => {
  return text
    .replace(/\*\*/g, "")           // Remove **bold**
    .replace(/\*/g, "")             // Remove *italic*
    .replace(/##/g, "")             // Remove headers
    .replace(/###/g, "")
    .replace(/`/g, "")              // Remove code blocks
    .replace(/\|/g, "")             // Remove table pipes
    .replace(/---/g, "")            // Remove horizontal lines
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links, keep text
    .replace(/\n{3,}/g, "\n\n")     // Remove extra newlines
    .trim();
};

export default function TheoryPage() {
  const [manga, setManga] = useState("");
  const [topic, setTopic] = useState("");
  const [theoryData, setTheoryData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userVote, setUserVote] = useState<"agree" | "clown" | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUserVote(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/theory/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manga_title: manga, topic }),
      });
      const data = await res.json();
      if (res.ok) {
        setTheoryData({
          id: data.theory_id,
          text: data.theory,
          canonAccuracy: data.canon_accuracy,
          bounty: data.bounty,
          votes: { agree: data.votes_agree || 0, clown: data.votes_clown || 0 }
        });
      } else {
        setTheoryData({ text: data.detail || "Error generating theory" });
      }
    } catch (err) {
      setTheoryData({ text: "Network error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (type: "agree" | "clown") => {
    if (userVote || !theoryData?.id) return;

    // Optimistic UI update
    setTheoryData((prev: any) => ({
      ...prev,
      votes: { ...prev.votes, [type]: prev.votes[type] + 1 }
    }));
    setUserVote(type);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/theory/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theory_id: theoryData.id, vote_type: type }),
      });
    } catch (err) {
      console.error("Vote failed", err);
    }
  };

  const handleShare = () => {
    const cleanText = cleanMarkdown(theoryData.text).substring(0, 250) + "...";
    const shareMessage = `🔮 Manga Theory: ${topic}\n\n${cleanText}\n\nRead full theory & vote here:`;

    if (navigator.share) {
      navigator.share({
        title: `Manga Theory: ${manga}`,
        text: shareMessage,
        url: window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${shareMessage}\n${window.location.href}`);
      alert("🔗 Theory link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-amber-950/10 to-gray-950 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black text-center mb-8 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
          🔮 Void Century Theories
        </h1>

        <form onSubmit={handleGenerate} className="space-y-4 mb-8">
          <input
            type="text"
            placeholder="Manga title (e.g., One Piece)"
            value={manga}
            onChange={(e) => setManga(e.target.value)}
            className="w-full bg-gray-900/80 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
            required
          />
          <input
            type="text"
            placeholder="Theory topic (e.g., Who is Joy Boy?)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-gray-900/80 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black py-4 rounded-xl transition disabled:opacity-50 shadow-lg shadow-orange-900/30"
          >
            {loading ? "🔮 Decoding Poneglyph..." : "Generate Theory"}
          </button>
        </form>

        {theoryData && theoryData.text && (
          <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Wanted Poster Stamp */}
            <div className="absolute -top-4 -right-4 rotate-12 z-10 hidden md:block">
              <div className="bg-red-600 text-white px-4 py-2 rounded-lg border-4 border-red-800 shadow-xl transform -rotate-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-center">Wanted</div>
                <div className="text-xl font-black text-center">₿ {theoryData.bounty?.toLocaleString() || '???'}</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-950 border-2 border-amber-600/30 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-2xl font-bold text-amber-400 mb-4 flex items-center gap-2">
                📜 Decoded Theory
              </h2>

              {/* Canon Accuracy Meter */}
              {theoryData.canonAccuracy && (
                <div className="mb-6 bg-black/40 rounded-xl p-4 border border-gray-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-gray-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                      Canon Consistency Score
                    </span>
                    <span className="text-xl font-black text-cyan-400">{theoryData.canonAccuracy}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        theoryData.canonAccuracy >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                        theoryData.canonAccuracy >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                        'bg-gradient-to-r from-red-500 to-pink-400'
                      }`}
                      style={{ width: `${theoryData.canonAccuracy}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-right">
                    Poneglyph Match: <span className="text-amber-400 font-bold">High Probability</span>
                  </p>
                </div>
              )}

              {/* ✅ NEW: Share Button */}
              <button
                onClick={handleShare}
                className="w-full mb-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share Theory
              </button>

              {/* ✅ UPDATED: Clean Theory Text */}
              <div className="bg-black/20 rounded-xl p-5 mb-6 border-l-4 border-amber-500">
                <p className="text-gray-200 leading-relaxed whitespace-pre-wrap text-lg">
                  {cleanMarkdown(theoryData.text)}
                </p>
              </div>

              {/* Voting Section */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleVote("agree")}
                  disabled={!!userVote}
                  className={`py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 border-2 ${
                    userVote === "agree"
                      ? "bg-green-600/20 border-green-500 text-green-400"
                      : "bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-green-900/30 hover:border-green-500/50"
                  }`}
                >
                  <span className="text-2xl">🔥</span>
                  <div className="text-left">
                    <div className="text-xs uppercase tracking-wider">Agree</div>
                    <div className="text-xl font-black">{theoryData.votes?.agree.toLocaleString() || 0}</div>
                  </div>
                </button>

                <button
                  onClick={() => handleVote("clown")}
                  disabled={!!userVote}
                  className={`py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 border-2 ${
                    userVote === "clown"
                      ? "bg-red-600/20 border-red-500 text-red-400"
                      : "bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-red-900/30 hover:border-red-500/50"
                  }`}
                >
                  <span className="text-2xl">🤡</span>
                  <div className="text-left">
                    <div className="text-xs uppercase tracking-wider">Clown Theory</div>
                    <div className="text-xl font-black">{theoryData.votes?.clown.toLocaleString() || 0}</div>
                  </div>
                </button>
              </div>

              {userVote && (
                <div className="mt-4 text-center text-sm text-amber-400/80 animate-pulse">
                  Your vote has been recorded in the Void Century archives.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}