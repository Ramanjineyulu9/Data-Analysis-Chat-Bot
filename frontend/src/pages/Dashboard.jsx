import { useState, useRef, useEffect } from 'react';
import Chart from '../components/Chart';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Sparkles, User, Bot, Download, Paperclip, FileText, Menu, Plus } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [savedChats, setSavedChats] = useState([]);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/api/analyze/history');
      setSavedChats(res.data);
    } catch (err) {
      console.error('Failed to load history');
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, loading]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'text/csv') {
      setFile(selected);
      setError('');
    } else {
      setError('Please select a valid CSV file');
    }
  };

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
      
      fetchHistory(); // Refresh sidebar
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Limit reached. Please upgrade to Pro.');
      } else {
        setError(err.response?.data?.error || 'Something went wrong');
      }
      setQuestion(currentQuestion);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedChat = (saved) => {
    // For now, loading a saved chat replaces the current session view with that specific interaction
    setChatHistory([{
      id: saved.id,
      question: saved.question,
      result: {
        answer: saved.answer,
        chart: saved.chart_json ? JSON.parse(saved.chart_json) : { type: 'none' },
        insights: [],
      }
    }]);
    if (window.innerWidth < 1024) setSidebarOpen(false);
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
    <div className="flex h-screen bg-[#FDFCF8] overflow-hidden font-sans">
      
      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden absolute top-4 left-4 z-50 p-2 bg-white rounded-md shadow-sm border"
      >
        <Menu className="w-5 h-5 text-slate-700" />
      </button>

      {/* Claude-Style Left Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        transition-transform duration-300 ease-in-out
        absolute lg:relative z-40
        w-72 h-full bg-[#f3f2eb] border-r border-[#e5e3d8] flex flex-col
      `}>
        <div className="p-4">
          <button 
            onClick={() => setChatHistory([])}
            className="w-full flex items-center gap-2 bg-white hover:bg-slate-50 border border-[#e5e3d8] rounded-lg px-4 py-3 text-sm font-medium transition-colors text-slate-700 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar space-y-1">
          <h3 className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Analyses</h3>
          {savedChats.map((chat) => (
            <button 
              key={chat.id}
              onClick={() => loadSavedChat(chat)}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[#e8e6dc] text-sm text-slate-700 transition-colors truncate"
            >
              {chat.question}
            </button>
          ))}
          {savedChats.length === 0 && (
            <p className="text-xs text-slate-400 px-3 py-2">No past history found.</p>
          )}
        </div>

        {user?.plan === 'free' && (
          <div className="p-4 border-t border-[#e5e3d8]">
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-xl p-4 text-white shadow-sm">
              <h3 className="font-bold text-sm mb-1">Upgrade to Pro</h3>
              <p className="text-amber-100 text-xs mb-3">Unlock unlimited Agent interactions.</p>
              <button 
                onClick={async () => {
                  try {
                    const res = await api.post('/api/stripe/create-checkout-session');
                    window.location.href = res.data.url;
                  } catch(e) {}
                }} 
                className="w-full bg-white text-amber-700 px-4 py-2 rounded text-sm font-bold hover:bg-slate-50 transition-colors"
              >
                Upgrade ($9/mo)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col items-center relative w-full">
        
        {/* Chat Feed */}
        <div className="flex-1 w-full max-w-4xl overflow-y-auto p-4 md:p-8 custom-scrollbar scroll-smooth">
          {chatHistory.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-6">
              <div className="w-16 h-16 bg-[#e8e6dc] rounded-2xl flex items-center justify-center shadow-sm">
                <Sparkles className="w-8 h-8 text-slate-700" />
              </div>
              <h2 className="text-2xl font-serif text-slate-800">Good afternoon.</h2>
              <p className="text-slate-500 max-w-md text-center">I am your Autonomous Data Agent. Attach a CSV and ask me to analyze trends, build charts, or clean your data.</p>
            </div>
          )}

          <div className="space-y-10 pb-32">
            {chatHistory.map((chat) => (
              <div key={chat.id} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* User Question */}
                <div className="flex items-start justify-end">
                  <div className="bg-[#e8e6dc] text-slate-800 px-5 py-3.5 rounded-2xl max-w-[85%] text-[15px] shadow-sm leading-relaxed">
                    {chat.question}
                  </div>
                </div>

                {/* Agent Response */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="w-full max-w-[90%] space-y-6">
                    <div className="prose prose-slate max-w-none text-[15px] leading-relaxed text-slate-800">
                      <p>{chat.result.answer}</p>
                    </div>

                    {chat.result.chart && chat.result.chart.type !== 'none' && (
                      <div className="border border-[#e5e3d8] rounded-xl p-6 bg-white shadow-sm mt-4">
                        <Chart chartConfig={chat.result.chart} />
                      </div>
                    )}

                    {chat.result.headData && (chat.result.cleanedCsv || chat.question.toLowerCase().includes('data')) && (
                      <div className="overflow-x-auto rounded-xl border border-[#e5e3d8] bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-[#e5e3d8] text-xs">
                          <thead className="bg-[#f8f7f2]">
                            <tr>
                              {chat.result.headData.columns.map((col, idx) => (
                                <th key={idx} className="px-4 py-3 text-left font-semibold text-slate-600 uppercase">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e5e3d8]">
                            {chat.result.headData.rows.map((row, rowIdx) => (
                              <tr key={rowIdx}>
                                {row.map((cell, cellIdx) => (
                                  <td key={cellIdx} className="px-4 py-3 whitespace-nowrap text-slate-600">{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {chat.result.cleanedCsv && (
                      <button onClick={() => downloadCsv(chat.result.cleanedCsv)} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm">
                        <Download className="w-4 h-4" />
                        Download Processed CSV
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center shrink-0 shadow-sm mt-1">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-center gap-3 text-slate-500 text-[15px] font-medium h-10">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                  Agent is reasoning...
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Floating Input Area */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#FDFCF8] via-[#FDFCF8] to-transparent pt-10 pb-6 px-4 md:px-8 flex justify-center">
          <div className="w-full max-w-3xl">
            {error && <div className="mb-2 text-red-500 text-sm font-medium px-4">{error}</div>}
            
            <div className="bg-white border border-[#e5e3d8] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500/50 transition-all p-3 flex flex-col">
              
              {file && (
                <div className="flex items-center gap-2 mb-2 px-2">
                  <div className="bg-[#f3f2eb] border border-[#e5e3d8] rounded-md px-3 py-1.5 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-medium text-slate-700">{file.name}</span>
                    <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500 ml-1">&times;</button>
                  </div>
                </div>
              )}

              <div className="flex items-end gap-2">
                <input 
                  type="file" 
                  accept=".csv" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-[#f3f2eb] rounded-xl transition-colors shrink-0"
                  title="Attach CSV"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <textarea
                  className="w-full bg-transparent p-2.5 text-[15px] text-slate-800 placeholder-slate-400 focus:outline-none resize-none max-h-40 min-h-[44px] leading-relaxed"
                  rows={1}
                  placeholder={file ? "Ask the Agent a question about this data..." : "Attach a CSV or ask a general question..."}
                  value={question}
                  onChange={e => {
                    setQuestion(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAnalyze();
                    }
                  }}
                />
              </div>
            </div>
            <div className="text-center mt-3 text-[11px] text-slate-400">
              Agent responses are generated by Llama 3 on Groq.
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
