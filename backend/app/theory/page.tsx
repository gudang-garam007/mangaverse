"use client";
import { useState } from "react";

export default function TheoryPage() {
  const [manga, setManga] = useState("");
  const [topic, setTopic] = useState("");
  const [theory, setTheory] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/theory/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manga_title: manga, topic }),
      });
      const data = await res.json();
      setTheory(data.theory || data.detail);
    } catch (err) {
      setTheory("Error generating theory");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-600">
          💡 Fan Theory Generator
        </h1>
        <form onSubmit={handleGenerate} className="space-y-4">
          <input
            type="text"
            placeholder="Manga title (e.g., One Piece)"
            value={manga}
            onChange={(e) => setManga(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
          <input
            type="text"
            placeholder="Theory topic (e.g., Who is Joy Boy?)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "💡 Generating..." : "Generate Theory"}
          </button>
        </form>
        {theory && (
          <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-pink-400">Theory:</h2>
            <p className="text-gray-300 whitespace-pre-wrap">{theory}</p>
          </div>
        )}
      </div>
    </div>
  );
}