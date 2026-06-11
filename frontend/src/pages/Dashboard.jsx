import { useState } from 'react';
import CsvUpload from '../components/CsvUpload';
import Chart from '../components/Chart';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Lightbulb, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!question) {
      setError('Please enter a question');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      formData.append('question', question);

      const res = await api.post('/api/analyze', formData);
      setResult(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Limit reached. Please upgrade to Pro.');
      } else {
        setError(err.response?.data?.error || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const res = await api.post('/api/stripe/create-checkout-session');
      window.location.href = res.data.url;
    } catch (err) {
      setError('Failed to initiate checkout');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {user?.plan === 'free' && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white flex justify-between items-center shadow-lg">
          <div>
            <h3 className="font-bold text-lg">Upgrade to Pro</h3>
            <p className="text-blue-100 text-sm">You are on the free tier (3 queries/month). Unlock unlimited queries and advanced insights.</p>
          </div>
          <button onClick={handleUpgrade} className="bg-white text-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-slate-50 transition-colors">
            Upgrade for $19/mo
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h2 className="text-lg font-bold mb-4">1. Data Source</h2>
            <CsvUpload onFileSelect={setFile} />
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <h2 className="text-lg font-bold">2. Ask a Question</h2>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              rows={4}
              placeholder="e.g. What is the total revenue by region?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              <span>{loading ? 'Analyzing...' : 'Analyze Data'}</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <>
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <h2 className="text-lg font-bold mb-2">Analysis Result</h2>
                <p className="text-slate-700 leading-relaxed">{result.answer}</p>
              </div>

              {result.cleanedCsv && (
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <h2 className="text-lg font-bold mb-2 text-green-700">Cleaned Data Ready</h2>
                  <p className="text-sm text-slate-600 mb-4">The AI has applied data operations (like removing duplicates or handling missing values) to your dataset.</p>
                  <button onClick={() => {
                    const blob = new Blob([result.cleanedCsv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'cleaned_data.csv';
                    a.click();
                  }} className="bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700 transition-colors">
                    Download Cleaned CSV
                  </button>
                </div>
              )}

              {result.headData && (
                <div className="bg-white p-6 rounded-xl border shadow-sm overflow-x-auto">
                  <h2 className="text-lg font-bold mb-4">Data Preview (First 5 Rows)</h2>
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        {result.headData.columns.map((col, idx) => (
                          <th key={idx} className="px-3 py-2 text-left font-bold text-slate-700 uppercase tracking-wider">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.headData.rows.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className="px-3 py-2 whitespace-nowrap text-slate-600">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {result.chart && result.chart.type !== 'none' && (
                <Chart chartConfig={result.chart} />
              )}

              {result.insights && result.insights.length > 0 && (
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-amber-500" /> Key Insights</h2>
                  <ul className="space-y-3">
                    {result.insights.map((insight, idx) => (
                      <li key={idx} className="flex gap-3 text-slate-700 bg-slate-50 p-3 rounded-lg text-sm border">
                        <span className="font-bold text-blue-600">{idx + 1}.</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl h-full min-h-[400px] flex items-center justify-center text-slate-400 flex-col space-y-4">
              <Sparkles className="w-12 h-12" />
              <p>Upload data and ask a question to see results here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
