'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createChart } from 'lightweight-charts'
import {
  getPrediction,
  getChartData,
  getExplanation,
  Prediction,
  ChartCandle
} from '@/lib/api'

function SignalBadge({ signal, large }: { signal: string; large?: boolean }) {
  const colors: Record<string, string> = {
    Buy : 'bg-green-500/20 text-green-400 border border-green-500/30',
    Sell: 'bg-red-500/20 text-red-400 border border-red-500/30',
    Hold: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  }
  return (
    <span className={`rounded-md font-semibold ${large ? 'px-4 py-2 text-lg' : 'px-2 py-1 text-xs'} ${colors[signal] || ''}`}>
      {signal}
    </span>
  )
}

function ProbBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-mono">{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="bg-gray-800 rounded-full h-2">
        <div className={`h-2 rounded-full ${color} transition-all duration-500`} style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  )
}

function PriceChart({ data }: { data: ChartCandle[] }) {
  const chartRef = useRef<HTMLDivElement>(null)
  const rsiRef   = useRef<HTMLDivElement>(null)
  const macdRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current || !data.length) return

    const chartOptions = {
      width          : chartRef.current.clientWidth,
      height         : 300,
      layout         : { textColor: '#9ca3af' },
      grid           : {
        vertLines    : { color: '#1f2937' },
        horzLines    : { color: '#1f2937' },
      },
      crosshair      : { mode: 1 },
      rightPriceScale: { borderColor: '#374151' },
      timeScale      : { borderColor: '#374151', timeVisible: true },
    }

    const chart = createChart(chartRef.current, chartOptions as any)

    const candleSeries = chart.addCandlestickSeries({
      upColor        : '#22c55e',
      downColor      : '#ef4444',
      borderUpColor  : '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor    : '#22c55e',
      wickDownColor  : '#ef4444',
    })

    candleSeries.setData(data.map(d => ({
      time : d.date,
      open : d.open,
      high : d.high,
      low  : d.low,
      close: d.close,
    })))

    const volumeSeries = chart.addHistogramSeries({
      priceFormat : { type: 'volume' as const },
      priceScaleId: 'volume',
    })
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })
    volumeSeries.setData(data.map(d => ({
      time : d.date,
      value: d.volume,
      color: d.close >= d.open ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
    })))

    chart.timeScale().fitContent()

    const rsiOptions = {
      width          : rsiRef.current?.clientWidth || 600,
      height         : 100,
      layout         : { textColor: '#9ca3af' },
      grid           : {
        vertLines    : { color: '#1f2937' },
        horzLines    : { color: '#1f2937' },
      },
      rightPriceScale: { borderColor: '#374151' },
      timeScale      : { borderColor: '#374151', timeVisible: true },
    }

    let rsiChart: any = null
    if (rsiRef.current) {
      rsiChart = createChart(rsiRef.current, rsiOptions as any)
      const rsiSeries = rsiChart.addLineSeries({ color: '#3b82f6', lineWidth: 2 })
      rsiSeries.setData(data.map(d => ({ time: d.date, value: d.rsi })))
      const ob = rsiChart.addLineSeries({ color: '#ef4444', lineWidth: 1, lineStyle: 2 })
      ob.setData(data.map(d => ({ time: d.date, value: 70 })))
      const os = rsiChart.addLineSeries({ color: '#22c55e', lineWidth: 1, lineStyle: 2 })
      os.setData(data.map(d => ({ time: d.date, value: 30 })))
      rsiChart.timeScale().fitContent()
    }

    let macdChart: any = null
    if (macdRef.current) {
      macdChart = createChart(macdRef.current, { ...rsiOptions, width: macdRef.current.clientWidth } as any)
      const macdSeries = macdChart.addHistogramSeries({ color: '#3b82f6' })
      macdSeries.setData(data.map(d => ({
        time : d.date,
        value: d.macd,
        color: d.macd >= 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)',
      })))
      macdChart.timeScale().fitContent()
    }

    const handleResize = () => {
      if (chartRef.current)  chart.applyOptions({ width: chartRef.current.clientWidth })
      if (rsiRef.current && rsiChart)   rsiChart.applyOptions({ width: rsiRef.current.clientWidth })
      if (macdRef.current && macdChart) macdChart.applyOptions({ width: macdRef.current.clientWidth })
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      if (rsiChart)  rsiChart.remove()
      if (macdChart) macdChart.remove()
    }
  }, [data])

  return (
    <div>
      <div className="mb-2"><span className="text-xs text-gray-500">Candlestick + Volume (6 months)</span></div>
      <div ref={chartRef} className="w-full" />
      <div className="mt-4 mb-1 flex items-center gap-2">
        <span className="text-xs text-gray-500">RSI (14)</span>
        <span className="text-xs text-red-400">— 70 overbought</span>
        <span className="text-xs text-green-400">— 30 oversold</span>
      </div>
      <div ref={rsiRef} className="w-full" />
      <div className="mt-4 mb-1"><span className="text-xs text-gray-500">MACD Histogram</span></div>
      <div ref={macdRef} className="w-full" />
    </div>
  )
}

interface Message {
  role   : 'user' | 'assistant'
  content: string
}

function ChatMessage({ message }: { message: Message }) {
  return (
    <div className={`flex gap-3 mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.role === 'assistant' && (
        <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-white text-xs font-bold">N</span>
        </div>
      )}
      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl text-sm leading-relaxed ${
        message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-200 border border-gray-700'
      }`}>
        {message.content}
      </div>
    </div>
  )
}

