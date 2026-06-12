import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BarChart3, Zap, Lock, Sparkles, MessageSquare, Database } from 'lucide-react';
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
    <div className="bg-slate-50 overflow-hidden">
      
      {/* Background Glow Effects */}
      <div className="absolute inset-x-0 top-0 z-0 flex justify-center overflow-hidden pointer-events-none">
        <div className="w-[800px] h-[500px] bg-blue-400/20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="w-[600px] h-[400px] bg-purple-400/20 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-24 lg:px-8 lg:pt-32">
        <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
          
          {/* Hero Text */}
          <div className="lg:col-span-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm mb-6">
              <Sparkles className="w-4 h-4" /> Powered by Llama 3 AI
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl mb-6">
              Your autonomous <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">AI Data Analyst</span>
            </h1>
            <p className="text-lg leading-8 text-slate-600 mb-8">
              Stop fighting with Excel formulas. Upload your CSV files and ask questions in plain English. Get instant insights, automated data cleaning, and beautiful interactive charts in seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              {user ? (
                <Link to="/dashboard" className="w-full sm:w-auto rounded-xl bg-blue-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-500 transition-all">
                  Go to Dashboard
                </Link>
              ) : (
                <Link to="/login" className="w-full sm:w-auto rounded-xl bg-slate-900 px-8 py-3.5 text-base font-bold text-white shadow-lg hover:bg-slate-800 transition-all">
                  Get Started for Free
                </Link>
              )}
              <a href="#features" className="text-sm font-semibold leading-6 text-slate-900 hover:text-blue-600 transition-colors">
                See how it works <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          {/* Hero Image/Chart */}
          <div className="lg:col-span-6 mt-16 lg:mt-0 hidden md:block">
            <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white p-6 shadow-2xl ring-1 ring-slate-900/5">
              <div className="flex items-center justify-between mb-6 border-b pb-4">
                <div>
                  <h3 className="font-bold text-slate-900">Revenue Growth</h3>
                  <p className="text-sm text-slate-500">Predicted vs Actual (YTD)</p>
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-bold">+12.5%</div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                <p className="text-sm text-slate-700 font-medium">
                  <span className="font-bold text-blue-900">AI Insight:</span> Revenue is projected to hit $10k by August based on the current 12.5% MoM growth trajectory.
                </p>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-white relative z-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Everything you need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Data Science without the code
            </p>
          </div>
          <div className="mx-auto max-w-2xl lg:max-w-none">
            <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              
              <div className="flex flex-col items-start">
                <div className="rounded-xl bg-blue-100 p-3 mb-4">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Natural Language</h3>
                <p className="text-slate-600 leading-relaxed">
                  Just ask questions like "What was the highest selling product in Q3?" and the AI instantly analyzes your entire dataset to find the exact answer.
                </p>
              </div>

              <div className="flex flex-col items-start">
                <div className="rounded-xl bg-purple-100 p-3 mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Instant Visualization</h3>
                <p className="text-slate-600 leading-relaxed">
                  The AI automatically decides the best way to visualize your data (Bar, Line, Pie, Area) and builds beautiful interactive charts on the fly.
                </p>
              </div>

              <div className="flex flex-col items-start">
                <div className="rounded-xl bg-green-100 p-3 mb-4">
                  <Database className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Automated Cleaning</h3>
                <p className="text-slate-600 leading-relaxed">
                  Tell the AI to "remove duplicates" or "drop missing values" and it physically cleans your CSV file, letting you download the perfect, polished dataset.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-24 sm:py-32 bg-slate-900 relative z-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Simple, transparent pricing</h2>
          </div>
          <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-y-6 sm:mt-20 lg:max-w-4xl lg:grid-cols-2 lg:gap-x-8">
            <div className="flex flex-col justify-between rounded-3xl bg-slate-800 p-8 shadow-xl ring-1 ring-white/10 xl:p-10">
              <div>
                <h3 className="text-lg font-semibold leading-8 text-white">Free</h3>
                <p className="mt-4 text-sm leading-6 text-slate-300">Perfect for trying out DataWise.</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-white">$0</span>
                  <span className="text-sm font-semibold leading-6 text-slate-400">/month</span>
                </p>
                <ul className="mt-8 space-y-3 text-sm leading-6 text-slate-300">
                  <li className="flex gap-x-3"><Lock className="h-6 w-5 flex-none text-blue-400" /> 3 queries per month</li>
                  <li className="flex gap-x-3"><BarChart3 className="h-6 w-5 flex-none text-blue-400" /> Basic charts</li>
                </ul>
              </div>
              <Link to="/login" className="mt-8 block rounded-xl bg-slate-700 px-3 py-3 text-center text-sm font-bold leading-6 text-white hover:bg-slate-600 transition-colors">Get started</Link>
            </div>
            
            <div className="flex flex-col justify-between rounded-3xl bg-gradient-to-b from-blue-600 to-indigo-600 p-8 shadow-2xl ring-1 ring-blue-500 xl:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <h3 className="text-lg font-semibold leading-8 text-white">Pro</h3>
                <p className="mt-4 text-sm leading-6 text-blue-100">Unlimited power for data professionals.</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-white">$9</span>
                  <span className="text-sm font-semibold leading-6 text-blue-200">/month</span>
                </p>
                <ul className="mt-8 space-y-3 text-sm leading-6 text-white">
                  <li className="flex gap-x-3"><Zap className="h-6 w-5 flex-none text-white" /> Unlimited queries</li>
                  <li className="flex gap-x-3"><BarChart3 className="h-6 w-5 flex-none text-white" /> Advanced charts & insights</li>
                  <li className="flex gap-x-3"><Database className="h-6 w-5 flex-none text-white" /> Data export & cleaning</li>
                </ul>
              </div>
              <Link to="/login" className="relative z-10 mt-8 block rounded-xl bg-white px-3 py-3 text-center text-sm font-bold leading-6 text-blue-600 hover:bg-slate-50 transition-colors">Upgrade to Pro</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
