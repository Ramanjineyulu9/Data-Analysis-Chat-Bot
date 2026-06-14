import { useState, useRef, useEffect } from 'react';
import CsvUpload from '../components/CsvUpload';
import Chart from '../components/Chart';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Lightbulb, Sparkles, User, Bot, Download } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [error, setError] = useState('');
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, loading]);

  const handleAnalyze = async () => {
    if (!question) {
      setError('Please enter a question');
      return;
    }
    
    const currentQuestion = question;
    setQuestion('');
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      formData.append('question', currentQuestion);

      const res = await api.post('/api/analyze', formData);
      
      setChatHistory(prev => [...prev, {
        id: Date.now(),
        question: currentQuestion,
        result: res.data
      }]);
      
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Limit reached. Please upgrade to Pro.');
      } else {
        setError(err.response?.data?.error || 'Something went wrong');
      }
      setQuestion(currentQuestion); // Restore question on error
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

  const downloadCsv = (csvData) => {
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cleaned_data.csv';
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-4rem)] flex flex-col space-y-4">
      {user?.plan === 'free' && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white flex justify-between items-center shadow-lg shrink-0">
          <div>
            <h3 className="font-bold text-lg">Upgrade to Pro</h3>
            <p className="text-blue-100 text-sm hidden sm:block">You are on the free tier (3 queries/month). Unlock unlimited queries and advanced ML insights.</p>
          </div>
          <button onClick={handleUpgrade} className="bg-white text-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-slate-50 transition-colors whitespace-nowrap ml-4">
            Upgrade for $9/mo
          </button>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        
        {/* Left Sidebar - Data Source */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-white p-5 rounded-2xl border shadow-sm sticky top-0">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Data Source</h2>
            <CsvUpload onFileSelect={setFile} />
            {file && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 font-medium break-all">
                Active: {file.name}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Chat Feed & Input */}
        <div className="lg:col-span-3 flex flex-col bg-white rounded-2xl border shadow-sm overflow-hidden">
          
          {/* Chat History Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50 custom-scrollbar">
            {chatHistory.length === 0 && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-600">Your AI Data Scientist is ready</h2>
                <p className="text-sm text-center max-w-sm">Upload a CSV on the left and ask me to analyze trends, predict outcomes, or clean your data.</p>
              </div>
            )}

            {chatHistory.map((chat) => (
              <div key={chat.id} className="space-y-6">
                {/* User Message */}
                <div className="flex items-start justify-end gap-3">
                  <div className="bg-blue-600 text-white px-5 py-3 rounded-2xl rounded-tr-sm max-w-[80%] shadow-sm">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{chat.question}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    {user?.avatar ? <img src={user.avatar} className="w-full h-full rounded-full" alt="User" /> : <User className="w-4 h-4 text-slate-500" />}
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200">
                    <Bot className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="bg-white border shadow-sm rounded-2xl rounded-tl-sm p-6 w-full max-w-[90%] space-y-6">
                    
                    <p className="text-slate-700 leading-relaxed text-sm">
                      {chat.result.answer}
                    </p>

                    {chat.result.chart && chat.result.chart.type !== 'none' && (
                      <div className="border rounded-xl p-4 bg-slate-50">
                        <Chart chartConfig={chat.result.chart} />
                      </div>
                    )}

                    {chat.result.insights && chat.result.insights.length > 0 && (
                      <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl">
                        <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-3">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          Machine Learning Insights
                        </h4>
                        <ul className="space-y-2">
                          {chat.result.insights.map((insight, idx) => (
                            <li key={idx} className="flex gap-2 text-slate-700 text-sm">
                              <span className="text-amber-500 font-bold">•</span>
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {chat.result.headData && (chat.result.cleanedCsv || chat.question.toLowerCase().includes('row') || chat.question.toLowerCase().includes('data')) && (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 mt-4">
                        <table className="min-w-full divide-y divide-gray-200 text-xs">
                          <thead className="bg-slate-50">
                            <tr>
                              {chat.result.headData.columns.map((col, idx) => (
                                <th key={idx} className="px-3 py-2 text-left font-bold text-slate-700 uppercase">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {chat.result.headData.rows.map((row, rowIdx) => (
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

                    {chat.result.cleanedCsv && (
                      <button onClick={() => downloadCsv(chat.result.cleanedCsv)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                        <Download className="w-4 h-4" />
                        Download Cleaned Dataset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200">
                  <Bot className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="bg-white border shadow-sm rounded-2xl rounded-tl-sm p-4 flex items-center gap-3 w-fit text-slate-500 text-sm font-medium">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  Running ML algorithms...
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t">
            {error && <div className="mb-3 text-red-500 text-sm font-medium px-2">{error}</div>}
            <div className="flex items-end gap-3 bg-slate-50 border rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
              <textarea
                className="w-full bg-transparent p-2 text-sm focus:outline-none resize-none max-h-32 min-h-[44px]"
                rows={1}
                placeholder="Ask me to predict trends, find correlations, or clean data..."
                value={question}
                onChange={e => {
                  setQuestion(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAnalyze();
                  }
                }}
              />
              <button
                onClick={handleAnalyze}
                disabled={loading || !question.trim()}
                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center mt-2 text-xs text-slate-400">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
