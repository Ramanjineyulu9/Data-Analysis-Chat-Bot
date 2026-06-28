import { useState, useRef, useEffect } from 'react';
import Chart from '../components/Chart';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Sparkles, Download, Paperclip, FileText, Menu, Plus, Activity, Database, LayoutDashboard, LogOut } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [reasoningStep, setReasoningStep] = useState(0);
  const [chatId, setChatId] = useState(() => Date.now().toString());
  const [chatHistory, setChatHistory] = useState([]);
  const [savedChats, setSavedChats] = useState([]);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Right panel state
  const [activeData, setActiveData] = useState(null);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const reasoningSteps = [
    "Reading dataset schema...",
    "Analyzing column distributions...",
    "Selecting appropriate ML models...",
    "Training and validating...",
    "Generating insights..."
  ];

  useEffect(() => {
    fetchHistory();
  }, []);

  // Simulate streaming thoughts
  useEffect(() => {
    let interval;
    if (loading) {
      setReasoningStep(0);
      interval = setInterval(() => {
        setReasoningStep(prev => (prev < reasoningSteps.length - 1 ? prev + 1 : prev));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

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
    setActiveData(null); // Clear right panel for new request
    
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      formData.append('question', currentQuestion);
      formData.append('chatId', chatId);

      const res = await api.post('/api/analyze', formData);
      
      const newHistoryItem = {
        id: Date.now(),
        question: currentQuestion,
        result: res.data
      };
      
      setChatHistory(prev => [...prev, newHistoryItem]);
      
      // Auto-open right panel if there are charts or metrics
      if (res.data.charts?.length > 0 || res.data.metrics?.length > 0 || res.data.headData) {
        setActiveData(res.data);
      }
      
      fetchHistory();
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

  const startNewChat = () => {
    setChatId(Date.now().toString());
    setChatHistory([]);
    setFile(null);
    setActiveData(null);
  };

  const loadSavedChat = (saved) => {
    setChatId(saved.chat_id);
    let latestData = null;
    
    const reconstructedHistory = saved.messages.map((m, idx) => {
      let parsedChart = { type: 'none' };
      let parsedMetrics = [];
      let parsedCharts = [];
      
      if (m.chart_json) {
        let rawObj;
        if (typeof m.chart_json === 'string') {
          try {
            rawObj = JSON.parse(m.chart_json);
          } catch (e) {
            rawObj = { type: 'none' };
          }
        } else {
          rawObj = m.chart_json;
        }

        if (rawObj && rawObj.metrics !== undefined && rawObj.charts !== undefined) {
          parsedChart = rawObj.chartConfig;
          parsedMetrics = rawObj.metrics;
          parsedCharts = rawObj.charts;
        } else {
          parsedChart = rawObj;
        }
      }
      
      const resultObj = {
        answer: m.answer,
        chart: parsedChart,
        metrics: parsedMetrics,
        charts: parsedCharts,
        insights: [],
      };
      
      if (parsedCharts.length > 0 || parsedMetrics.length > 0) {
        latestData = resultObj;
      }
      
      return {
        id: m.id || idx,
        question: m.question,
        result: resultObj
      };
    });
    
    setChatHistory(reconstructedHistory);
    setActiveData(latestData);
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
    <div className="flex h-screen bg-[#FDFCF8] text-slate-800 overflow-hidden font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden absolute top-4 left-4 z-50 p-2 bg-white border border-[#e5e3d8] rounded-md shadow-sm"
      >
        <Menu className="w-5 h-5 text-slate-700" />
      </button>

      {/* LEFT SIDEBAR */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        transition-transform duration-300 ease-in-out
        absolute lg:relative z-40
        w-72 h-full bg-white border-r border-[#e5e3d8] flex flex-col shadow-xl
      `}>
        <div className="p-4 border-b border-[#e5e3d8]">
          <button 
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-4 py-3 text-sm font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Workspace
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar space-y-1">
          <h3 className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Workspaces</h3>
          {savedChats.map((chat) => (
            <button 
              key={chat.chat_id}
              onClick={() => loadSavedChat(chat)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all truncate border 
                ${chatId === chat.chat_id 
                  ? 'bg-[#f8f7f2] border-amber-300/50 text-slate-900 shadow-sm' 
                  : 'border-transparent text-slate-600 hover:bg-[#f8f7f2] hover:text-slate-900'}`}
            >
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 shrink-0 opacity-70" />
                <span className="truncate">{chat.title}</span>
              </div>
            </button>
          ))}
          {savedChats.length === 0 && (
            <p className="text-xs text-slate-400 px-3 py-2">No past history found.</p>
          )}
        </div>

        {user?.plan === 'free' && (
          <div className="p-4 border-t border-[#e5e3d8] bg-[#f8f7f2]">
            <div className="bg-slate-800 rounded-xl p-4 text-white shadow-md ring-1 ring-slate-700">
              <h3 className="font-bold text-sm mb-1 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500"/> Upgrade to Pro</h3>
              <p className="text-slate-300 text-xs mb-3">Unlock unlimited Agent actions.</p>
              <button 
                onClick={async () => {
                  try {
                    const res = await api.post('/api/stripe/create-checkout-session');
                    window.location.href = res.data.url;
                  } catch(e) {}
                }} 
                className="w-full bg-amber-600 text-white border-none px-4 py-2 rounded text-sm font-bold hover:bg-amber-500 transition-colors shadow-sm"
              >
                Upgrade ($9/mo)
              </button>
            </div>
          </div>
        )}

        {/* User Profile */}
        <div className="p-4 border-t border-[#e5e3d8] bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 overflow-hidden">
              {user?.picture ? (
                <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-amber-700 text-sm font-bold">{user?.name?.charAt(0) || 'U'}</span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-slate-800 truncate">{user?.name || 'User'}</span>
              <span className="text-xs text-slate-500 truncate">{user?.email || 'Logged in'}</span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CENTER CHAT AREA */}
      <div className="flex-1 flex flex-col items-center w-full h-full relative">
        
        {/* Chat Feed */}
        <div className="flex-1 w-full max-w-4xl overflow-y-auto p-4 md:p-8 custom-scrollbar scroll-smooth flex flex-col z-10">
          {chatHistory.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-6">
              <div className="w-20 h-20 bg-white border border-[#e5e3d8] rounded-3xl flex items-center justify-center shadow-sm animate-pulse-slow">
                <Sparkles className="w-10 h-10 text-amber-600" />
              </div>
              <h2 className="text-3xl font-serif text-slate-800">What shall we analyze today?</h2>
              <p className="text-slate-500 max-w-md text-center text-[15px] leading-relaxed">
                I am your Data Agent. Attach a dataset and instruct me to build models, clean rows, or generate interactive charts.
              </p>
            </div>
          )}

          <div className="space-y-8 pb-32">
            {chatHistory.map((chat) => (
              <div key={chat.id} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* User Prompt */}
                <div className="flex items-start justify-end">
                  <div className="bg-slate-800 text-white px-5 py-3.5 rounded-2xl rounded-tr-sm max-w-[85%] text-[15px] shadow-sm leading-relaxed">
                    {chat.question}
                  </div>
                </div>

                {/* Agent Response */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#e5e3d8] flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="w-full max-w-[90%] space-y-4">
                    
                    {/* Simulated Thought Block */}
                    <div className="bg-[#f8f7f2] border border-[#e5e3d8] rounded-xl p-3 inline-flex items-center gap-3 text-xs text-slate-600 shadow-sm">
                      <Activity className="w-4 h-4 text-slate-400" />
                      <span>Task completed successfully.</span>
                      <button 
                        onClick={() => setActiveData(chat.result)}
                        className="ml-4 bg-white border border-[#e5e3d8] hover:bg-slate-50 px-2 py-1 rounded transition-colors text-slate-700 flex items-center gap-1 shadow-sm"
                      >
                        <LayoutDashboard className="w-3 h-3"/> View Data
                      </button>
                    </div>

                    <div className="prose prose-p:text-slate-700 prose-strong:text-slate-900 max-w-none text-[15px] leading-relaxed">
                      <p>{chat.result.answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-4 animate-in fade-in duration-300">
                <div className="w-10 h-10 rounded-full bg-white border border-[#e5e3d8] flex items-center justify-center shrink-0 shadow-sm mt-1 animate-pulse">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex flex-col gap-2 w-full max-w-[90%]">
                   <div className="bg-white border border-[#e5e3d8] rounded-xl p-4 shadow-sm flex flex-col gap-3 w-fit min-w-[250px]">
                      <div className="flex items-center gap-3 text-slate-800 text-sm font-medium">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        Working...
                      </div>
                      <div className="text-xs text-slate-500 border-l-2 border-amber-200 pl-3 py-1">
                        {reasoningSteps[reasoningStep]}
                      </div>
                   </div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} className="h-4" />
          </div>
        </div>

        {/* Floating Input Area */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center px-4 md:px-8 z-20 pointer-events-none">
          <div className="w-full max-w-3xl pointer-events-auto">
            {error && <div className="mb-2 text-red-700 text-sm font-medium px-4 bg-red-50 rounded-lg py-2 border border-red-200 w-fit mx-auto shadow-sm">{error}</div>}
            
            <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-[#e5e3d8] focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-400 transition-all p-3 flex flex-col">
              
              {file && (
                <div className="flex items-center gap-2 mb-2 px-2">
                  <div className="bg-[#f8f7f2] border border-[#e5e3d8] rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-medium text-slate-700">{file.name}</span>
                    <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500 ml-2 transition-colors">&times;</button>
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
                  className="p-3 text-slate-400 hover:text-amber-600 hover:bg-[#f8f7f2] rounded-xl transition-all shrink-0 border border-transparent hover:border-[#e5e3d8]"
                  title="Attach CSV"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <textarea
                  className="w-full bg-transparent p-3 text-[15px] text-slate-800 placeholder-slate-400 focus:outline-none resize-none max-h-40 min-h-[48px] leading-relaxed custom-scrollbar"
                  rows={1}
                  placeholder={file ? "Instruct the Agent to analyze this data..." : "Attach a dataset or type a prompt..."}
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
          </div>
        </div>
        
      </div>

      {/* RIGHT SIDEBAR: Data Visualizations */}
      {activeData && (activeData.metrics?.length > 0 || activeData.charts?.length > 0 || activeData.headData || activeData.cleanedCsv) && (
        <div className="w-80 lg:w-[450px] h-full bg-[#f8f7f2] border-l border-[#e5e3d8] flex flex-col shadow-xl z-30 animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b border-[#e5e3d8] flex items-center justify-between bg-white">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-amber-600" />
              Workspace Data
            </h3>
            <button onClick={() => setActiveData(null)} className="text-slate-400 hover:text-slate-800 transition-colors">&times;</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
             
             {/* Metrics Panel */}
             {activeData.metrics && activeData.metrics.length > 0 && (
               <div className="space-y-3">
                 <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Metrics</h4>
                 <div className="grid grid-cols-2 gap-3">
                   {activeData.metrics.map((metric, idx) => (
                     <div key={idx} className="bg-white border border-[#e5e3d8] rounded-xl p-4 shadow-sm">
                       <div className="text-[11px] text-slate-500 uppercase tracking-wide mb-1 font-medium">{metric.label}</div>
                       <div className="text-2xl font-light text-slate-800">{metric.value}</div>
                     </div>
                   ))}
                 </div>
               </div>
             )}

             {/* Charts Panel */}
             {activeData.charts && activeData.charts.length > 0 ? (
               <div className="space-y-4">
                 <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Visualizations</h4>
                 {activeData.charts.map((chartItem, idx) => (
                   <div key={idx} className="bg-white border border-[#e5e3d8] rounded-xl p-5 flex flex-col h-[280px] shadow-sm">
                     {chartItem.title && <h4 className="text-[13px] font-medium text-slate-700 mb-4">{chartItem.title}</h4>}
                     <div className="flex-1 min-h-0 relative">
                       <div className="absolute inset-0">
                         <Chart chartConfig={chartItem} />
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               activeData.chart && activeData.chart.type !== 'none' && (
                 <div className="space-y-4">
                   <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Visualization</h4>
                   <div className="bg-white border border-[#e5e3d8] rounded-xl p-5 h-[280px] shadow-sm relative">
                     {activeData.chart.title && <h4 className="text-[13px] font-medium text-slate-700 mb-4">{activeData.chart.title}</h4>}
                     <div className="absolute inset-x-5 bottom-5 top-12">
                       <Chart chartConfig={activeData.chart} />
                     </div>
                   </div>
                 </div>
               )
             )}

             {/* Data Table */}
             {activeData.headData && (
               <div className="space-y-3">
                 <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Data Preview</h4>
                 <div className="overflow-x-auto rounded-xl border border-[#e5e3d8] bg-white shadow-sm custom-scrollbar">
                   <table className="min-w-full divide-y divide-[#e5e3d8] text-xs">
                     <thead className="bg-[#f8f7f2]">
                       <tr>
                         {activeData.headData.columns.map((col, idx) => (
                           <th key={idx} className="px-3 py-2.5 text-left font-medium text-slate-600 uppercase tracking-wide">{col}</th>
                         ))}
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-[#e5e3d8]">
                       {activeData.headData.rows.map((row, rowIdx) => (
                         <tr key={rowIdx} className="hover:bg-slate-50 transition-colors">
                           {row.map((cell, cellIdx) => (
                             <td key={cellIdx} className="px-3 py-2.5 whitespace-nowrap text-slate-700">{cell}</td>
                           ))}
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
             )}

             {/* Download */}
             {activeData.cleanedCsv && (
               <button onClick={() => downloadCsv(activeData.cleanedCsv)} className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm">
                 <Download className="w-4 h-4" />
                 Download Cleaned CSV
               </button>
             )}

          </div>
        </div>
      )}
    </div>
  );
}
