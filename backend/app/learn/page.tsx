"use client";
import { useState } from "react";

export default function LearnPage() {
  const [topic, setTopic] = useState("");
  const [lesson, setLesson] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLearn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/learn/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      setLesson(data.lesson || data.detail);
    } catch (err) {
      setLesson("Error generating lesson");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-600">
          📚 Manga Learning Hub
        </h1>
        <form onSubmit={handleLearn} className="space-y-4">
          <input
            type="text"
            placeholder="What do you want to learn? (e.g., How does Haki work?)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "📚 Generating Lesson..." : "Start Learning"}
          </button>
        </form>
        {lesson && (
          <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-indigo-400">Lesson:</h2>
            <div className="text-gray-300 prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: lesson.replace(/\n/g, '<br/>') }} />
          </div>
        )}
      </div>
    </div>
  );
}