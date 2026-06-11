// ============================================================
// lib/api.ts
// ============================================================
// All API calls to the FastAPI backend
// Single place to manage all endpoints
// ============================================================

import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
})

// ── Types ──────────────────────────────────────────────────

export interface ModelPrediction {
  signal: string
  sell  : number
  hold  : number
  buy   : number
}

export interface Prediction {
  ticker  : string
  signal  : string
  color   : string
  price   : number
  date    : string
  ensemble: { sell: number; hold: number; buy: number }
  models  : {
    xgboost  : ModelPrediction
    lightgbm : ModelPrediction
    lstm     : ModelPrediction
  }
  features: Record<string, number>
}

export interface ChartCandle {
  date    : string
  open    : number
  high    : number
  low     : number
  close   : number
  volume  : number
  rsi     : number
  macd    : number
  bb_width: number
}

// ── API Functions ──────────────────────────────────────────

export async function getHealth() {
  const res = await api.get('/api/health')
  return res.data
}

export async function getAllSignals(): Promise<Prediction[]> {
  const res = await api.get('/api/signals')
  return res.data.signals
}

export async function getPrediction(ticker: string): Promise<Prediction> {
  const res = await api.get(`/api/predict/${ticker}`)
  return res.data.prediction
}

export async function getChartData(ticker: string): Promise<ChartCandle[]> {
  const res = await api.get(`/api/chart/${ticker}`)
  return res.data.chart_data
}

export async function getExplanation(
  ticker  : string,
  question: string = ''
): Promise<string> {
  const res = await api.post(`/api/explain/${ticker}`, {
    question: question || null
  })
  return res.data.explanation
}

export async function getTickers(): Promise<string[]> {
  const res = await api.get('/api/tickers')
  return res.data.tickers
}