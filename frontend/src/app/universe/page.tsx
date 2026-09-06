"use client";
import { useState, useEffect } from "react";

export default function UniversePage() {
  const [universes, setUniverses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUniverses = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/universe/list`);
        const data = await res.json();
        setUniverses(data.universes || []);
      } catch (err) {
        console.error("Error fetching universes");
      } finally {
        setLoading(false);
      }
    };
    fetchUniverses();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
          🌌 Manga Universe Explorer
        </h1>
        {loading ? (
          <p className="text-center text-gray-400">Loading universes...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {universes.map((u, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-cyan-500 transition">
                <h3 className="text-xl font-bold text-cyan-400 mb-2">{u.title}</h3>
                <p className="text-sm text-gray-400">Characters: {u.char_count}</p>
                {u.genres && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {u.genres.slice(0, 3).map((g: string, j: number) => (
                      <span key={j} className="text-xs bg-gray-800 px-2 py-1 rounded">{g}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}