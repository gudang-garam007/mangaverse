"use client";
import { useState } from "react";

interface TheoryBettingProps {
  theoryId: string;
  userBerries: number;
  onBerriesChange: (newBalance: number) => void;
}

export function TheoryBetting({ theoryId, userBerries, onBerriesChange }: TheoryBettingProps) {
  const [betAmount, setBetAmount] = useState(50);
  const [loading, setLoading] = useState(false);
  const [hasBet, setHasBet] = useState(false);

  const handleBet = async (type: "canon" | "clown") => {
    if (betAmount > userBerries) {
      alert("Not enough berries!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bet/place`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          theory_id: theoryId,
          bet_type: type,
          amount: betAmount
        })
      });

      const data = await res.json();

      if (res.ok) {
        setHasBet(true);
        onBerriesChange(data.new_balance);
        alert(`✅ Bet placed! ₿${betAmount} on ${type.toUpperCase()}`);
      } else {
        alert(data.detail || "Failed to place bet");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 bg-gradient-to-br from-black/60 to-gray-900/60 rounded-2xl p-5 border-2 border-amber-500/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <span className="text-lg font-bold text-amber-400">Place Your Bet</span>
        </div>
        <div className="bg-black/40 px-3 py-1 rounded-full border border-amber-500/30">
          <span className="text-sm text-gray-400">Balance:</span>
          <span className="text-lg font-black text-amber-400 ml-2">₿{userBerries.toLocaleString()}</span>
        </div>
      </div>

      {/* Bet Amount Input */}
      <div className="mb-4">
        <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">
          Bet Amount
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
            min="10"
            max="1000"
            step="10"
          />
          <div className="flex gap-2">
            {[50, 100, 200].map(amount => (
              <button
                key={amount}
                onClick={() => setBetAmount(amount)}
                className="bg-gray-800 hover:bg-gray-700 text-amber-400 font-bold px-3 py-2 rounded-lg transition text-sm"
              >
                ₿{amount}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bet Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleBet("canon")}
          disabled={loading || hasBet}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-green-900/30"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span className="text-xl">✅</span>
              <span>Bet CANON</span>
            </>
          )}
        </button>

        <button
          onClick={() => handleBet("clown")}
          disabled={loading || hasBet}
          className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-red-900/30"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span className="text-xl">🤡</span>
              <span>Bet CLOWN</span>
            </>
          )}
        </button>
      </div>

      {hasBet && (
        <div className="mt-3 text-center text-sm text-amber-400/80 animate-pulse">
          ✅ Your bet has been placed!
        </div>
      )}
    </div>
  );
}