'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Swords,Sword, Image, MessageCircle, Menu, X, Zap, Gamepad2 } from 'lucide-react'

const navLinks = [
  { href: '/battle', label: 'Battle', icon: Swords },
  { href: '/convert', label: 'Convert', icon: Image },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/whatif', label: 'What If', icon: Zap },
  { href: '/weapons', label: 'Weapons', icon: Sword },
  { href: '/game', label: 'Game', icon: Gamepad2, highlight: true },

]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] glass-strong border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl">🎌</span>
          <span className="text-xl font-black">
            <span className="text-gradient-cyan">Manga</span>
            <span className="text-white">Verse</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                link.highlight
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-300 hover:to-purple-400 hover:bg-purple-500/10'
                  : 'text-gray-300 hover:text-neon-cyan hover:bg-neon-cyan/5'
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
              {link.highlight && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-black uppercase bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full shadow-lg shadow-pink-500/30 animate-pulse">
                  Daily
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-gray-300"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden glass-strong border-t border-white/10 p-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                link.highlight
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-300 hover:to-purple-400 hover:bg-purple-500/10'
                  : 'text-gray-300 hover:text-neon-cyan hover:bg-neon-cyan/5'
              }`}
              onClick={() => setMobileOpen(false)}
            >
              <link.icon className="w-5 h-5" />
              {link.label}
              {link.highlight && (
                <span className="ml-auto px-2 py-0.5 text-[10px] font-black uppercase bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full shadow-lg shadow-pink-500/30 animate-pulse">
                  Daily
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}