export default function StockPage() {
  const params  = useParams()
  const ticker  = (params.ticker as string).toUpperCase()

  const [prediction,  setPrediction]  = useState<Prediction | null>(null)
  const [chartData,   setChartData]   = useState<ChartCandle[]>([])
  const [loading,     setLoading]     = useState(true)
  const [messages,    setMessages]    = useState<Message[]>([])
  const [input,       setInput]       = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      getPrediction(ticker),
      getChartData(ticker)
    ]).then(([pred, chart]) => {
      setPrediction(pred)
      setChartData(chart)
      setMessages([{
        role   : 'assistant',
        content: `Hi! I am analyzing ${ticker} for you. Ask me anything about this prediction.`
      }])
    }).finally(() => setLoading(false))
  }, [ticker])

  const sendMessage = async () => {
    if (!input.trim() || !prediction) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setChatLoading(true)
    try {
      const explanation = await getExplanation(ticker, userMsg)
      setMessages(prev => [...prev, { role: 'assistant', content: explanation }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not get an explanation right now.' }])
    } finally {
      setChatLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        Loading {ticker}...
      </div>
    )
  }

  if (!prediction) {
    return <div className="text-center py-20 text-red-400">Failed to load prediction for {ticker}</div>
  }

  return (
    <div>

      <Link href="/signals" className="text-gray-400 hover:text-white text-sm mb-6 inline-flex items-center gap-1 transition-colors">
        Back to Signals
      </Link>

      <div className="flex items-center justify-between mb-8 mt-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-1">{ticker}</h1>
          <p className="text-gray-400">{prediction.date}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white mb-2">${prediction.price.toFixed(2)}</div>
          <SignalBadge signal={prediction.signal} large />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">

          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Price Chart</h2>
            <PriceChart data={chartData} />
          </div>

          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Model Predictions</h2>
            <div className="grid grid-cols-2 gap-4">

              <div className="col-span-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-white">Ensemble (Final)</span>
                  <SignalBadge signal={prediction.signal} />
                </div>
                <ProbBar label="Sell" value={prediction.ensemble.sell} color="bg-red-500" />
                <ProbBar label="Hold" value={prediction.ensemble.hold} color="bg-yellow-500" />
                <ProbBar label="Buy"  value={prediction.ensemble.buy}  color="bg-green-500" />
              </div>

              <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-white text-sm">XGBoost</span>
                  <SignalBadge signal={prediction.models.xgboost.signal} />
                </div>
                <ProbBar label="Sell" value={prediction.models.xgboost.sell} color="bg-red-500" />
                <ProbBar label="Hold" value={prediction.models.xgboost.hold} color="bg-yellow-500" />
                <ProbBar label="Buy"  value={prediction.models.xgboost.buy}  color="bg-green-500" />
              </div>

              <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-white text-sm">LightGBM</span>
                  <SignalBadge signal={prediction.models.lightgbm.signal} />
                </div>
                <ProbBar label="Sell" value={prediction.models.lightgbm.sell} color="bg-red-500" />
                <ProbBar label="Hold" value={prediction.models.lightgbm.hold} color="bg-yellow-500" />
                <ProbBar label="Buy"  value={prediction.models.lightgbm.buy}  color="bg-green-500" />
              </div>

              <div className="col-span-2 bg-gray-800/80 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-white text-sm">LSTM</span>
                  <SignalBadge signal={prediction.models.lstm.signal} />
                </div>
                <ProbBar label="Sell" value={prediction.models.lstm.sell} color="bg-red-500" />
                <ProbBar label="Hold" value={prediction.models.lstm.hold} color="bg-yellow-500" />
                <ProbBar label="Buy"  value={prediction.models.lstm.buy}  color="bg-green-500" />
              </div>

            </div>
          </div>

          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Technical Indicators</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'RSI (14)',   value: prediction.features.rsi_14.toFixed(1),                      color: prediction.features.rsi_14 > 70 ? 'text-red-400' : prediction.features.rsi_14 < 30 ? 'text-green-400' : 'text-white' },
                { label: 'MACD Hist', value: prediction.features.macd_hist.toFixed(3),                    color: prediction.features.macd_hist > 0 ? 'text-green-400' : 'text-red-400' },
                { label: 'BB Width',  value: prediction.features.bb_width.toFixed(3),                     color: 'text-white' },
                { label: 'ATR (14)',  value: prediction.features.atr_14.toFixed(2),                       color: 'text-white' },
                { label: '1D Return', value: `${(prediction.features.return_1d * 100).toFixed(2)}%`,      color: prediction.features.return_1d > 0 ? 'text-green-400' : 'text-red-400' },
                { label: '5D Return', value: `${(prediction.features.return_5d * 100).toFixed(2)}%`,      color: prediction.features.return_5d > 0 ? 'text-green-400' : 'text-red-400' },
                { label: 'vs MA20',   value: `${(prediction.features.price_vs_ma20 * 100).toFixed(2)}%`,  color: prediction.features.price_vs_ma20 > 0 ? 'text-green-400' : 'text-red-400' },
                { label: 'vs MA50',   value: `${(prediction.features.price_vs_ma50 * 100).toFixed(2)}%`,  color: prediction.features.price_vs_ma50 > 0 ? 'text-green-400' : 'text-red-400' },
              ].map(item => (
                <div key={item.label} className="bg-gray-800/80 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                  <div className={`font-mono font-bold ${item.color}`}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="lg:col-span-1">
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl h-full flex flex-col" style={{ minHeight: '600px' }}>

            <div className="p-4 border-b border-gray-800">
              <h2 className="font-bold text-white">Ask NeuroTrade AI</h2>
              <p className="text-xs text-gray-500 mt-1">Ask anything about this prediction</p>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}
              {chatLoading && (
                <div className="flex gap-3 mb-4">
                  <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">N</span>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask about this prediction..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={chatLoading || !input.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Send
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">Powered by Groq LLM — not financial advice</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}