"use client";
import { useState, useEffect } from "react";

export default function FeedPage() {
  const [feed, setFeed] = useState<any>({ trending_universes: [], top_characters: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feed/trending`);
        const data = await res.json();
        setFeed(data);
      } catch (err) {
        console.error("Error fetching feed");
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600">
          🔥 Trending Feed
        </h1>
        {loading ? (
          <p className="text-center text-gray-400">Loading feed...</p>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4 text-red-400">Trending Universes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feed.trending_universes?.map((u: any, i: number) => (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <h3 className="text-xl font-bold text-red-400">{u.title}</h3>
                    <p className="text-sm text-gray-400">Popularity: {u.popularity} characters</p>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4 text-pink-400">Top Characters</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {feed.top_characters?.map((c: any, i: number) => (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-pink-400">{c.name}</h3>
                    <p className="text-xs text-gray-400">{c.universe}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}