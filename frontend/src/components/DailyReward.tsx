"use client";
import { useState, useEffect } from "react";

interface DailyRewardProps {
  onBerriesChange: (newBalance: number) => void;
}

export function DailyReward({ onBerriesChange }: DailyRewardProps) {
  const [claimed, setClaimed] = useState(false);
  const [reward, setReward] = useState<any>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    checkDailyReward();
  }, []);

  const checkDailyReward = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://mangaverse-backend.onrender.com";
      const res = await fetch(`${API_URL}/api/bet/daily-reward`, {
        headers: { "Authorization": "Bearer mock-token" }
      });
      if (res.ok) {
        const data = await res.json();
        setReward(data);
        setClaimed(data.already_claimed);
      }
    } catch (err) {
      console.error("Failed to check daily reward", err);
    }
  };

  const claimReward = async () => {
    if (claimed) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://mangaverse-backend.onrender.com";
      const res = await fetch(`${API_URL}/api/bet/daily-reward`, {
        headers: { "Authorization": "Bearer mock-token" }
      });

      if (!res.ok) {
        const errorText = await res.text();
        alert(`Failed to claim: ${res.status} - ${errorText}`);
        return;
      }

      const data = await res.json();
      setReward(data);
      setClaimed(true);
      onBerriesChange(data.new_balance);
      setShowAnimation(true);
      setTimeout(() => setShowAnimation(false), 3000);
    } catch (err: any) {
      console.error("Failed to claim reward", err);
      alert(`Network error: ${err.message}`);
    }
  };

  return (
    <>
      <button
        onClick={claimReward}
        disabled={claimed}
        className={`relative px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
          claimed ? "bg-gray-800 text-gray-500 cursor-not-allowed" : "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-orange-900/30 animate-pulse"
        }`}
      >
        <span className="text-xl">🎁</span>
        {claimed ? "Claimed Today" : "Claim Daily Reward"}
      </button>

      {showAnimation && reward && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-amber-900/90 to-orange-900/90 border-4 border-amber-500 rounded-3xl p-8 text-center animate-bounce">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-black text-white mb-2">Daily Reward Claimed!</h2>
            <p className="text-xl text-amber-300 mb-4">+₿{reward.berries_added} Berries</p>
            <p className="text-sm text-gray-300">Streak: {reward.streak} days 🔥</p>
          </div>
        </div>
      )}
    </>
  );
}