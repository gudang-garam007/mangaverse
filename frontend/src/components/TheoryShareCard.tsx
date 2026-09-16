import { forwardRef } from "react";

interface TheoryShareCardProps {
  manga: string;
  topic: string;
  summary: string;
  bounty: number;
  canonAccuracy: number;
  votes: { agree: number; clown: number };
}

export const TheoryShareCard = forwardRef<HTMLDivElement, TheoryShareCardProps>(
  ({ manga, topic, summary, bounty, canonAccuracy, votes }, ref) => {
    return (
      <div
        ref={ref}
        className="relative w-[600px] bg-gradient-to-br from-gray-950 via-amber-950/20 to-gray-950 p-8 overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, transparent 50%),
            linear-gradient(225deg, rgba(239, 68, 68, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(245, 158, 11, 0.15) 0%, transparent 40%),
            radial-gradient(circle at 80% 20%, rgba(239, 68, 68, 0.15) 0%, transparent 40%)
          `
        }}
      >
        {/* Decorative Border */}
        <div className="absolute inset-4 border-2 border-amber-500/30 rounded-2xl pointer-events-none" />
        <div className="absolute inset-6 border border-amber-500/20 rounded-xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🔮</div>
              <div>
                <div className="text-xs text-amber-400 font-bold uppercase tracking-widest">
                  Void Century Theory
                </div>
                <div className="text-2xl font-black text-white">{manga}</div>
              </div>
            </div>

            {/* WANTED Stamp */}
            <div className="bg-red-600 text-white px-4 py-2 rounded-lg border-4 border-red-800 shadow-xl transform rotate-6">
              <div className="text-[10px] font-black uppercase tracking-widest text-center">
                Wanted
              </div>
              <div className="text-xl font-black text-center">
                ₿ {bounty.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Topic */}
          <div className="bg-black/40 rounded-xl p-4 border border-amber-500/30 mb-4">
            <div className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">
              Theory Topic
            </div>
            <div className="text-xl font-bold text-white">{topic}</div>
          </div>
        </div>

        {/* Summary */}
        <div className="relative z-10 mb-6">
          <div className="bg-black/30 rounded-xl p-5 border-l-4 border-amber-500">
            <div className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-2">
              📜 Theory Summary
            </div>
            <p className="text-gray-200 leading-relaxed text-base">{summary}</p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="relative z-10 grid grid-cols-2 gap-4 mb-6">
          {/* Canon Accuracy */}
          <div className="bg-black/40 rounded-xl p-4 border border-cyan-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-bold uppercase">
                Canon Score
              </span>
              <span className="text-2xl font-black text-cyan-400">
                {canonAccuracy}%
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                style={{ width: `${canonAccuracy}%` }}
              />
            </div>
          </div>

          {/* Votes */}
          <div className="bg-black/40 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-bold uppercase">
                Community Vote
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-xl">🔥</span>
                <span className="text-lg font-black text-green-400">
                  {votes.agree}
                </span>
              </div>
              <div className="text-gray-600">vs</div>
              <div className="flex items-center gap-1">
                <span className="text-xl">🤡</span>
                <span className="text-lg font-black text-red-400">
                  {votes.clown}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-amber-500/30">
          <div className="flex items-center gap-2">
            <div className="text-2xl">🎌</div>
            <div>
              <div className="text-sm font-bold text-white">MangaVerse</div>
              <div className="text-xs text-gray-400">manga-ta.vercel.app</div>
            </div>
          </div>
          <div className="text-xs text-gray-500 text-right">
            <div>Generate your own theory!</div>
            <div className="text-amber-400 font-bold">Scan QR or visit site</div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 text-6xl opacity-10 pointer-events-none">
          ⚔️
        </div>
        <div className="absolute bottom-10 left-10 text-6xl opacity-10 pointer-events-none">
          🗡️
        </div>
      </div>
    );
  }
);

TheoryShareCard.displayName = "TheoryShareCard";