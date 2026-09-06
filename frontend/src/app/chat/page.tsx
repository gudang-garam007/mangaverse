"use client";
import { useState } from "react";

export default function ChatPage() {
  const [character, setCharacter] = useState("");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setReply("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character_name: character, message }),
      });
      const data = await res.json();
      if (res.ok) {
        setReply(data.reply);
      } else {
        setReply(`Error: ${data.detail || "Unknown error"}`);
      }
    } catch (err: any) {
      setReply(`Connection Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-600">
          💬 Character Chat
        </h1>
        <form onSubmit={handleChat} className="space-y-4">
          <input
            type="text"
            placeholder="Character name (e.g., Luffy, Naruto)"
            value={character}
            onChange={(e) => setCharacter(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <textarea
            placeholder="Your message to the character..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={`w-full font-bold py-3 rounded-lg transition ${
              loading
                ? "bg-gray-600 cursor-not-allowed opacity-50 text-gray-300"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {loading ? "💬 Chatting... (Please wait)" : "Send Message"}
          </button>
        </form>
        {reply && (
          <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-blue-400">{character}'s Reply:</h2>
            <p className="text-gray-300 whitespace-pre-wrap">{reply}</p>
          </div>
        )}
      </div>
    </div>
  );
}