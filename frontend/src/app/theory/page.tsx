"use client";
import { useState, useRef } from "react";
import { toPng } from "html-to-image";
import { TheoryShareCard } from "@/components/TheoryShareCard";
import { TheoryBetting } from "@/components/TheoryBetting"; // ✅ NEW
import { DailyReward } from "@/components/DailyReward";

// Helper function to clean markdown
const cleanMarkdown = (text: string) => {
  return text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/##/g, "")
    .replace(/###/g, "")
    .replace(/`/g, "")
    .replace(/\|/g, "")
    .replace(/---/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

// Generate summary from theory text
// Generate summary from theory text
const generateSummary = (text: string) => {
  const cleanText = cleanMarkdown(text);

  // Remove extra whitespace and normalize
  const normalizedText = cleanText.replace(/\s+/g, ' ').trim();

  // Split into sentences properly
  const sentences = normalizedText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 30);

  // Take first 2-3 complete sentences for a good summary
  let summary = '';

  if (sentences.length >= 2) {
    // Try to take 2-3 sentences but keep under 400 chars
    summary = sentences.slice(0, 3).join(' ');

    // If still too long, truncate at word boundary
    if (summary.length > 400) {
      summary = summary.substring(0, 400);
      // Cut at last space to avoid breaking word
      const lastSpace = summary.lastIndexOf(' ');
      summary = summary.substring(0, lastSpace) + '...';
    }
  } else {
    // Fallback: just take first 400 chars
    summary = normalizedText.substring(0, 400);
    if (normalizedText.length > 400) {
      const lastSpace = summary.lastIndexOf(' ');
      summary = summary.substring(0, lastSpace) + '...';
    }
  }

  return summary.trim();
};

export default function TheoryPage() {
  const [manga, setManga] = useState("");
  const [topic, setTopic] = useState("");
  const [theoryData, setTheoryData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userVote, setUserVote] = useState<"agree" | "clown" | null>(null);
  const [showShareCard, setShowShareCard] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const [userBerries, setUserBerries] = useState(1000); // ✅ NEW
  const cardRef = useRef<HTMLDivElement>(null);

  // ✅ NEW: Fetch user balance on mount
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bet/user/balance`, {
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          setUserBerries(data.berries);
        }
      } catch (err) {
        console.error("Failed to fetch balance", err);
      }
    };
    fetchBalance();
  }, []);
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUserVote(null);
    setShowShareCard(false);

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

  const handleShareClick = () => {
    setShowShareCard(true);
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;

    setIsGeneratingImage(true);

    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `manga-theory-${manga}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate image", err);
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleDirectShare = async () => {
    if (!cardRef.current) return;

    setIsGeneratingImage(true);

    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        cacheBust: true,
      });

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `manga-theory-${manga}.png`, { type: "image/png" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Manga Theory: ${manga}`,
          text: `Check out this ${topic} theory! 🔮`,
          files: [file],
        });
      } else {
        // Fallback: Download image
        const link = document.createElement("a");
        link.download = `manga-theory-${manga}-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        alert("Image downloaded! Share it manually.");
      }
    } catch (err) {
      console.error("Share failed", err);
      alert("Share failed. Try downloading the image instead.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-amber-950/10 to-gray-950 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black text-center mb-8 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
         <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <h1 className="text-4xl md:text-5xl font-black text-center bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">

          🔮 Void Century Theories
        </h1>
        <DailyReward onBerriesChange={setUserBerries} />
        </div>

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
                <div className="text-[10px] font-black uppercase tracking-widest text-center">
                  Wanted
                </div>
                <div className="text-xl font-black text-center">
                  ₿ {theoryData.bounty?.toLocaleString() || "???"}
                </div>
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
                    <span className="text-xl font-black text-cyan-400">
                      {theoryData.canonAccuracy}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        theoryData.canonAccuracy >= 80
                          ? "bg-gradient-to-r from-green-500 to-emerald-400"
                          : theoryData.canonAccuracy >= 60
                          ? "bg-gradient-to-r from-yellow-500 to-orange-400"
                          : "bg-gradient-to-r from-red-500 to-pink-400"
                      }`}
                      style={{ width: `${theoryData.canonAccuracy}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-right">
                    Poneglyph Match:{" "}
                    <span className="text-amber-400 font-bold">
                      High Probability
                    </span>
                  </p>
                </div>
              )}

              {/* ✅ NEW: Share Button */}
              <button
                onClick={handleShareClick}
                className="w-full mb-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Create Shareable Card
              </button>

              {/* ✅ NEW: Share Card Preview */}
              {showShareCard && theoryData && (
                <div className="mb-6 space-y-4">
                  <div className="bg-black/40 rounded-xl p-4 border border-blue-500/30">
                    <div className="text-sm text-blue-400 font-bold mb-3">
                      📸 Preview Your Share Card:
                    </div>

                    {/* Scrollable container for card */}
                    <div className="overflow-x-auto pb-4">
                      <div className="inline-block min-w-[600px]">
                        <TheoryShareCard
                          ref={cardRef}
                          manga={manga}
                          topic={topic}
                          summary={generateSummary(theoryData.text)}
                          bounty={theoryData.bounty}
                          canonAccuracy={theoryData.canonAccuracy}
                          votes={theoryData.votes}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <button
                        onClick={handleDownloadImage}
                        disabled={isGeneratingImage}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isGeneratingImage ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Image
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleDirectShare}
                        disabled={isGeneratingImage}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isGeneratingImage ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Share Now
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Theory Text */}
              <div className="bg-black/20 rounded-xl p-5 mb-6 border-l-4 border-amber-500">
                <p className="text-gray-200 leading-relaxed whitespace-pre-wrap text-lg">
                  {cleanMarkdown(theoryData.text)}
                </p>
              </div>

                            {/* ✅ NEW: Betting Section */}
              {theoryData.id && (
                <TheoryBetting
                  theoryId={theoryData.id}
                  userBerries={userBerries}
                  onBerriesChange={setUserBerries}
                />
              )}

              {/* Voting Section */}
              <div className="grid grid-cols-2 gap-4 mt-6">

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
                    <div className="text-xl font-black">
                      {theoryData.votes?.agree.toLocaleString() || 0}
                    </div>
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
                    <div className="text-xs uppercase tracking-wider">
                      Clown Theory
                    </div>
                    <div className="text-xl font-black">
                      {theoryData.votes?.clown.toLocaleString() || 0}
                    </div>
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