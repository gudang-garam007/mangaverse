import type { Metadata } from 'next'
import Script from 'next/script'
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
      <head>
        {/* 1. POPUNDER AD (Right before closing </head>) */}
        <Script
          src="https://pl31218663.profitableratecpmnetwork.com/1d/b5/99/1db59957a973cfc73dedb65f064df939.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-screen bg-obsidian text-gray-100">

        {/* 2. Navbar (Sabse upar) */}
        <Navbar />

        {/* 3. News Banner (Navbar ke just neeche) */}
        <NewsBanner />

        {/* 4. Page Content */}
        <main className="pt-32 px-4">
          {children}
        </main>

        {/* 5. SOCIAL BAR AD (Right above closing </body>) */}
        <Script
          src="https://pl31218661.profitableratecpmnetwork.com/e0/5b/18/e05b18450a88fe0eda53c63a06823a80.js"
          strategy="afterInteractive"
        />

      </body>
    </html>
  )
}