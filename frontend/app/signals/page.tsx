// ============================================================
// app/signals/page.tsx
// ============================================================
// Live Signals page — detailed table of all 20 stocks
// ============================================================

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAllSignals, Prediction } from '@/lib/api'

function SignalBadge({ signal }: { signal: string }) {
  const colors: Record<string, string> = {
    Buy : 'bg-green-500/20 text-green-400 border border-green-500/30',
    Sell: 'bg-red-500/20 text-red-400 border border-red-500/30',
    Hold: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  }
  return (
    <span className={`px-3 py-1 rounded-md text-xs font-semibold ${colors[signal] || ''}`}>
      {signal}
    </span>
  )
}

function ProbBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${color}`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  )
}

export default function SignalsPage() {
  const [signals,    setSignals]    = useState<Prediction[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [filter,     setFilter]     = useState('All')
  const [lastUpdate, setLastUpdate] = useState('')

  useEffect(() => {
    getAllSignals()
      .then(data => {
        setSignals(data)
        setLastUpdate(new Date().toLocaleTimeString())
      })
      .catch(() => setError('Failed to load signals. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'All'
    ? signals
    : signals.filter(s => s.signal === filter)

  const buyCount  = signals.filter(s => s.signal === 'Buy').length
  const sellCount = signals.filter(s => s.signal === 'Sell').length
  const holdCount = signals.filter(s => s.signal === 'Hold').length

  return (
    <div>

      {/* ── Header ──────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Live Signals
        </h1>
        <p className="text-gray-400">
          Real-time Buy/Sell/Hold predictions for all 20 stocks.
          {lastUpdate && (
            <span className="ml-2 text-gray-500 text-sm">
              Last updated: {lastUpdate}
            </span>
          )}
        </p>
      </div>

      {/* ── Stats ───────────────────────────────────────── */}
      {!loading && !error && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{buyCount}</div>
            <div className="text-sm text-gray-400 mt-1">Buy</div>
          </div>
          <div className="bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">{holdCount}</div>
            <div className="text-sm text-gray-400 mt-1">Hold</div>
          </div>
          <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-400">{sellCount}</div>
            <div className="text-sm text-gray-400 mt-1">Sell</div>
          </div>
        </div>
      )}

      {/* ── Filter buttons ──────────────────────────────── */}
      <div className="flex gap-2 mb-6">
        {['All', 'Buy', 'Hold', 'Sell'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800/80 text-gray-400 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Loading ─────────────────────────────────────── */}
      {loading && (
        <div className="text-center py-20 text-gray-400">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Loading predictions...
        </div>
      )}

      {/* ── Error ───────────────────────────────────────── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center text-red-400">
          {error}
        </div>
      )}

      {/* ── Table ───────────────────────────────────────── */}
      {!loading && !error && (
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Ticker</th>
                <th className="text-right px-6 py-4 text-gray-400 text-sm font-medium">Price</th>
                <th className="text-center px-6 py-4 text-gray-400 text-sm font-medium">Signal</th>
                <th className="px-6 py-4 text-gray-400 text-sm font-medium">Sell Prob</th>
                <th className="px-6 py-4 text-gray-400 text-sm font-medium">Hold Prob</th>
                <th className="px-6 py-4 text-gray-400 text-sm font-medium">Buy Prob</th>
                <th className="text-right px-6 py-4 text-gray-400 text-sm font-medium">Date</th>
                <th className="text-center px-6 py-4 text-gray-400 text-sm font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr
                  key={s.ticker}
                  className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${
                    i % 2 === 0 ? 'bg-gray-900/50' : 'bg-gray-900/30'
                  }`}
                >
                  <td className="px-6 py-4">
                    <span className="font-bold text-white">{s.ticker}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-white font-mono">${s.price.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <SignalBadge signal={s.signal} />
                  </td>
                  <td className="px-6 py-4 w-32">
                    <ProbBar value={s.ensemble.sell} color="bg-red-500" />
                  </td>
                  <td className="px-6 py-4 w-32">
                    <ProbBar value={s.ensemble.hold} color="bg-yellow-500" />
                  </td>
                  <td className="px-6 py-4 w-32">
                    <ProbBar value={s.ensemble.buy} color="bg-green-500" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-gray-500 text-sm">{s.date}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link
                      href={`/stock/${s.ticker}`}
                      className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}