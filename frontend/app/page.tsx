// ============================================================
// app/page.tsx
// ============================================================
// Home page — hero section + live signal summary cards
// Neural background is in layout.tsx — applies to all pages
// ============================================================

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAllSignals, Prediction } from '@/lib/api'

// ── Signal badge ───────────────────────────────────────────
function SignalBadge({ signal }: { signal: string }) {
  const colors: Record<string, string> = {
    Buy : 'bg-green-500/20 text-green-400 border border-green-500/30',
    Sell: 'bg-red-500/20 text-red-400 border border-red-500/30',
    Hold: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  }
  return (
    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${colors[signal] || ''}`}>
      {signal}
    </span>
  )
}

// ── Stock card ─────────────────────────────────────────────
function StockCard({ prediction }: { prediction: Prediction }) {
  return (
    <Link href={`/stock/${prediction.ticker}`}>
      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-4 hover:border-blue-500/50 hover:bg-gray-800/50 transition-all cursor-pointer">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-white text-lg">
            {prediction.ticker}
          </span>
          <SignalBadge signal={prediction.signal} />
        </div>
        <div className="text-2xl font-bold text-white mb-1">
          ${prediction.price.toFixed(2)}
        </div>
        <div className="text-xs text-gray-500">
          {prediction.date}
        </div>
        <div className="mt-3 flex gap-2 text-xs">
          <span className="text-red-400">
            S: {(prediction.ensemble.sell * 100).toFixed(0)}%
          </span>
          <span className="text-yellow-400">
            H: {(prediction.ensemble.hold * 100).toFixed(0)}%
          </span>
          <span className="text-green-400">
            B: {(prediction.ensemble.buy * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </Link>
  )
}

// ── Main page ──────────────────────────────────────────────
export default function HomePage() {
  const [signals, setSignals] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    getAllSignals()
      .then(setSignals)
      .catch(() => setError('Failed to load signals. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  const buyCount  = signals.filter(s => s.signal === 'Buy').length
  const sellCount = signals.filter(s => s.signal === 'Sell').length
  const holdCount = signals.filter(s => s.signal === 'Hold').length

  return (
    <div>

      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="text-center py-16 mb-12">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 text-blue-400 text-sm mb-6">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
          Live Predictions — Updated Daily
        </div>
        <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
          NeuroTrade
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
          ML-powered Buy/Sell/Hold signals for 20 US stocks using
          XGBoost, LightGBM, LSTM and a Stacking Ensemble.
          Trained on 2019–2023 data.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/signals"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            View Live Signals
          </Link>
          <Link
            href="/performance"
            className="bg-gray-800/80 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors backdrop-blur-sm"
          >
            Model Performance
          </Link>
        </div>
      </div>

      {/* ── Stats bar ─────────────────────────────────────── */}
      {!loading && !error && (
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{buyCount}</div>
            <div className="text-sm text-gray-400 mt-1">Buy Signals</div>
          </div>
          <div className="bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">{holdCount}</div>
            <div className="text-sm text-gray-400 mt-1">Hold Signals</div>
          </div>
          <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-400">{sellCount}</div>
            <div className="text-sm text-gray-400 mt-1">Sell Signals</div>
          </div>
        </div>
      )}

      {/* ── Stock cards grid ──────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">
          Today's Signals
        </h2>

        {loading && (
          <div className="text-center py-20 text-gray-400">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Loading predictions...
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {signals.map(prediction => (
              <StockCard
                key={prediction.ticker}
                prediction={prediction}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}