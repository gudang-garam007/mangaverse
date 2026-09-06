"use client";

import { useState, useRef, useEffect } from "react";
import Script from "next/script";
import { Sparkles, Share2, Flame, X, AlertCircle } from "lucide-react";

interface Choice {
  id: number;
  text: string;
  outcome_preview: string;
}

interface WhatIfScenario {
  scenario_title: string;
  scene_description: string;
  story_text: string;
  character_emotions: Record<string, string>;
  visual_style: string;
  choices: Choice[];
  meme_text: string;
  tags: string[];
}

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/whatif`;

export default function WhatIfPage() {
  const [scenario, setScenario] = useState<WhatIfScenario | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("Consulting the multiverse...");
  const [userPrompt, setUserPrompt] = useState("");
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [storyHistory, setStoryHistory] = useState<WhatIfScenario[]>([]);
  const [showShareCard, setShowShareCard] = useState(false);
  const [currentStoryId, setCurrentStoryId] = useState("");

  const characterInput = useRef<HTMLInputElement>(null);

  const popularCharacters = [
    "Naruto", "Goku", "Luffy", "Light Yagami", "Levi",
    "Gojo", "Tanjiro", "Eren", "Saitama", "Vegeta"
  ];

  // ✅ Rotating Loading Messages
  useEffect(() => {
    if (loading) {
      const messages = [
        "Consulting the multiverse...",
        "Gathering chakra and ki...",
        "Asking the anime gods for permission...",
        "Calculating power levels...",
        "Drawing the manga panels...",
        "Brewing some intense plot twists..."
      ];
      let index = 0;
      setLoadingMessage(messages[0]);
      const interval = setInterval(() => {
        index = (index + 1) % messages.length;
        setLoadingMessage(messages[index]);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const generateScenario = async (choiceId?: number) => {
    setLoading(true);
    setError(""); // Clear previous errors
    try {
      const payload = {
        scenario: userPrompt,
        characters: selectedCharacters.length > 0 ? selectedCharacters : ["Naruto", "Goku"],
        previous_scenario: choiceId !== undefined ? scenario : null,
        choice_id: choiceId
      };

      const res = await fetch(`${API_BASE}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.scenario) {
        if (choiceId !== undefined && scenario) {
          setStoryHistory([...storyHistory, scenario]);
        }
        setScenario(data.scenario);
        setCurrentStoryId(data.story_id);
      } else {
        setError(data.detail || data.error || "Failed to generate scenario. The server might be waking up, please try again.");
      }
    } catch (err: any) {
      setError(`Connection Error: ${err.message || "Something went wrong"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = (choiceId: number) => {
    generateScenario(choiceId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetScenario = () => {
    setScenario(null);
    setStoryHistory([]);
    setUserPrompt("");
    setSelectedCharacters([]);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950 text-gray-100 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 pt-4">
          <div className="inline-block">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent tracking-tight mb-2">
              What-If Engine
            </h1>
            <p className="text-sm text-gray-400">
              Create Interactive Anime Stories & Viral Meme Cards
            </p>
          </div>
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

        {/* Initial Input Form */}
        {!scenario && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Character Selection */}
            <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Choose Your Characters
              </h2>

              <div className="flex flex-wrap gap-2 mb-4">
                {popularCharacters.map((char) => (
                  <button
                    key={char}
                    onClick={() => {
                      setSelectedCharacters(prev =>
                        prev.includes(char)
                          ? prev.filter(c => c !== char)
                          : [...prev, char]
                      );
                    }}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedCharacters.includes(char)
                        ? "bg-purple-600 border-purple-500 text-white"
                        : "bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-500/50"
                    }`}
                  >
                    {char}
                  </button>
                ))}
              </div>

              <input
                ref={characterInput}
                type="text"
                placeholder="Or type custom characters (comma separated)"
                disabled={loading}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedCharacters(e.target.value.split(",").map(c => c.trim()));
                  }
                }}
              />
            </div>

            {/* Scenario Input */}
            <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 relative">

              {/* ✅ LOADING OVERLAY (Blocks clicks & shows fun messages) */}
              {loading && (
                <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center z-20 animate-in fade-in">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-purple-400 font-bold animate-pulse text-lg text-center px-4">
                    {loadingMessage}
                  </p>
                  <p className="text-xs text-gray-500 mt-3 text-center max-w-xs">
                    (AI is forging the story. This may take a few seconds if the server is waking up...)
                  </p>
                </div>
              )}

              <h2 className="text-xl font-bold text-white mb-4">Your What-If Scenario</h2>
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="e.g., 'Naruto and Goku open a street food stall in Delhi' or 'Light Yagami becomes a teacher'"
                disabled={loading}
                className="w-full h-32 bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none disabled:opacity-50 transition"
              />

              {/* ✅ ERROR MESSAGE DISPLAY */}
              {error && (
                <div className="mt-4 p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm flex items-start gap-2 animate-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={() => generateScenario()}
                disabled={loading || !userPrompt}
                className="mt-4 w-full py-4 bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 hover:from-pink-500 hover:via-purple-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Create What-If Story
                  </>
                )}
              </button>
            </div>

            {/* Trending Scenarios */}
            <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Trending Now
              </h3>
              <div className="space-y-2">
                <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-purple-500/50 cursor-pointer transition">
                  <p className="text-sm text-gray-300">"Naruto runs a Delhi Chai Shop"</p>
                  <p className="text-xs text-gray-500 mt-1">🔥 1.2k votes</p>
                </div>
                <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-purple-500/50 cursor-pointer transition">
                  <p className="text-sm text-gray-300">"Goku vs Street Food Vendor"</p>
                  <p className="text-xs text-gray-500 mt-1">🔥 892 votes</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Story Display */}
        {scenario && (
          <div className="space-y-6 animate-in fade-in duration-500 relative">

            {/* ✅ LOADING OVERLAY FOR CHOICES */}
            {loading && (
              <div className="absolute inset-0 z-30 bg-gray-950/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center animate-in fade-in border border-purple-500/30">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-purple-400 font-bold animate-pulse text-lg text-center px-4">
                  {loadingMessage}
                </p>
                <p className="text-xs text-gray-500 mt-3 text-center max-w-xs">
                  (AI is continuing the story...)
                </p>
              </div>
            )}

            {/* Story Card */}
            <div className={`bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm rounded-2xl border border-purple-500/30 overflow-hidden transition-opacity ${loading ? 'opacity-40' : 'opacity-100'}`}>
              {/* Title */}
              <div className="bg-black/30 p-4 border-b border-white/10">
                <h2 className="text-2xl font-black text-white text-center">
                  {scenario.scenario_title}
                </h2>
              </div>

              {/* Visual Panel */}
              <div className="p-6">
                <div className="aspect-video bg-gray-900 rounded-xl mb-4 overflow-hidden border-2 border-purple-500/30 relative">
                  <WhatIfImage scenario={scenario} storyId={currentStoryId} />

                  {/* Character Emotions Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 flex gap-2 flex-wrap">
                    {Object.entries(scenario.character_emotions).map(([char, emotion]) => (
                      <div key={char} className="px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full border border-white/20">
                        <span className="text-xs font-bold text-white">{char}</span>
                        <span className="text-xs text-gray-300 ml-1">({emotion})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Story Text */}
                <div className="prose prose-invert max-w-none mb-6">
                  <p className="text-lg text-gray-200 leading-relaxed">
                    {scenario.story_text}
                  </p>
                </div>

                {/* Meme Text for Social Share */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-6">
                  <p className="text-sm text-gray-300 italic text-center">
                    "{scenario.meme_text}"
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={() => setShowShareCard(true)}
                    disabled={loading}
                    className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-5 h-5" />
                    Share Meme Card
                  </button>
                  <button
                    onClick={resetScenario}
                    disabled={loading}
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-bold rounded-xl transition border border-gray-700"
                  >
                    New Story
                  </button>
                </div>

                {/* Choices - The Interactive Hook */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-white text-center mb-4">
                    What happens next? Choose wisely!
                  </h3>
                  {scenario.choices.map((choice, idx) => (
                    <button
                      key={choice.id}
                      onClick={() => handleChoice(choice.id)}
                      disabled={loading}
                      className="w-full p-4 bg-gray-900/80 hover:bg-purple-900/40 border-2 border-gray-700 hover:border-purple-500/50 rounded-xl text-left transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-semibold group-hover:text-purple-300 transition">
                            {choice.text}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            {choice.outcome_preview}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Story History (Previous Scenes) */}
            {storyHistory.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Previous Scenes</h3>
                {storyHistory.map((scene, idx) => (
                  <div key={idx} className="p-4 bg-gray-900/40 rounded-xl border border-gray-800 opacity-60">
                    <p className="text-sm text-gray-400">{scene.story_text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ✅ ADSTERRA 320x50 MOBILE BANNER (BOTTOM OF PAGE) */}
        <div className="w-full flex justify-center my-8">
          <Script id="adsterra-mobile-config-whatif" strategy="afterInteractive">
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

      </div>

      {/* Share Card Modal */}
      {showShareCard && scenario && (
        <WhatIfShareCard
          scenario={scenario}
          storyId={currentStoryId}
          userPrompt={userPrompt}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </main>
  );
}

// ==========================================
// SHARE CARD COMPONENT
// ==========================================
function WhatIfShareCard({
  scenario,
  storyId,
  userPrompt,
  onClose
}: {
  scenario: WhatIfScenario;
  storyId: string;
  userPrompt: string;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleShare = async () => {
    if (!cardRef.current) return;
    setIsCapturing(true);

    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        backgroundColor: "#0a0a0f",
      });

      const file = new File(
        [await (await fetch(dataUrl)).blob()],
        `whatif-${storyId}.png`,
        { type: "image/png" }
      );

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: scenario.scenario_title,
          text: scenario.meme_text,
          files: [file],
        });
      } else {
        const link = document.createElement("a");
        link.download = `whatif-${storyId}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("Share error:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md">
        {/* THE CARD */}
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/60 via-gray-900 to-pink-900/60 border border-white/10 shadow-2xl p-6"
          style={{ width: "400px", minHeight: "550px" }}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-black/80 hover:bg-red-600 rounded-full border border-white/20 text-white transition-all shadow-lg z-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Holographic Shine */}
          <div className="absolute inset-0 opacity-30 pointer-events-none bg-[linear-gradient(115deg,transparent_20%,rgba(255,255,255,0.4)_40%,rgba(255,255,255,0.6)_50%,rgba(255,255,255,0.4)_60%,transparent_80%)] animate-[shimmer_3s_infinite_linear]" />

          {/* User Prompt Section */}
          <div className="relative z-10 mb-4 p-3 bg-black/40 rounded-xl border border-purple-500/30 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] text-purple-300 uppercase tracking-wider font-bold">The Prompt</span>
            </div>
            <p className="text-sm text-white font-medium italic leading-snug">
              "{userPrompt}"
            </p>
          </div>

          {/* Header */}
          <div className="relative z-10 text-center mb-4">
            <h2 className="text-2xl font-black text-white mb-1">{scenario.scenario_title}</h2>
            <p className="text-xs text-gray-400 uppercase tracking-wider">What-If Scenario #{storyId}</p>
          </div>

          {/* Meme Text */}
          <div className="relative z-10 p-4 bg-white/5 rounded-xl border border-white/10 mb-4">
            <p className="text-base text-white italic text-center">"{scenario.meme_text}"</p>
          </div>

          {/* Story Preview */}
          <div className="relative z-10 mb-4 px-2">
            <p className="text-sm text-gray-300 text-center line-clamp-4">{scenario.story_text}</p>
          </div>

          {/* Tags */}
          <div className="relative z-10 flex flex-wrap gap-2 justify-center mb-6">
            {scenario.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-purple-500/20 rounded-full border border-purple-500/30 text-xs text-purple-300">
                #{tag}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="relative z-10 pt-4 border-t border-white/10 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-2xl">🎌</span>
              <span className="text-lg font-bold text-white">MangaVerse</span>
            </div>
            <div className="w-24 h-24 mx-auto bg-white rounded-lg p-1 shadow-lg">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://manga-ta.vercel.app/whatif&color=0a0a0f`}
                alt="QR"
                className="w-full h-full rounded"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wider font-bold">Scan to Create Your Own</p>
          </div>
        </div>

        {/* Share Button (Outside capture area) */}
        <button
          onClick={handleShare}
          disabled={isCapturing}
          className="mt-6 w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl transition shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
        >
          {isCapturing ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Share2 className="w-5 h-5" />
              Download & Share Card
            </>
          )}
        </button>
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

// ==========================================
// IMAGE COMPONENT WITH FALLBACK
// ==========================================
function WhatIfImage({ scenario, storyId }: { scenario: WhatIfScenario; storyId: string }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const buildPrompt = () => {
    const chars = Object.keys(scenario.character_emotions || {}).join(", ");
    const style = (scenario.visual_style || "anime manga style").replace(/[^a-zA-Z0-9\s,]/g, "");
    const scene = (scenario.scene_description || "").replace(/[^a-zA-Z0-9\s,]/g, "");
    return `${chars} ${scene} ${style}, high quality anime art, detailed, vibrant colors`;
  };

  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(buildPrompt())}?width=800&height=450&nologo=true&seed=${storyId}&model=flux`;

  if (imageError || !imageLoaded) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-900 via-pink-900 to-cyan-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.2),transparent_50%)]" />
        </div>

        <div className="relative z-10 text-center">
          <div className="text-6xl mb-4">🎭</div>
          <h3 className="text-2xl font-black text-white mb-2">{scenario.scenario_title}</h3>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {Object.entries(scenario.character_emotions || {}).map(([char, emotion]) => (
              <div key={char} className="px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full border border-white/20">
                <span className="text-sm font-bold text-white">{char}</span>
                <span className="text-xs text-gray-300 ml-2">({emotion})</span>
              </div>
            ))}
          </div>
        </div>

        {!imageError && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full border border-white/20">
              <span className="text-xs text-gray-300">Generating image...</span>
            </div>
          </div>
        )}

        {!imageError && (
          <img
            src={imageUrl}
            alt=""
            className="hidden"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={scenario.scenario_title}
      className="w-full h-full object-cover"
      onError={() => setImageError(true)}
    />
  );
}