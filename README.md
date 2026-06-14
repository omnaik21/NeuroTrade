# 🧠 NeuroTrade — ML-Powered Stock Signal Prediction

<div align="center">

![NeuroTrade Banner](https://img.shields.io/badge/NeuroTrade-ML%20Stock%20Signals-blue?style=for-the-badge&logo=tensorflow)

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-neurotrade--signals.vercel.app-green?style=for-the-badge)](https://neurotrade-signals.vercel.app)
[![Backend](https://img.shields.io/badge/🤗%20Backend-HuggingFace%20Spaces-yellow?style=for-the-badge)](https://omnaik21-neurotrade-backend.hf.space/api/health)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

**An end-to-end machine learning system that predicts Buy / Sell / Hold signals for 20 US stocks using a stacking ensemble of XGBoost, LightGBM, and LSTM — with LLM-powered explanations via Groq.**

</div>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [Architecture](#-architecture)
- [ML Pipeline](#-ml-pipeline)
- [Tech Stack](#-tech-stack)
- [Stock Universe](#-stock-universe)
- [Project Structure](#-project-structure)
- [Key Design Decisions](#-key-design-decisions)
- [Model Performance](#-model-performance)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Team](#-team)

---

## 🔭 Overview

NeuroTrade is a portfolio-grade ML engineering project that demonstrates a full production pipeline:

- **Feature Engineering** — 17 technical indicators computed per-ticker using `yfinance` OHLCV data
- **Model Training** — XGBoost, LightGBM, and LSTM trained on 2019–2023 historical data across 20 stocks
- **Stacking Ensemble** — Logistic Regression meta-model combines out-of-fold predictions from all 3 base models
- **Live Backend** — FastAPI serving real-time predictions via `yfinance` live data
- **LLM Explanations** — Groq API (LLaMA 3.3 70B) explains every prediction in plain English
- **Interactive Frontend** — Next.js dashboard with live signals, stock charts, and model performance metrics

> ⚠️ **Disclaimer**: This project is for educational and portfolio demonstration purposes only. It is **not financial advice**. Do not use these signals for real trading decisions.

---

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| 🌐 Frontend (Vercel) | [neurotrade-signals.vercel.app](https://neurotrade-signals.vercel.app) |
| ⚙️ Backend API (HuggingFace) | [omnaik21-neurotrade-backend.hf.space](https://omnaik21-neurotrade-backend.hf.space/api/health) |
| 📊 Live Signals | [/signals](https://neurotrade-signals.vercel.app/signals) |
| 📈 Model Performance | [/performance](https://neurotrade-signals.vercel.app/performance) |
| ℹ️ About | [/about](https://neurotrade-signals.vercel.app/about) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vercel)                        │
│                    Next.js + Tailwind CSS                       │
│   Home │ Live Signals │ Stock Detail │ Performance │ About      │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTPS REST API
┌─────────────────────▼───────────────────────────────────────────┐
│                   BACKEND (HuggingFace Spaces)                  │
│                   FastAPI + Uvicorn (Docker)                    │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐  │
│  │  yfinance  │  │  XGBoost   │  │  LightGBM  │  │   LSTM   │  │
│  │ Live Data  │  │   Model    │  │   Model    │  │  Model   │  │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └────┬─────┘  │
│        │               │               │               │        │
│        └───────────────┴───────────────┴───────────────┘        │
│                                    │                            │
│                        ┌───────────▼──────────┐                 │
│                        │  Meta-Model (LogReg)  │                 │
│                        │  Stacking Ensemble    │                 │
│                        └───────────┬──────────┘                 │
│                                    │                            │
│                        ┌───────────▼──────────┐                 │
│                        │    Groq LLM API       │                 │
│                        │  (LLaMA 3.3 70B)      │                 │
│                        └──────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🤖 ML Pipeline

### Notebook Pipeline

| Notebook | Description | Status |
|----------|-------------|--------|
| `01_data_collection.ipynb` | Download 20-ticker OHLCV data (2019–2024) via yfinance | ✅ Done |
| `02_eda.ipynb` | Exploratory analysis — distributions, correlations, sector trends | ✅ Done |
| `03_feature_engineering.ipynb` | 17 technical indicators + target variable (Buy/Sell/Hold) | ✅ Done |
| `04_model_training.ipynb` | XGBoost, LightGBM, LSTM with TimeSeriesSplit CV | ✅ Done |
| `05_model_evaluation.ipynb` | Validation on 2024 holdout data — F1 Macro, Balanced Accuracy | ✅ Done |
| `06_backtesting.ipynb` | 2025 out-of-sample backtest (unseen by model) | 🔜 Coming Soon |
| `07_stacking_ensemble.ipynb` | Meta-model trained on OOF probabilities from all 3 base models | ✅ Done |

### Features (17 Technical Indicators)

| Category | Features |
|----------|----------|
| Trend | SMA 20, SMA 50, EMA 20, Price vs SMA20, Price vs SMA50 |
| Momentum | RSI 14, MACD, MACD Signal, MACD Histogram |
| Volatility | Bollinger Band Width, BB Upper/Lower signals, ATR 14 |
| Volume | OBV, Volume Ratio, Volume SMA 20 |
| Returns | Daily Return |

### Target Variable

```
future_return = Close(t+5) / Close(t) - 1

Buy  → future_return > +2%
Sell → future_return < -2%
Hold → -2% ≤ future_return ≤ +2%
```

### Critical Implementation Rules

To prevent data leakage in panel time-series data:

- **Rule 1 — Purge Gap**: Drop last 5 training dates at each fold boundary to prevent target leakage
- **Rule 2 — Date-Based Splits**: Always split on unique dates (not row indices) to handle 20-ticker panel structure
- **Rule 3 — LSTM Sequences Per Ticker**: Build sequences inside `groupby('Ticker')` to prevent cross-ticker contamination
- **Rule 4 — Meta-Feature Matrix**: Use only 2 probabilities per model (drop P(Buy)) to avoid multicollinearity

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **ML Models** | XGBoost, LightGBM, TensorFlow/Keras (LSTM), scikit-learn |
| **Data** | yfinance, pandas, numpy, ta (technical analysis) |
| **Backend** | FastAPI, Uvicorn, Python 3.11 |
| **LLM** | Groq API — LLaMA 3.3 70B Versatile |
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS |
| **Backend Hosting** | Hugging Face Spaces (Docker, CPU free tier) |
| **Frontend Hosting** | Vercel |
| **Version Control** | GitHub |

---

## 📈 Stock Universe (20 Tickers)

| Sector | Tickers |
|--------|---------|
| 💻 Technology | AAPL, MSFT, GOOGL, META, NVDA |
| 🛒 E-Commerce / Cloud | AMZN, NFLX, CRM, ADBE, ORCL |
| 🏦 Finance | JPM, BAC, GS, V, MA |
| 🏥 Healthcare | JNJ, PFE, UNH |
| 🌐 Other | TSLA, WMT |

---

## 📁 Project Structure

```
Stock_Signal_Dashboard/
│
├── backend/                    # FastAPI backend
│   ├── main.py                 # API endpoints
│   ├── predictor.py            # Model loading + inference
│   ├── features.py             # Live feature computation
│   └── explainer.py            # Groq LLM explanations
│
├── frontend/                   # Next.js frontend
│   ├── app/
│   │   ├── page.tsx            # Home — live signal counts
│   │   ├── signals/            # Live Signals dashboard
│   │   ├── stock/[ticker]/     # Per-stock detail + chart
│   │   ├── performance/        # Model metrics page
│   │   └── about/              # Project & team info
│   ├── components/
│   │   └── NeuralBackground.tsx
│   └── lib/
│       └── api.ts              # API client
│
├── models/                     # Trained model artifacts
│   ├── xgb_model.pkl
│   ├── lgbm_model.pkl
│   ├── lstm_model.keras
│   ├── meta_model.pkl
│   ├── lstm_scaler.pkl
│   └── lstm_sequence_config.pkl
│
├── notebooks/                  # Jupyter notebooks (01–07)
│
└── data/
    ├── raw/                    # Raw OHLCV data
    └── processed/              # Feature-engineered data
```

---

## 🎯 Key Design Decisions

**Why drop P(Buy) from the meta-feature matrix?**
Probabilities from any classifier always sum to 1.0. Including all 3 creates perfect multicollinearity in the Logistic Regression meta-model, making coefficients unstable. Dropping one probability per model gives a clean 6-feature matrix (2 per model × 3 models).

**Why Groq instead of OpenAI/Anthropic?**
Groq's free tier with LLaMA 3.3 70B provides fast inference at no cost — appropriate for a portfolio project without a production budget.

**Why HuggingFace Spaces for backend?**
Free Docker-based hosting with always-on availability (public Spaces don't sleep). Supports Python 3.11, TensorFlow, and LFS for model files up to 1GB.

**Why `tensorflow-cpu` wasn't used?**
The full `tensorflow` package was used for compatibility consistency across development and production environments. The HF Spaces CPU environment handles it correctly.

---

## 📊 Model Performance

Evaluated on **2024 holdout data** — never seen during training or hyperparameter tuning.

| Model | F1 Macro | Balanced Accuracy | F1 Weighted |
|-------|----------|-------------------|-------------|
| XGBoost ⭐ Best | 0.3739 | 0.3769 | 0.4149 |
| LightGBM | 0.3674 | 0.3713 | 0.4099 |
| LSTM | — | — | — |
| Ensemble (Meta) | 0.35 | — | — |

> XGBoost outperforms the stacking ensemble on this dataset. The ensemble shows Hold bias driven by LSTM's high Hold coefficient — a deliberate, documented finding.

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11.x (required for TensorFlow compatibility)
- Node.js 18+

### Backend Setup

```bash
# Clone the repo
git clone https://github.com/omnaik21/NeuroTrade.git
cd NeuroTrade

# Create virtual environment
python -m venv myenv
myenv\Scripts\activate  # Windows
# source myenv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Add your Groq API key
echo "GROQ_API_KEY=your_key_here" > .env

# Run the backend
cd backend
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install

# Set environment variable
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

npm run dev
```

Frontend runs at `http://localhost:3000`

---

## 📡 API Reference

Base URL: `https://omnaik21-neurotrade-backend.hf.space`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check + model status |
| `GET` | `/api/tickers` | List all 20 tickers |
| `GET` | `/api/signals` | Live signals for all tickers |
| `GET` | `/api/predict/{ticker}` | Prediction for a single ticker |
| `POST` | `/api/explain/{ticker}` | LLM explanation for a prediction |
| `GET` | `/api/chart/{ticker}` | OHLCV + indicator data for charting |

### Example Response — `/api/predict/AAPL`

```json
{
  "ticker": "AAPL",
  "signal": "Buy",
  "confidence": 0.67,
  "probabilities": {
    "Sell": 0.12,
    "Hold": 0.21,
    "Buy": 0.67
  },
  "models": {
    "xgboost": "Buy",
    "lightgbm": "Buy",
    "lstm": "Hold",
    "ensemble": "Buy"
  }
}
```

---

## 👥 Team

<table>
  <tr>
    <td align="center">
      <b>Om Naik</b><br/>
      ML Engineering · Backend · Frontend · Deployment<br/>
      <a href="https://github.com/omnaik21">🐙 GitHub</a> ·
      <a href="https://www.linkedin.com/in/omnaik21/">💼 LinkedIn</a>
    </td>
    <td align="center">
      <b>Murali Manohara</b><br/>
      ML Engineering · Research · Data Analysis<br/>
      <a href="https://github.com/Murali-Manohara">🐙 GitHub</a> ·
      <a href="https://www.linkedin.com/in/muralimanohara661/">💼 LinkedIn</a>
    </td>
  </tr>
</table>

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ as a Machine Learning Portfolio Project**

⭐ If you found this project useful, please give it a star!

[![GitHub stars](https://img.shields.io/github/stars/omnaik21/NeuroTrade?style=social)](https://github.com/omnaik21/NeuroTrade)

</div>