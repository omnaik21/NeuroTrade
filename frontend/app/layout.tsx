// ============================================================
// app/layout.tsx
// ============================================================
// Global layout — wraps every page
// Neural background on all pages
// ============================================================

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import NeuralBackground from '../components/NeuralBackground'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title       : 'NeuroTrade',
  description : 'ML-powered stock signal predictions using XGBoost, LightGBM, LSTM and a Stacking Ensemble',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>

        {/* ── Neural background on every page ───────────── */}
        <NeuralBackground />

        {/* ── Navbar ────────────────────────────────────── */}
        <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">

              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">N</span>
                </div>
                <span className="font-bold text-lg text-white">
                  NeuroTrade
                </span>
              </Link>

              {/* Nav links */}
              <div className="flex items-center gap-6">
                <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Home
                </Link>
                <Link href="/signals" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Live Signals
                </Link>
                <Link href="/performance" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Performance
                </Link>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors text-sm">
                  About
                </Link>
              </div>

            </div>
          </div>
        </nav>

        {/* ── Page content ──────────────────────────────── */}
        <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ zIndex: 1 }}>
          {children}
        </main>

        {/* ── Footer ────────────────────────────────────── */}
        <footer className="relative border-t border-gray-800 mt-16" style={{ zIndex: 1 }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 text-sm">
                NeuroTrade — ML Portfolio Project
              </p>
              <p className="text-gray-500 text-sm">
                Models trained on 2019–2023 data. Not financial advice.
              </p>
            </div>
          </div>
        </footer>

      </body>
    </html>
  )
}