# ============================================================
# predictor.py
# ============================================================
# Loads all 4 trained models into memory
# Runs predictions on feature dataframe
# Returns signal, probabilities for all 4 models
# ============================================================

import numpy as np
import pandas as pd
import joblib
import os
from tensorflow import keras
from features import FEATURE_COLS

# ── Signal label map ───────────────────────────────────────
SIGNAL_MAP   = {0: 'Sell', 1: 'Hold', 2: 'Buy'}
SIGNAL_COLOR = {
    'Buy' : '#00C853',   # green
    'Hold': '#FFD600',   # yellow
    'Sell': '#FF1744'    # red
}


class StockPredictor:
    """
    Loads all 4 models once at startup.
    Provides predict() method for live and batch predictions.
    """

    def __init__(self, models_dir: str = '../models'):
        self.models_dir  = models_dir
        self.xgb_model   = None
        self.lgbm_model  = None
        self.lstm_model  = None
        self.meta_model  = None
        self.lstm_scaler = None
        self.lstm_cfg    = None
        self.loaded      = False

    def load_models(self):
        """Load all models from disk into memory."""

        print('Loading models...')

        self.xgb_model  = joblib.load(
            os.path.join(self.models_dir, 'xgb_model.pkl')
        )
        print('  XGBoost loaded  ✅')

        self.lgbm_model = joblib.load(
            os.path.join(self.models_dir, 'lgbm_model.pkl')
        )
        print('  LightGBM loaded ✅')

        self.lstm_model = keras.models.load_model(
            os.path.join(self.models_dir, 'lstm_model.keras')
        )
        print('  LSTM loaded     ✅')

        self.meta_model = joblib.load(
            os.path.join(self.models_dir, 'meta_model.pkl')
        )
        print('  Meta-model loaded ✅')

        self.lstm_scaler = joblib.load(
            os.path.join(self.models_dir, 'lstm_scaler.pkl')
        )
        self.lstm_cfg = joblib.load(
            os.path.join(self.models_dir, 'lstm_sequence_config.pkl')
        )
        print('  Scaler + config loaded ✅')

        self.loaded = True
        print('All models ready.')

    def _build_lstm_sequence(self,
                              df: pd.DataFrame,
                              ticker: str) -> np.ndarray:
        """
        Build LSTM sequence for a single ticker.
        Takes last LOOKBACK rows and scales them.
        Returns shape (1, LOOKBACK, n_features)
        """
        lookback = self.lstm_cfg['lookback']

        group = df[df['Ticker'] == ticker]\
                  .sort_values('Date')\
                  .tail(lookback)

        if len(group) < lookback:
            return None

        features = self.lstm_scaler.transform(
            group[FEATURE_COLS].values
        )

        return features[np.newaxis, :, :]   # shape (1, 20, 17)

    def predict_single(self,
                       df_featured: pd.DataFrame,
                       ticker: str) -> dict:
        """
        Run all 4 models on a single ticker.
        
        Input:
            df_featured — full featured dataframe
                          must contain enough history
            ticker      — e.g. 'AAPL'
        
        Output:
            dict with signal, probabilities, per-model breakdown
        """

        if not self.loaded:
            raise RuntimeError('Models not loaded. Call load_models() first.')

        # ── Get latest flat features for this ticker ───────
        latest = df_featured[df_featured['Ticker'] == ticker]\
                             .sort_values('Date')\
                             .iloc[[-1]]

        X_flat = latest[FEATURE_COLS].values   # shape (1, 17)

        # ── XGBoost prediction ─────────────────────────────
        xgb_probs  = self.xgb_model.predict_proba(X_flat)[0]

        # ── LightGBM prediction ────────────────────────────
        lgbm_probs = self.lgbm_model.predict_proba(X_flat)[0]

        # ── LSTM prediction ────────────────────────────────
        X_seq = self._build_lstm_sequence(df_featured, ticker)

        if X_seq is not None:
            lstm_probs = self.lstm_model.predict(
                X_seq, verbose=0
            )[0]
        else:
            # Not enough history — use equal probs
            lstm_probs = np.array([1/3, 1/3, 1/3])

        # ── Meta-model prediction ──────────────────────────
        meta_features = np.array([[
            xgb_probs[0],   # XGB  P(Sell)
            xgb_probs[1],   # XGB  P(Hold)
            lgbm_probs[0],  # LGBM P(Sell)
            lgbm_probs[1],  # LGBM P(Hold)
            lstm_probs[0],  # LSTM P(Sell)
            lstm_probs[1],  # LSTM P(Hold)
        ]])

        meta_probs  = self.meta_model.predict_proba(
                          meta_features)[0]
        meta_signal = SIGNAL_MAP[np.argmax(meta_probs)]

        return {
            'ticker'       : ticker,
            'signal'       : meta_signal,
            'color'        : SIGNAL_COLOR[meta_signal],
            'ensemble'     : {
                'sell' : round(float(meta_probs[0]), 4),
                'hold' : round(float(meta_probs[1]), 4),
                'buy'  : round(float(meta_probs[2]), 4),
            },
            'models'       : {
                'xgboost' : {
                    'signal': SIGNAL_MAP[np.argmax(xgb_probs)],
                    'sell'  : round(float(xgb_probs[0]), 4),
                    'hold'  : round(float(xgb_probs[1]), 4),
                    'buy'   : round(float(xgb_probs[2]), 4),
                },
                'lightgbm': {
                    'signal': SIGNAL_MAP[np.argmax(lgbm_probs)],
                    'sell'  : round(float(lgbm_probs[0]), 4),
                    'hold'  : round(float(lgbm_probs[1]), 4),
                    'buy'   : round(float(lgbm_probs[2]), 4),
                },
                'lstm'    : {
                    'signal': SIGNAL_MAP[np.argmax(lstm_probs)],
                    'sell'  : round(float(lstm_probs[0]), 4),
                    'hold'  : round(float(lstm_probs[1]), 4),
                    'buy'   : round(float(lstm_probs[2]), 4),
                },
            },
            'features'     : {
                col: round(float(latest[col].values[0]), 4)
                for col in FEATURE_COLS
            },
            'price'        : round(float(
                                latest['Close'].values[0]), 2),
            'date'         : str(
                                latest['Date'].values[0])[:10],
        }

    def predict_all(self,
                    df_featured: pd.DataFrame) -> list:
        """
        Run predictions for all 20 tickers.
        Returns list of prediction dicts.
        """
        results = []
        tickers = df_featured['Ticker'].unique()

        for ticker in tickers:
            try:
                result = self.predict_single(
                    df_featured, ticker
                )
                results.append(result)
            except Exception as e:
                print(f'Warning: {ticker} prediction failed — {e}')

        return results


# ── Singleton instance ─────────────────────────────────────
# Loaded once at startup — not reloaded per request
predictor = StockPredictor(models_dir='../models')