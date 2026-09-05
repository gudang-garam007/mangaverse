import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/ui/Navbar'
import NewsBanner from '@/components/NewsBanner'

export const metadata: Metadata = {
  title: 'MangaVerse Oracle - AI Manga Intelligence',
  description: 'The World\'s First Manga Intelligence & Style Transfer Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-obsidian text-gray-100">
        {/* 1. Navbar (Sabse upar) */}
  <Navbar />

  {/* 2. News Banner (Navbar ke just neeche) */}
  <NewsBanner />

        {/* 3. Page Content */}
        <main className="pt-32 px-4">
          {children}
        </main>
      </body>
    </html>
  )
}