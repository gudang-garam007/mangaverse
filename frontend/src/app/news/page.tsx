"use client";
import { useState, useEffect } from "react";

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  url: string;
  image?: string;
  source: string;
  date: string;
  category: string;
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/news/latest");
      const data = await res.json();
      if (data.status === "success") {
        setNews(data.news);
      }
    } catch (error) {
      console.error("Failed to fetch news:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ SMART FILTER LOGIC
  const filteredNews = filter === "all"
    ? news
    : filter === "comics"
    ? news.filter(n => n.category === "comic_release")
    : news.filter(n => n.category !== "comic_release"); // "manga" filter

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          📰 Live Manga & Comic News
        </h1>
        <p className="text-center text-gray-400 mb-8">Real-time updates from MyAnimeList, AniList, MangaUpdates, Comic Vine & ShortBoxed</p>

        {/* ✅ UPDATED FILTERS */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === "all" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            🌟 All News
          </button>
          <button
            onClick={() => setFilter("manga")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === "manga" ? "bg-pink-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            📚 Manga Updates
          </button>
          <button
            onClick={() => setFilter("comics")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === "comics" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            💥 Comic Releases
          </button>
        </div>

        {/* ✅ NEWS GRID */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="animate-pulse text-xl">Loading latest news...</div>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No news found for this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((item) => {
              // ✅ DYNAMIC BADGE COLORS
              const isComic = item.category === "comic_release";
              const isRelease = item.category === "release";

              const badgeColor = isComic
                ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                : isRelease
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : "bg-pink-500/20 text-pink-400 border-pink-500/30";

              return (
                <a
                  key={`${item.source}-${item.id}`}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500 transition-all duration-300 group hover:shadow-lg hover:shadow-purple-500/10"
                >
                  {/* Image with Badge */}
                  {item.image ? (
                    <div className="relative overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md border backdrop-blur-sm ${badgeColor}`}>
                          {isComic ? "COMIC" : isRelease ? "NEW CHAPTER" : "MANGA"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 bg-gray-800 flex items-center justify-center">
                      <span className="text-4xl">{isComic ? "💥" : "📚"}</span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                        {item.source}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="font-bold text-lg mb-2 text-gray-100 group-hover:text-purple-400 transition-colors line-clamp-2">
                      {item.title}
                    </h3>

                    <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="mt-4 flex items-center text-xs text-purple-400 font-medium group-hover:translate-x-1 transition-transform">
                      Read full story →
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}