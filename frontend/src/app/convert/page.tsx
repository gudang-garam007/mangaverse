"use client";

import { useState, useRef } from "react";
import { Upload, Wand2, Image as ImageIcon, Sparkles, X } from "lucide-react";

export default function ConvertPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // ✅ NEW: File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ NEW: Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create a local preview URL
      const previewUrl = URL.createObjectURL(file);
      setFilePreview(previewUrl);
    }
  };

  // ✅ NEW: Trigger hidden file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // ✅ NEW: Remove selected file
  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!prompt && !selectedFile) return; // Need at least one
    setIsGenerating(true);
    setGeneratedImage(null);

    // Simulating API call (We will connect actual backend here later)
    setTimeout(() => {
      const finalPrompt = prompt || "epic manga character battle scene, highly detailed, shonen style";
      setGeneratedImage(`https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}%20manga%20style%20masterpiece?width=512&height=512&nologo=true&model=flux`);
      setIsGenerating(false);
    }, 2500);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6 pt-32">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">AI Style Transfer</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
            Manga Panel Converter
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Transform your photos or text descriptions into authentic, high-quality manga panels using our advanced AI models.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Input Section */}
          <div className="space-y-6">

            {/* ✅ UPDATED: Functional Upload Area */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />

            <div
              onClick={triggerFileInput}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group relative overflow-hidden ${
                filePreview
                  ? "border-purple-500/50 bg-purple-500/5"
                  : "border-gray-700 hover:border-purple-500/50 bg-gray-900/50"
              }`}
            >
              {filePreview ? (
                <div className="relative">
                  <img src={filePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl mb-3" />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(); }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-full transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-sm text-purple-300 font-medium truncate">{selectedFile?.name}</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-500/20 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">Upload Reference Image</h3>
                  <p className="text-sm text-gray-500">Click to browse (PNG, JPG, WEBP)</p>
                </>
              )}
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-purple-400" />
                Describe your scene (Optional if image uploaded)
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A fierce samurai standing in the rain, dynamic angle, highly detailed, shonen manga style..."
                className="w-full h-32 bg-gray-900 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition resize-none"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || (!prompt && !selectedFile)}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Manga Panel...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Panel
                </>
              )}
            </button>
          </div>

          {/* Right: Output Section */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
            {!generatedImage && !isGenerating && (
              <div className="text-center text-gray-500">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Your generated manga panel will appear here</p>
              </div>
            )}

            {isGenerating && (
              <div className="text-center">
                <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-purple-300 font-medium animate-pulse">AI is drawing your panel...</p>
              </div>
            )}

            {generatedImage && !isGenerating && (
              <div className="w-full h-full flex flex-col items-center animate-in fade-in zoom-in duration-500">
                <img
                  src={generatedImage}
                  alt="Generated Manga"
                  className="w-full max-w-md rounded-xl shadow-2xl shadow-purple-500/20 border border-gray-700"
                />
                <div className="mt-4 flex gap-3">
                  <a
                    href={generatedImage}
                    download="manga-panel.png"
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" /> Download
                  </a>
                  <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Upscale (Premium)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}