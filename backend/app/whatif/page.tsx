"use client";
import { useState } from "react";

export default function WhatIfPage() {
  const [scenario, setScenario] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/whatif/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
      const data = await res.json();
      setAnalysis(data.analysis || data.detail);
    } catch (err) {
      setAnalysis("Error analyzing scenario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          🔮 What-If Analysis
        </h1>
        <form onSubmit={handleAnalyze} className="space-y-4">
          <textarea
            placeholder="Enter your scenario... (e.g., What if Naruto had the Sharingan?)"
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 h-32 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "🔮 Analyzing..." : "Analyze Scenario"}
          </button>
        </form>
        {analysis && (
          <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-purple-400">Analysis:</h2>
            <p className="text-gray-300 whitespace-pre-wrap">{analysis}</p>
          </div>
        )}
      </div>
    </div>
  );
}