import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Sparkles, BarChart3, Database, MessageSquare, Lock, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockData = [
  { name: 'Jan', revenue: 4000, users: 2400 },
  { name: 'Feb', revenue: 3000, users: 1398 },
  { name: 'Mar', revenue: 5000, users: 9800 },
  { name: 'Apr', revenue: 4500, users: 3908 },
  { name: 'May', revenue: 6000, users: 4800 },
  { name: 'Jun', revenue: 7500, users: 3800 },
  { name: 'Jul', revenue: 8500, users: 4300 },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="bg-[#FDFCF8] overflow-hidden min-h-screen font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Hero Section */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-24 pb-24 lg:px-8 lg:pt-32">
        <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
          
          {/* Hero Text */}
          <div className="lg:col-span-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#e8e6dc] text-slate-700 font-medium text-xs tracking-wide uppercase mb-8 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Powered by Llama 3 on Groq
            </div>
            <h1 className="text-5xl font-serif text-slate-800 sm:text-6xl mb-8 leading-tight">
              SCUZY: A thoughtful approach to <span className="italic text-amber-700">data analysis.</span>
            </h1>
            <p className="text-lg leading-relaxed text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0">
              Upload your CSV files and converse with an autonomous Data Agent. No formulas, no code. Just intelligent, instant insights and beautiful visual charts.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              {user ? (
                <Link to="/dashboard" className="w-full sm:w-auto rounded-lg bg-slate-800 px-8 py-3.5 text-sm font-medium text-white shadow-sm hover:bg-slate-700 transition-colors">
                  Open Dashboard
                </Link>
              ) : (
                <Link to="/login" className="w-full sm:w-auto rounded-lg bg-slate-800 px-8 py-3.5 text-sm font-medium text-white shadow-sm hover:bg-slate-700 transition-colors">
                  Start Analyzing Free
                </Link>
              )}
              <a href="#features" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors px-4 py-3.5">
                Explore capabilities
              </a>
            </div>
          </div>

          {/* Hero Image/Chart */}
          <div className="lg:col-span-6 mt-16 lg:mt-0 hidden md:block">
            <div className="rounded-2xl bg-white border border-[#e5e3d8] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#e5e3d8]">
                <div>
                  <h3 className="font-serif text-xl text-slate-800">Revenue Trajectory</h3>
                  <p className="text-sm text-slate-500">Year-to-Date Performance</p>
                </div>
                <div className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-sm font-medium">
                  +12.5% Growth
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f2eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dx={-10} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e3d8', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', backgroundColor: '#fff' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#d97706" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 bg-[#f8f7f2] rounded-xl p-5 border border-[#e5e3d8] flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <p className="text-[15px] text-slate-700 leading-relaxed">
                  Based on the current trajectory, revenue is projected to stabilize around $10k by August. The highest growth occurred between May and June.
                </p>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-white border-y border-[#e5e3d8]">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center mb-20">
            <h2 className="text-sm font-medium tracking-widest uppercase text-amber-700 mb-4">Capabilities</h2>
            <p className="text-3xl font-serif text-slate-800 sm:text-4xl">
              An intelligent companion for your data.
            </p>
          </div>
          <div className="grid max-w-xl grid-cols-1 gap-x-12 gap-y-16 lg:max-w-none lg:grid-cols-3">
            
            <div className="flex flex-col items-start group">
              <div className="rounded-xl bg-[#f8f7f2] border border-[#e5e3d8] p-4 mb-6 group-hover:border-amber-300 transition-colors">
                <MessageSquare className="h-6 w-6 text-slate-700" />
              </div>
              <h3 className="text-lg font-serif text-slate-800 mb-3">Natural Language</h3>
              <p className="text-slate-600 leading-relaxed text-[15px]">
                Ask questions in plain English. The agent autonomously writes Python-level scripts in the background to inspect your data and deliver exact answers.
              </p>
            </div>

            <div className="flex flex-col items-start group">
              <div className="rounded-xl bg-[#f8f7f2] border border-[#e5e3d8] p-4 mb-6 group-hover:border-amber-300 transition-colors">
                <BarChart3 className="h-6 w-6 text-slate-700" />
              </div>
              <h3 className="text-lg font-serif text-slate-800 mb-3">Dynamic Charts</h3>
              <p className="text-slate-600 leading-relaxed text-[15px]">
                The agent intelligently decides when to visualize your data, automatically constructing beautiful Recharts layouts directly in your chat interface.
              </p>
            </div>

            <div className="flex flex-col items-start group">
              <div className="rounded-xl bg-[#f8f7f2] border border-[#e5e3d8] p-4 mb-6 group-hover:border-amber-300 transition-colors">
                <Database className="h-6 w-6 text-slate-700" />
              </div>
              <h3 className="text-lg font-serif text-slate-800 mb-3">Autonomous Cleaning</h3>
              <p className="text-slate-600 leading-relaxed text-[15px]">
                Instruct the agent to clean missing values or filter out outliers. It will process the dataset and provide a sanitized CSV for you to download instantly.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-24 sm:py-32 bg-[#f8f7f2]">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-serif text-slate-800 sm:text-4xl">Pricing Plans</h2>
            <p className="mt-4 text-slate-500">Choose the level of intelligence you need.</p>
          </div>
          <div className="mx-auto grid max-w-lg grid-cols-1 gap-y-6 sm:mt-10 lg:max-w-4xl lg:grid-cols-2 lg:gap-x-8">
            
            {/* Free Tier */}
            <div className="flex flex-col justify-between rounded-2xl bg-white border border-[#e5e3d8] p-8 sm:p-10 shadow-sm">
              <div>
                <h3 className="text-lg font-serif text-slate-800">Basic</h3>
                <p className="mt-2 text-sm text-slate-500">A thoughtful introduction to agentic analysis.</p>
                <div className="mt-8 flex items-baseline gap-x-1">
                  <span className="text-4xl font-serif text-slate-800">$0</span>
                  <span className="text-sm font-medium text-slate-500">/month</span>
                </div>
                <ul className="mt-8 space-y-4 text-sm text-slate-600">
                  <li className="flex gap-x-3"><Lock className="h-5 w-5 flex-none text-slate-400" /> Up to 3 analysis queries per month</li>
                  <li className="flex gap-x-3"><BarChart3 className="h-5 w-5 flex-none text-slate-400" /> Basic visual charting</li>
                </ul>
              </div>
              <Link to="/login" className="mt-8 block rounded-lg bg-[#f8f7f2] border border-[#e5e3d8] px-3 py-3 text-center text-sm font-medium text-slate-700 hover:bg-[#e8e6dc] transition-colors">Start Free</Link>
            </div>
            
            {/* Pro Tier */}
            <div className="flex flex-col justify-between rounded-2xl bg-slate-800 p-8 sm:p-10 shadow-md ring-1 ring-slate-700">
              <div>
                <h3 className="text-lg font-serif text-white">Pro</h3>
                <p className="mt-2 text-sm text-slate-400">Unlimited power for serious professionals.</p>
                <div className="mt-8 flex items-baseline gap-x-1">
                  <span className="text-4xl font-serif text-white">$9</span>
                  <span className="text-sm font-medium text-slate-400">/month</span>
                </div>
                <ul className="mt-8 space-y-4 text-sm text-slate-300">
                  <li className="flex gap-x-3"><Zap className="h-5 w-5 flex-none text-amber-500" /> Unlimited autonomous queries</li>
                  <li className="flex gap-x-3"><BarChart3 className="h-5 w-5 flex-none text-amber-500" /> Advanced charts & deep insights</li>
                  <li className="flex gap-x-3"><Database className="h-5 w-5 flex-none text-amber-500" /> Data export & algorithmic cleaning</li>
                </ul>
              </div>
              <Link to="/login" className="mt-8 block rounded-lg bg-amber-600 px-3 py-3 text-center text-sm font-medium text-white hover:bg-amber-500 transition-colors">Upgrade to Pro</Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
