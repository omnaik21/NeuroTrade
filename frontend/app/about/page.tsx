export default function AboutPage() {
  return (
    <div>

      <div className="mb-12">
        <h1 className="text-3xl font-bold text-white mb-2">About NeuroTrade</h1>
        <p className="text-gray-400">An end-to-end ML pipeline for stock signal prediction.</p>
      </div>

      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">Project Overview</h2>
        <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
          <p>NeuroTrade is a full-stack machine learning portfolio project that predicts Buy/Sell/Hold signals for 20 US stocks using historical OHLCV data and technical indicators.</p>
          <p>The pipeline trains three base models — XGBoost, LightGBM, and LSTM — on 2019-2023 data, then combines them using a Logistic Regression stacking ensemble.</p>
          <p>All predictions are from models trained strictly on 2019-2023 data. The 2024 validation set was opened only once for final evaluation.</p>
        </div>
      </div>

      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">ML Pipeline</h2>
        <div className="space-y-3">
          {[
            { step: '01', name: 'Data Collection',     desc: 'Downloaded 20 stocks from Yahoo Finance (2019-2024), daily OHLCV' },
            { step: '02', name: 'EDA',                 desc: 'Exploratory analysis of price distributions, correlations, volume patterns' },
            { step: '03', name: 'Feature Engineering', desc: '17 technical indicators: RSI, MACD, Bollinger Bands, ATR, volume features' },
            { step: '04', name: 'XGBoost',             desc: 'Gradient boosted trees with 5-fold purged TimeSeriesSplit CV' },
            { step: '05', name: 'LightGBM',            desc: 'Leaf-wise growth trees, faster training, comparable performance' },
            { step: '06', name: 'LSTM',                desc: '20-day sequence model capturing temporal momentum patterns' },
            { step: '07', name: 'Stacking Ensemble',   desc: 'Logistic Regression meta-model combining OOF predictions from all 3 models' },
          ].map(item => (
            <div key={item.step} className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-blue-600/20 border border-blue-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-400 text-xs font-bold">{item.step}</span>
              </div>
              <div>
                <div className="text-white font-medium text-sm">{item.name}</div>
                <div className="text-gray-500 text-xs mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">Tech Stack</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { category: 'ML Models',  items: ['XGBoost', 'LightGBM', 'TensorFlow/Keras', 'scikit-learn'] },
            { category: 'Data',       items: ['yfinance', 'pandas', 'numpy', 'Yahoo Finance API'] },
            { category: 'Backend',    items: ['FastAPI', 'Python 3.11', 'uvicorn', 'joblib'] },
            { category: 'Frontend',   items: ['Next.js 16', 'TypeScript', 'Tailwind CSS', 'Axios'] },
            { category: 'LLM',        items: ['Groq API', 'Llama 3.3 70B', 'Natural language explanations'] },
            { category: 'Deployment', items: ['Vercel (frontend)', 'Hugging Face Spaces (backend)'] },
          ].map(item => (
            <div key={item.category} className="bg-gray-800/80 rounded-lg p-4">
              <div className="text-blue-400 text-xs font-semibold mb-2 uppercase tracking-wide">{item.category}</div>
              <ul className="space-y-1">
                {item.items.map(i => (
                  <li key={i} className="text-gray-400 text-xs">{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">ML Methodology</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { title: 'No Data Leakage',      desc: '5-day purge gap at fold boundaries prevents target leakage from 5-day forward returns' },
            { title: 'Date-based CV Splits', desc: 'TimeSeriesSplit on unique dates not row indices ensures correct chronological ordering' },
            { title: 'Per-ticker Sequences', desc: 'LSTM sequences built inside groupby loop, no cross-ticker boundary contamination' },
            { title: 'Honest Evaluation',    desc: 'Validation set opened exactly once. No retuning after seeing results.' },
          ].map(item => (
            <div key={item.title} className="bg-gray-800/80 rounded-lg p-4">
              <div className="text-white font-medium text-sm mb-1">{item.title}</div>
              <div className="text-gray-500 text-xs leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-6">Developers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <div>
                <div className="text-white font-bold">Om Naik</div>
                <div className="text-gray-400 text-xs">ML Engineer</div>
              </div>
            </div>
            <div className="flex gap-3">
              <a href="https://www.linkedin.com/in/omnaik21/" target="_blank" rel="noopener noreferrer" className="bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 px-3 py-2 rounded-lg text-xs font-medium transition-colors">LinkedIn</a>
              <a href="https://github.com/omnaik21" target="_blank" rel="noopener noreferrer" className="bg-gray-700/50 hover:bg-gray-700 border border-gray-600 text-gray-300 px-3 py-2 rounded-lg text-xs font-medium transition-colors">GitHub</a>
            </div>
          </div>

          <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <div>
                <div className="text-white font-bold">Murali Manohara</div>
                <div className="text-gray-400 text-xs">ML Engineer</div>
              </div>
            </div>
            <div className="flex gap-3">
              <a href="https://www.linkedin.com/in/muralimanohara661/" target="_blank" rel="noopener noreferrer" className="bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 px-3 py-2 rounded-lg text-xs font-medium transition-colors">LinkedIn</a>
              <a href="https://github.com/Murali-Manohara" target="_blank" rel="noopener noreferrer" className="bg-gray-700/50 hover:bg-gray-700 border border-gray-600 text-gray-300 px-3 py-2 rounded-lg text-xs font-medium transition-colors">GitHub</a>
            </div>
          </div>

        </div>
      </div>

      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-6">
        <h2 className="text-yellow-400 font-bold mb-2">Disclaimer</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          NeuroTrade is a portfolio demonstration project built for educational purposes.
          All predictions are generated by machine learning models trained on historical data.
          Past performance does not guarantee future results.
          This is not financial advice. Do not make investment decisions based on these signals.
        </p>
      </div>

    </div>
  )
}