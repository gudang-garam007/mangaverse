"use client";
import { useState } from "react";

interface FastImageProps {
  src: string;
  alt: string;
  className?: string;
  silhouette?: boolean;
  revealPercent?: number;
}

export default function FastImage({
  src,
  alt,
  className = "",
  silhouette = false,
  revealPercent = 0,
}: FastImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton placeholder while loading */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error fallback */}
      {error && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center text-4xl">
          🎌
        </div>
      )}

      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
        decoding="async"
        className={`w-full h-full object-cover transition-all duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${
          silhouette && revealPercent < 100
            ? ""
            : ""
        }`}
        style={{
          filter:
            silhouette && revealPercent < 100
              ? `brightness(${revealPercent / 100}) contrast(${
                  revealPercent < 50 ? 1.5 : 1
                })`
              : "none",
        }}
      />

      {/* Silhouette overlay */}
      {silhouette && revealPercent < 100 && (
        <div
          className="absolute inset-0 bg-black transition-opacity duration-700 pointer-events-none"
          style={{
            opacity: Math.max(0, 1 - revealPercent / 100),
          }}
        />
      )}
    </div>
  );
}