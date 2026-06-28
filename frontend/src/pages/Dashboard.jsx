import { useState, useRef, useEffect } from 'react';
import Chart from '../components/Chart';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Sparkles, Download, Paperclip, FileText, Menu, Plus, Activity, Database, LayoutDashboard, LogOut, ChevronDown, Search, PanelLeftClose, Edit, Bot, Grid, Clock, Library, FolderPlus, ListFilter, Code, Monitor, Mic, ArrowUp } from 'lucide-react';

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

      {/* LEFT SIDEBAR (Manus Clone) */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        transition-transform duration-300 ease-in-out
        absolute lg:relative z-40
        w-64 h-full bg-[#f9f9f9] border-r border-[#e5e3d8] flex flex-col shadow-xl lg:shadow-none
      `}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-serif font-bold text-lg text-slate-800">
            <Sparkles className="w-5 h-5 text-slate-800" /> scuzy
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Search className="w-4 h-4 cursor-pointer hover:text-slate-800 transition-colors" />
            <PanelLeftClose className="w-4 h-4 cursor-pointer hover:text-slate-800 transition-colors hidden lg:block" onClick={() => setSidebarOpen(false)} />
          </div>
        </div>

        {/* Primary Links */}
        <div className="px-3 py-2 space-y-1">
          <button onClick={startNewChat} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-[#ebebeb] transition-colors">
            <Edit className="w-4 h-4 text-slate-500" /> New task
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-[#ebebeb] transition-colors">
            <Bot className="w-4 h-4 text-slate-500" /> Agent
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-[#ebebeb] transition-colors">
            <Grid className="w-4 h-4 text-slate-500" /> Plugins
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-[#ebebeb] transition-colors">
            <Clock className="w-4 h-4 text-slate-500" /> Scheduled
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-[#ebebeb] transition-colors">
            <Library className="w-4 h-4 text-slate-500" /> Library
          </button>
        </div>

        {/* Projects */}
        <div className="px-3 py-2 mt-4">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Projects</span>
            <Plus className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-700 transition-colors" />
          </div>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-[#ebebeb] transition-colors">
            <FolderPlus className="w-4 h-4 text-slate-500" /> New project
          </button>
        </div>

        {/* Tasks (Chat History) */}
        <div className="flex-1 overflow-y-auto px-3 py-2 mt-4 custom-scrollbar">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Tasks</span>
            <ListFilter className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-700 transition-colors" />
          </div>
          <div className="space-y-0.5">
            {savedChats.map((chat) => (
              <button 
                key={chat.chat_id}
                onClick={() => loadSavedChat(chat)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors truncate
                  ${chatId === chat.chat_id ? 'bg-[#ebebeb] text-slate-900 font-medium' : 'text-slate-600 hover:bg-[#f2f2f2]'}`}
              >
                <div className="w-5 h-5 rounded bg-slate-300 shrink-0 flex items-center justify-center overflow-hidden">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <span className="truncate">{chat.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-[#e5e3d8] bg-[#f9f9f9] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center shrink-0 overflow-hidden text-white font-medium text-xs">
              {user?.picture ? (
                <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || 'P'
              )}
            </div>
            <span className="text-sm font-medium text-slate-700 truncate">{user?.name || 'pruthivi raj'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
             <Monitor className="w-4 h-4 hover:text-slate-700 transition-colors cursor-pointer" />
             <LogOut onClick={logout} className="w-4 h-4 hover:text-red-500 transition-colors cursor-pointer" title="Log out" />
          </div>
        </div>
      </div>

      {/* CENTER CHAT AREA */}
      <div className="flex-1 flex flex-col items-center w-full h-full relative">
        {/* Top Bar */}
        <div className="w-full p-4 flex items-center justify-between absolute top-0 z-20 pointer-events-none">
          {!sidebarOpen && (
             <button onClick={() => setSidebarOpen(true)} className="pointer-events-auto p-2 bg-white border border-[#e5e3d8] rounded-md shadow-sm">
               <Menu className="w-4 h-4 text-slate-600" />
             </button>
          )}
          <div className={`pointer-events-auto flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${!sidebarOpen ? 'ml-4' : 'ml-0'}`}>
             SCUZY 1.6 Lite <ChevronDown className="w-3.5 h-3.5 opacity-50" />
          </div>
          <div className="pointer-events-auto flex items-center gap-1 text-sm font-medium text-slate-600 bg-white border border-[#e5e3d8] px-3 py-1.5 rounded-full shadow-sm">
             <Sparkles className="w-3.5 h-3.5 text-slate-400" /> 1,185
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 w-full max-w-4xl overflow-y-auto p-4 md:p-8 pt-20 custom-scrollbar scroll-smooth flex flex-col z-10">
          {chatHistory.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-700 pb-20">
              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                Free plan <span className="text-[#e5e3d8]">|</span> <span className="text-blue-500 cursor-pointer">Upgrade</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif text-slate-800 text-center tracking-tight">What can I do for you?</h2>
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
                    
                    {/* Advanced Execution Timeline (Manus Style) */}
                    {(chat.result.operationsLog?.length > 0 || chat.result.metrics?.length > 0 || chat.result.charts?.length > 0 || (chat.result.chart && chat.result.chart.type !== 'none') || chat.result.cleanedCsv) && (
                      <details className="group bg-white border border-[#e5e3d8] rounded-xl text-[13px] text-slate-600 shadow-sm w-full max-w-xl overflow-hidden cursor-pointer open:pb-2">
                        <summary className="flex items-center gap-3 p-3 hover:bg-[#f8f7f2] transition-colors select-none font-medium text-slate-700">
                          <Activity className="w-4 h-4 text-slate-400 group-open:text-amber-600 transition-colors" />
                          <span>Finished {chat.result.operationsLog?.length || 1} agent operations</span>
                          <span className="ml-auto flex items-center gap-2">
                            <button 
                              onClick={(e) => { e.preventDefault(); setActiveData(chat.result); }}
                              className="bg-white border border-[#e5e3d8] hover:border-amber-300 hover:bg-amber-50 px-2.5 py-1 rounded transition-colors text-amber-700 flex items-center gap-1.5 shadow-sm text-xs font-semibold"
                            >
                              <LayoutDashboard className="w-3.5 h-3.5"/> View Data
                            </button>
                            <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform duration-200" />
                          </span>
                        </summary>
                        <div className="px-10 py-2 space-y-3 relative before:absolute before:inset-y-3 before:left-[1.375rem] before:w-[2px] before:bg-[#f3f2eb]">
                           {chat.result.operationsLog?.map((op, i) => (
                              <div key={i} className="relative flex items-center gap-3 text-slate-500">
                                 <div className="absolute -left-6 w-2 h-2 rounded-full bg-slate-300 border-2 border-white"></div>
                                 <span className="capitalize">{op.replace(/_/g, ' ')}</span>
                              </div>
                           ))}
                           {chat.result.metrics?.length > 0 && (
                              <div className="relative flex items-center gap-3 text-slate-500">
                                 <div className="absolute -left-6 w-2 h-2 rounded-full bg-amber-400 border-2 border-white ring-2 ring-amber-100"></div>
                                 <span>Calculated ML metrics</span>
                              </div>
                           )}
                           {chat.result.charts?.length > 0 && (
                              <div className="relative flex items-center gap-3 text-slate-500">
                                 <div className="absolute -left-6 w-2 h-2 rounded-full bg-blue-400 border-2 border-white ring-2 ring-blue-100"></div>
                                 <span>Generated {chat.result.charts.length} chart visualizations</span>
                              </div>
                           )}
                           {(chat.result.operationsLog?.length === 0 || !chat.result.operationsLog) && !chat.result.metrics && !chat.result.charts && (
                              <div className="relative flex items-center gap-3 text-slate-500">
                                 <div className="absolute -left-6 w-2 h-2 rounded-full bg-slate-300 border-2 border-white"></div>
                                 <span>Analyzed dataset context</span>
                              </div>
                           )}
                        </div>
                      </details>
                    )}

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

        {/* Floating Input Area (Manus Style) */}
        <div className={`absolute left-0 right-0 flex flex-col items-center px-4 md:px-8 z-20 pointer-events-none transition-all duration-500 ${chatHistory.length === 0 ? 'top-1/2 -translate-y-12' : 'bottom-6'}`}>
          <div className="w-full max-w-3xl pointer-events-auto">
            {error && <div className="mb-4 text-red-700 text-sm font-medium px-4 bg-red-50 rounded-lg py-2 border border-red-200 w-fit mx-auto shadow-sm">{error}</div>}
            
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-[#e5e3d8] transition-all p-3 flex flex-col relative overflow-hidden">
              
              {file && (
                <div className="flex items-center gap-2 mb-3 px-2">
                  <div className="bg-[#f8f7f2] border border-[#e5e3d8] rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm">
                     <FileText className="w-4 h-4 text-slate-500" />
                     <span className="text-xs font-medium text-slate-700">{file.name}</span>
                     <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500 ml-2 transition-colors">&times;</button>
                  </div>
                </div>
              )}

              <textarea
                className="w-full bg-transparent px-3 pt-3 pb-12 text-[15px] text-slate-800 placeholder-slate-400 focus:outline-none resize-none max-h-48 min-h-[60px] leading-relaxed custom-scrollbar"
                rows={1}
                placeholder={file ? "Instruct the Agent to analyze this data..." : "Assign a task or type / for more"}
                value={question}
                onChange={e => {
                  setQuestion(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAnalyze();
                  }
                }}
              />

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-white pt-2">
                 <div className="flex items-center gap-1.5">
                    <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f2f2f2] text-slate-500 transition-colors border border-[#e5e3d8]">
                      <Plus className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f2f2f2] text-slate-500 transition-colors border border-[#e5e3d8]">
                      <Code className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f2f2f2] text-slate-500 transition-colors border border-[#e5e3d8]">
                      <Monitor className="w-4 h-4" />
                    </button>
                 </div>
                 
                 <div className="flex items-center gap-1.5">
                    <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f2f2f2] text-slate-400 transition-colors">
                      <Activity className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f2f2f2] text-slate-400 transition-colors">
                      <Mic className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={handleAnalyze}
                      disabled={!question}
                      className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${question ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-[#f2f2f2] text-slate-400'}`}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                 </div>
              </div>
            </div>
            
            {/* Suggestion Pills */}
            {chatHistory.length === 0 && !loading && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e5e3d8] rounded-full text-sm text-slate-600 hover:bg-[#f8f7f2] shadow-sm transition-colors">
                   <Database className="w-4 h-4" /> Analyze Data
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e5e3d8] rounded-full text-sm text-slate-600 hover:bg-[#f8f7f2] shadow-sm transition-colors">
                   <LayoutDashboard className="w-4 h-4" /> Build Dashboards
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e5e3d8] rounded-full text-sm text-slate-600 hover:bg-[#f8f7f2] shadow-sm transition-colors">
                   <Activity className="w-4 h-4" /> Train ML Models
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e5e3d8] rounded-full text-sm text-slate-600 hover:bg-[#f8f7f2] shadow-sm transition-colors">
                   <Sparkles className="w-4 h-4" /> Design
                </button>
                <button className="px-4 py-2 bg-white border border-[#e5e3d8] rounded-full text-sm text-slate-600 hover:bg-[#f8f7f2] shadow-sm transition-colors">
                   More
                </button>
              </div>
            )}
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
