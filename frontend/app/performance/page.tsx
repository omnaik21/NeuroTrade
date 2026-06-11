// ============================================================
// app/performance/page.tsx
// ============================================================
// Model Performance page — scorecard + per class breakdown
// ============================================================

'use client'

import { useState } from 'react'

// ── Performance data from notebook 07 ─────────────────────
const MODEL_SCORES = [
  {
    name    : 'XGBoost',
    f1_macro: 0.3739,
    bal_acc : 0.3769,
    f1_wtd  : 0.4149,
    sell_f1 : 0.2298,
    hold_f1 : 0.5554,
    buy_f1  : 0.3364,
    color   : 'blue',
    best    : true,
  },
  {
    name    : 'LightGBM',
    f1_macro: 0.3674,
    bal_acc : 0.3713,
    f1_wtd  : 0.4099,
    sell_f1 : 0.2207,
    hold_f1 : 0.5581,
    buy_f1  : 0.3233,
    color   : 'purple',
    best    : false,
  },
  {
    name    : 'LSTM',
    f1_macro: 0.3573,
    bal_acc : 0.3832,
    f1_wtd  : 0.3987,
    sell_f1 : 0.2690,
    hold_f1 : 0.5984,
    buy_f1  : 0.2043,
    color   : 'green',
    best    : false,
  },
  {
    name    : 'Ensemble',
    f1_macro: 0.3545,
    bal_acc : 0.3807,
    f1_wtd  : 0.4066,
    sell_f1 : 0.2074,
    hold_f1 : 0.6208,
    buy_f1  : 0.2352,
    color   : 'orange',
    best    : false,
  },
]

// ── Training info ──────────────────────────────────────────
const TRAINING_INFO = [
  { label: 'Training Period',  value: '2019 – 2023'       },
  { label: 'Validation Period', value: '2024'             },
  { label: 'Total Stocks',     value: '20 US Stocks'      },
  { label: 'Total Rows',       value: '29,100'            },
  { label: 'Features',         value: '17 Technical Indicators' },
  { label: 'Target',           value: '5-day Forward Return' },
  { label: 'Classes',          value: 'Buy / Hold / Sell' },
  { label: 'CV Strategy',      value: '5-fold TimeSeriesSplit' },
]

// ── Metric bar ─────────────────────────────────────────────
function MetricBar({
  value,
  max = 1,
  color
}: {
  value: number
  max?: number
  color: string
}) {
  const colorMap: Record<string, string> = {
    blue  : 'bg-blue-500',
    purple: 'bg-purple-500',
    green : 'bg-green-500',
    orange: 'bg-orange-500',
  }
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-800 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorMap[color]}`}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
      <span className="text-white font-mono text-sm w-12 text-right">
        {value.toFixed(4)}
      </span>
    </div>
  )
}

// ── Model card ─────────────────────────────────────────────
function ModelCard({ model }: { model: typeof MODEL_SCORES[0] }) {
  const colorMap: Record<string, string> = {
    blue  : 'border-blue-500/30 bg-blue-500/5',
    purple: 'border-purple-500/30 bg-purple-500/5',
    green : 'border-green-500/30 bg-green-500/5',
    orange: 'border-orange-500/30 bg-orange-500/5',
  }
  const textMap: Record<string, string> = {
    blue  : 'text-blue-400',
    purple: 'text-purple-400',
    green : 'text-green-400',
    orange: 'text-orange-400',
  }

  return (
    <div className={`border rounded-xl p-6 ${colorMap[model.color]} ${model.best ? 'ring-1 ring-yellow-500/50' : ''}`}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-bold ${textMap[model.color]}`}>
          {model.name}
        </h3>
        {model.best && (
          <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-1 rounded-md text-xs font-semibold">
            Best Model ✅
          </span>
        )}
      </div>

      {/* Primary metrics */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
          <div className={`text-xl font-bold font-mono ${textMap[model.color]}`}>
            {model.f1_macro.toFixed(4)}
          </div>
          <div className="text-xs text-gray-500 mt-1">F1 Macro</div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
          <div className={`text-xl font-bold font-mono ${textMap[model.color]}`}>
            {model.bal_acc.toFixed(4)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Bal Accuracy</div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
          <div className={`text-xl font-bold font-mono ${textMap[model.color]}`}>
            {model.f1_wtd.toFixed(4)}
          </div>
          <div className="text-xs text-gray-500 mt-1">F1 Weighted</div>
        </div>
      </div>

      {/* Per class F1 */}
      <div className="space-y-3">
        <div className="text-xs text-gray-500 mb-2">Per-Class F1 Score</div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-red-400">Sell</span>
          </div>
          <MetricBar value={model.sell_f1} color={model.color} />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-yellow-400">Hold</span>
          </div>
          <MetricBar value={model.hold_f1} color={model.color} />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-green-400">Buy</span>
          </div>
          <MetricBar value={model.buy_f1} color={model.color} />
        </div>
      </div>

    </div>
  )
}

// ── Main page ──────────────────────────────────────────────
export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview')

  return (
    <div>

      {/* ── Header ──────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Model Performance
        </h1>
        <p className="text-gray-400">
          Validation results on 2024 data — never seen during training.
          Evaluated using F1 Macro and Balanced Accuracy.
        </p>
      </div>

      {/* ── Tabs ────────────────────────────────────────── */}
      <div className="flex gap-2 mb-8">
        {(['overview', 'details'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>

          {/* ── Summary table ─────────────────────────── */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">
                Validation Scorecard (2024)
              </h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-3 text-gray-400 text-sm">Model</th>
                  <th className="text-right px-6 py-3 text-gray-400 text-sm">F1 Macro</th>
                  <th className="text-right px-6 py-3 text-gray-400 text-sm">Bal Accuracy</th>
                  <th className="text-right px-6 py-3 text-gray-400 text-sm">F1 Weighted</th>
                </tr>
              </thead>
              <tbody>
                {MODEL_SCORES.map((m, i) => (
                  <tr
                    key={m.name}
                    className={`border-b border-gray-800/50 ${
                      i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-900/50'
                    } ${m.best ? 'ring-1 ring-inset ring-yellow-500/20' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{m.name}</span>
                        {m.best && (
                          <span className="text-yellow-400 text-xs">✅ Best</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-white">
                      {m.f1_macro.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-white">
                      {m.bal_acc.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-white">
                      {m.f1_wtd.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Key findings ──────────────────────────── */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-bold text-white mb-4">Key Findings</h2>
            <div className="space-y-3 text-sm text-gray-400">
              <p>• <span className="text-white font-medium">XGBoost</span> is the best performing model with F1 Macro of 0.3739 on 2024 validation data.</p>
              <p>• <span className="text-white font-medium">LSTM</span> achieves the highest Balanced Accuracy (0.3832), showing it handles class imbalance better.</p>
              <p>• <span className="text-white font-medium">Ensemble</span> underperforms the best base model — the meta-model over-relies on LSTM Hold signal (coefficient 1.80).</p>
              <p>• All models struggle with <span className="text-red-400">Sell</span> and <span className="text-green-400">Buy</span> classes — Hold is predicted most reliably across all models.</p>
              <p>• Random baseline F1 Macro = 0.33. All models beat the baseline.</p>
            </div>
          </div>

          {/* ── Training info ──────────────────────────── */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Training Configuration</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {TRAINING_INFO.map(item => (
                <div key={item.label} className="bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                  <div className="text-white font-medium text-sm">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {MODEL_SCORES.map(model => (
            <ModelCard key={model.name} model={model} />
          ))}
        </div>
      )}

    </div>
  )
}