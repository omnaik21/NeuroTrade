# ============================================================
# explainer.py
# ============================================================
# Connects to Groq API
# Takes model prediction + feature values
# Returns plain English explanation of the signal
# ============================================================

import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# ── Groq client ────────────────────────────────────────────
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

# ── Model to use ───────────────────────────────────────────
GROQ_MODEL = 'llama-3.3-70b-versatile'

# ── System prompt ──────────────────────────────────────────
SYSTEM_PROMPT = """
You are NeuroTrade AI — an assistant embedded in a stock signal prediction platform.

YOUR SCOPE — you answer ONLY these types of questions:

1. STOCK PREDICTIONS
   - Why is the model predicting Buy/Sell/Hold?
   - What do the probability scores mean?
   - How confident is the model?
   - What do RSI, MACD, Bollinger Bands, ATR mean for this stock?

2. COMPANY INFORMATION (only for the 20 stocks on this platform)
   - What does this company do?
   - Who founded it?
   - When was it founded?
   - What sector is it in?
   - Basic business model and products
   - Recent known performance or news (based on your training data)

3. TECHNICAL ANALYSIS EDUCATION
   - What is RSI and how to interpret it?
   - What does MACD histogram mean?
   - What are Bollinger Bands?
   - General trading concepts related to the platform

THE 20 STOCKS ON THIS PLATFORM:
AAPL, MSFT, GOOGL, META, NVDA, AMZN, NFLX, CRM, ADBE, ORCL,
JPM, BAC, GS, V, MA, JNJ, PFE, UNH, TSLA, WMT

YOU MUST REFUSE anything outside this scope. Examples:
- "What stock should I buy?" → Refuse
- "Give me a portfolio strategy" → Refuse
- "Tell me a joke" → Refuse
- "What is the weather?" → Refuse
- "Write me code" → Refuse
- "Tell me about a stock not on this platform" → Refuse

REFUSAL RESPONSE:
"I can only answer questions about the 20 stocks on this platform,
their predictions, technical indicators, or company information.
Please ask me something related to these stocks."

RULES:
- Always refer to actual feature values provided in the context
- Never recommend buying or selling — only explain model output
- Always mention predictions are model output, not financial advice
- Keep responses concise — 3 to 5 sentences maximum
- Never make price predictions beyond what the model outputs

Tone: professional, clear, factual
"""


def build_context(prediction: dict) -> str:
    """
    Build context string from prediction dict
    to pass to the LLM.
    """

    features = prediction['features']
    models   = prediction['models']
    ensemble = prediction['ensemble']

    context = f"""
Stock: {prediction['ticker']}
Date: {prediction['date']}
Current Price: ${prediction['price']}

=== Model Predictions ===
Ensemble Signal: {prediction['signal']}
  Sell: {ensemble['sell']*100:.1f}%
  Hold: {ensemble['hold']*100:.1f}%
  Buy:  {ensemble['buy']*100:.1f}%

Individual Models:
  XGBoost  → {models['xgboost']['signal']}  (S:{models['xgboost']['sell']*100:.1f}% H:{models['xgboost']['hold']*100:.1f}% B:{models['xgboost']['buy']*100:.1f}%)
  LightGBM → {models['lightgbm']['signal']} (S:{models['lightgbm']['sell']*100:.1f}% H:{models['lightgbm']['hold']*100:.1f}% B:{models['lightgbm']['buy']*100:.1f}%)
  LSTM     → {models['lstm']['signal']}     (S:{models['lstm']['sell']*100:.1f}% H:{models['lstm']['hold']*100:.1f}% B:{models['lstm']['buy']*100:.1f}%)

=== Technical Indicators ===
RSI (14)              : {features['rsi_14']:.2f}
MACD Histogram        : {features['macd_hist']:.4f}
Bollinger Band Width  : {features['bb_width']:.4f}
ATR (14)              : {features['atr_14']:.4f}

=== Price Action ===
1-day return          : {features['return_1d']*100:.2f}%
5-day return          : {features['return_5d']*100:.2f}%
10-day return         : {features['return_10d']*100:.2f}%
20-day return         : {features['return_20d']*100:.2f}%
Price vs MA20         : {features['price_vs_ma20']*100:.2f}%
Price vs MA50         : {features['price_vs_ma50']*100:.2f}%

=== Volume ===
Volume Ratio          : {features['volume_ratio']:.2f}x average
Volume Trend          : {features['volume_trend']*100:.2f}%
Price Volume Signal   : {features['price_volume_signal']:.4f}
"""
    return context.strip()


def explain_prediction(prediction: dict,
                       user_question: str = None) -> str:
    """
    Generate plain English explanation of a prediction.
    
    Input:
        prediction    — dict from predictor.predict_single()
        user_question — optional follow-up question from user
    
    Output:
        explanation string from LLM
    """

    context = build_context(prediction)

    if user_question:
        user_message = f"""
Here is the current prediction data for {prediction['ticker']}:

{context}

User question: {user_question}

Please answer the user's question based on the prediction data above.
"""
    else:
        user_message = f"""
Here is the current prediction data for {prediction['ticker']}:

{context}

Please explain why the model is predicting {prediction['signal']} 
for {prediction['ticker']} based on the technical indicators 
and model probabilities above.
"""

    try:
        response = client.chat.completions.create(
            model    = GROQ_MODEL,
            messages = [
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user',   'content': user_message}
            ],
            max_tokens  = 300,
            temperature = 0.3
        )

        return response.choices[0].message.content

    except Exception as e:
        return f'Explanation unavailable: {str(e)}'
