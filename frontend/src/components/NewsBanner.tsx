"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewsBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  const news = [
    {
      title: "🔥 LIVE: New Manga Chapters Released Today! Click here to read full news.",
      source: "MangaUpdates",
      date: new Date().toISOString(),
      category: "release"
    }
  ];

  if (!isVisible) return null;

  return (
    // ✅ CHANGE: top-16 (Navbar ke barabar) aur z-[90] (Navbar se neeche)
    <div className="fixed top-16 left-0 right-0 z-[90] bg-gradient-to-r from-purple-900 via-pink-900 to-purple-900 text-white shadow-lg border-b border-pink-500/30">
      <div className="absolute left-0 top-0 bottom-0 flex items-center px-4 bg-red-600 animate-pulse z-[101]">
        <span className="font-bold text-xs uppercase tracking-wider">LIVE</span>
      </div>

      <div 
        className="ml-20 px-4 py-3 cursor-pointer hover:bg-white/10 transition flex items-center justify-between"
        onClick={() => router.push("/news")}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-pink-300 uppercase">
              {news[0].source}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-400">Just Now</span>
          </div>
          <h3 className="font-semibold text-sm sm:text-base truncate">
            {news[0].title}
          </h3>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
          className="text-gray-400 hover:text-white text-lg px-3"
        >
          ✕
        </button>
      </div>
    </div>
  );
}