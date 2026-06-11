# ============================================================
# features.py
# ============================================================
# Fetches live OHLCV data from yfinance
# Computes all 17 features — identical to notebook 03
# Used for both 2025 backtest and live 2026 predictions
# ============================================================

import pandas as pd
import numpy as np
import yfinance as yf
import warnings
warnings.filterwarnings('ignore')

# ── Tickers — must match training data exactly ─────────────
TICKERS = [
    'AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA',
    'AMZN', 'NFLX', 'CRM',  'ADBE', 'ORCL',
    'JPM',  'BAC',  'GS',   'V',    'MA',
    'JNJ',  'PFE',  'UNH',
    'TSLA', 'WMT'
]

# ── Feature column names — must match feature_cols.pkl ─────
FEATURE_COLS = [
    'return_1d', 'return_5d', 'return_10d', 'return_20d',
    'price_vs_ma20', 'price_vs_ma50',
    'rsi_14', 'macd_hist', 'bb_width', 'atr_14',
    'volume_ratio', 'volume_trend', 'price_volume_signal',
    'market_return_1d',
    'day_of_week', 'month', 'quarter'
]


def fetch_live_data(tickers: list, period: str = '6mo') -> pd.DataFrame:
    """
    Fetch live OHLCV data from yfinance.
    
    Replicates exactly what notebook 01 did:
      - Flatten multi-level columns
      - Add Ticker column
      - Reset index to move Date to column
      - Sort by Ticker then Date
    
    period: '6mo' gives enough history for all rolling windows
            (needs at least 50 rows for ma50)
    """
    df_list = []

    for ticker in tickers:
        try:
            df = yf.download(
                ticker,
                period      = period,
                auto_adjust = True,
                progress    = False
            )

            # Flatten multi-level columns — same as notebook 01
            df.columns = [col[0] for col in df.columns]

            # Add Ticker column
            df['Ticker'] = ticker

            df_list.append(df)

        except Exception as e:
            print(f'Warning: {ticker} failed — {e}')

    if not df_list:
        raise ValueError('No data fetched — check internet connection')

    # Combine all tickers
    df_all = pd.concat(df_list, axis=0)

    # Reset index to move Date from index to column
    # Same as notebook 01: reset_index()
    df_all = df_all.reset_index()

    # Sort by Ticker then Date
    df_all = df_all.sort_values(
                ['Ticker', 'Date']
             ).reset_index(drop=True)

    return df_all


def compute_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute all 17 features from raw OHLCV dataframe.
    Input must have columns: Date, Open, High, Low, Close, Volume, Ticker
    Must be sorted by ['Ticker', 'Date']
    """

    df = df.copy()
    df = df.sort_values(['Ticker', 'Date']).reset_index(drop=True)

    # ── Price return features ──────────────────────────────
    df['return_1d']  = df.groupby('Ticker')['Close'].pct_change(1)
    df['return_5d']  = df.groupby('Ticker')['Close'].pct_change(5)
    df['return_10d'] = df.groupby('Ticker')['Close'].pct_change(10)
    df['return_20d'] = df.groupby('Ticker')['Close'].pct_change(20)

    # ── Moving average features ────────────────────────────
    df['ma20'] = df.groupby('Ticker')['Close']\
                   .transform(lambda x: x.rolling(20).mean())
    df['ma50'] = df.groupby('Ticker')['Close']\
                   .transform(lambda x: x.rolling(50).mean())

    df['price_vs_ma20'] = (df['Close'] - df['ma20']) / df['ma20']
    df['price_vs_ma50'] = (df['Close'] - df['ma50']) / df['ma50']

    # ── RSI 14 ────────────────────────────────────────────
    def compute_rsi(series, period=14):
        delta    = series.diff()
        gain     = delta.clip(lower=0)
        loss     = -delta.clip(upper=0)
        avg_gain = gain.ewm(com=period - 1,
                            min_periods=period).mean()
        avg_loss = loss.ewm(com=period - 1,
                            min_periods=period).mean()
        rs  = avg_gain / avg_loss
        return 100 - (100 / (1 + rs))

    df['rsi_14'] = df.groupby('Ticker')['Close']\
                     .transform(compute_rsi)

    # ── MACD histogram ────────────────────────────────────
    def compute_macd_hist(series):
        ema12  = series.ewm(span=12, adjust=False).mean()
        ema26  = series.ewm(span=26, adjust=False).mean()
        macd   = ema12 - ema26
        signal = macd.ewm(span=9, adjust=False).mean()
        return macd - signal

    df['macd_hist'] = df.groupby('Ticker')['Close']\
                        .transform(compute_macd_hist)

    # ── Bollinger Band width ───────────────────────────────
    def compute_bb_width(series, period=20):
        ma    = series.rolling(period).mean()
        std   = series.rolling(period).std()
        upper = ma + 2 * std
        lower = ma - 2 * std
        return (upper - lower) / ma

    df['bb_width'] = df.groupby('Ticker')['Close']\
                       .transform(compute_bb_width)

    # ── ATR 14 ────────────────────────────────────────────
    def compute_atr(group, period=14):
        high       = group['High']
        low        = group['Low']
        close      = group['Close']
        prev_close = close.shift(1)
        tr = pd.concat([
            high - low,
            (high - prev_close).abs(),
            (low  - prev_close).abs()
        ], axis=1).max(axis=1)
        return tr.ewm(com=period - 1, min_periods=period).mean()

    df['atr_14'] = df.groupby('Ticker', group_keys=False)\
                     .apply(compute_atr)

    # ── Volume features ───────────────────────────────────
    df['vol_ma20'] = df.groupby('Ticker')['Volume']\
                       .transform(lambda x: x.rolling(20).mean())

    df['volume_ratio']        = df['Volume'] / df['vol_ma20']
    df['volume_trend']        = df.groupby('Ticker')['Volume']\
                                  .transform(lambda x: x.pct_change(5))
    df['price_volume_signal'] = df['return_1d'] * df['volume_ratio']

    # ── Market return ─────────────────────────────────────
    market_return = df.groupby('Date')['return_1d']\
                      .mean().reset_index()
    market_return.columns = ['Date', 'market_return_1d']
    df = df.merge(market_return, on='Date', how='left')

    # ── Calendar features ─────────────────────────────────
    df['day_of_week'] = pd.to_datetime(df['Date']).dt.dayofweek
    df['month']       = pd.to_datetime(df['Date']).dt.month
    df['quarter']     = pd.to_datetime(df['Date']).dt.quarter

    # ── Drop helper columns ───────────────────────────────
    df = df.drop(columns=['ma20', 'ma50', 'vol_ma20'],
                 errors='ignore')

    # ── Drop NaN rows ─────────────────────────────────────
    df = df.dropna(subset=FEATURE_COLS).reset_index(drop=True)

    return df


def get_latest_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Return only the latest row per ticker.
    Used for live predictions.
    """
    return df.groupby('Ticker').last().reset_index()