# ============================================================
# main.py
# ============================================================
# FastAPI server — all API endpoints
# Loaded once at startup — models stay in memory
# Frontend calls these endpoints for predictions
# ============================================================

import os
import sys
sys.path.append(os.path.dirname(__file__))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
import pandas as pd

from features  import fetch_live_data, compute_features, TICKERS
from predictor import predictor
from explainer import explain_prediction

# ── Cache for live data ────────────────────────────────────
# Refreshed every request for now
# Can add Redis caching later for performance
_cached_df    = None
_cached_time  = None


def get_featured_df():
    """
    Fetch and cache featured dataframe.
    Refreshes if cache is older than 1 hour.
    """
    global _cached_df, _cached_time
    from datetime import datetime, timedelta

    now = datetime.now()

    if _cached_df is None or \
       _cached_time is None or \
       (now - _cached_time) > timedelta(hours=1):

        print('Refreshing live data cache...')
        df_raw     = fetch_live_data(TICKERS, period='6mo')
        _cached_df = compute_features(df_raw)
        _cached_time = now
        print('Cache refreshed.')

    return _cached_df


# ── Startup: load models once ──────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print('Starting up — loading models...')
    predictor.load_models()
    print('Models loaded — server ready.')
    yield
    print('Shutting down.')


# ── FastAPI app ────────────────────────────────────────────
app = FastAPI(
    title       = 'Stock Signal Dashboard API',
    description = 'ML-powered stock signal predictions',
    version     = '1.0.0',
    lifespan    = lifespan
)

# ── CORS — allow frontend to call backend ─────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ['*'],
    allow_credentials = True,
    allow_methods     = ['*'],
    allow_headers     = ['*'],
)


# ── Request models ─────────────────────────────────────────
class ExplainRequest(BaseModel):
    question: str = None


# ══════════════════════════════════════════════════════════
# ENDPOINTS
# ══════════════════════════════════════════════════════════

@app.get('/')
def root():
    """Health check endpoint."""
    return {
        'status' : 'running',
        'message': 'Stock Signal Dashboard API',
        'version': '1.0.0'
    }


@app.get('/api/health')
def health():
    """Detailed health check."""
    return {
        'status'       : 'healthy',
        'models_loaded': predictor.loaded,
        'tickers'      : len(TICKERS)
    }


@app.get('/api/tickers')
def get_tickers():
    """Return list of all supported tickers."""
    return {'tickers': TICKERS}


@app.get('/api/signals')
def get_all_signals():
    """
    Get Buy/Sell/Hold signals for all 20 tickers.
    Used by the Live Signals page.
    """
    try:
        df_feat = get_featured_df()
        results = predictor.predict_all(df_feat)
        return {
            'status' : 'success',
            'count'  : len(results),
            'signals': results
        }
    except Exception as e:
        raise HTTPException(
            status_code = 500,
            detail      = f'Prediction failed: {str(e)}'
        )


@app.get('/api/predict/{ticker}')
def predict_ticker(ticker: str):
    """
    Get detailed prediction for a single ticker.
    Used by the Stock Detail page.
    """
    ticker = ticker.upper()

    if ticker not in TICKERS:
        raise HTTPException(
            status_code = 404,
            detail      = f'{ticker} not supported. '
                          f'Supported: {TICKERS}'
        )

    try:
        df_feat = get_featured_df()
        result  = predictor.predict_single(df_feat, ticker)
        return {
            'status'    : 'success',
            'prediction': result
        }
    except Exception as e:
        raise HTTPException(
            status_code = 500,
            detail      = f'Prediction failed: {str(e)}'
        )


@app.post('/api/explain/{ticker}')
def explain_ticker(ticker: str,
                   body: ExplainRequest = None):
    """
    Get LLM explanation for a ticker's prediction.
    Used by the chat interface on Stock Detail page.
    """
    ticker = ticker.upper()

    if ticker not in TICKERS:
        raise HTTPException(
            status_code = 404,
            detail      = f'{ticker} not supported.'
        )

    try:
        df_feat    = get_featured_df()
        result     = predictor.predict_single(df_feat, ticker)
        question   = body.question if body else None
        explanation = explain_prediction(result, question)

        return {
            'status'     : 'success',
            'ticker'     : ticker,
            'signal'     : result['signal'],
            'explanation': explanation
        }
    except Exception as e:
        raise HTTPException(
            status_code = 500,
            detail      = f'Explanation failed: {str(e)}'
        )


@app.get('/api/chart/{ticker}')
def get_chart_data(ticker: str, period: str = '6mo'):
    """
    Get OHLCV + indicator data for charting.
    Used by TradingView-style chart on Stock Detail page.
    """
    ticker = ticker.upper()

    if ticker not in TICKERS:
        raise HTTPException(
            status_code = 404,
            detail      = f'{ticker} not supported.'
        )

    try:
        df_feat = get_featured_df()
        df_tick = df_feat[df_feat['Ticker'] == ticker]\
                         .sort_values('Date')

        # Convert to list of dicts for JSON response
        chart_data = []
        for _, row in df_tick.iterrows():
            chart_data.append({
                'date'   : str(row['Date'])[:10],
                'open'   : round(float(row['Open']),  2),
                'high'   : round(float(row['High']),  2),
                'low'    : round(float(row['Low']),   2),
                'close'  : round(float(row['Close']), 2),
                'volume' : int(row['Volume']),
                'rsi'    : round(float(row['rsi_14']),    2),
                'macd'   : round(float(row['macd_hist']), 4),
                'bb_width': round(float(row['bb_width']), 4),
            })

        return {
            'status'    : 'success',
            'ticker'    : ticker,
            'count'     : len(chart_data),
            'chart_data': chart_data
        }
    except Exception as e:
        raise HTTPException(
            status_code = 500,
            detail      = f'Chart data failed: {str(e)}'
        )
