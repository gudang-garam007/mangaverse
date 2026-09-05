"use client";
import { useState } from "react";

export default function DNAPage() {
  const [manga, setManga] = useState("");
  const [dna, setDna] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/dna/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manga_title: manga }),
      });
      const data = await res.json();
      setDna(data.dna_analysis || data.detail);
    } catch (err) {
      setDna("Error analyzing DNA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600">
          🧬 Manga DNA Analysis
        </h1>
        <form onSubmit={handleAnalyze} className="space-y-4">
          <input
            type="text"
            placeholder="Manga title (e.g., One Piece, Naruto)"
            value={manga}
            onChange={(e) => setManga(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "🧬 Analyzing DNA..." : "Analyze Manga DNA"}
          </button>
        </form>
        {dna && (
          <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-yellow-400">DNA Breakdown:</h2>
            <p className="text-gray-300 whitespace-pre-wrap">{dna}</p>
          </div>
        )}
      </div>
    </div>
  );
}