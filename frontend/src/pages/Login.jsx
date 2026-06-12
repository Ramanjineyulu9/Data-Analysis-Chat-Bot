import { useAuth } from '../hooks/useAuth';
import { LineChart, Sparkles } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-1 bg-slate-50 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 z-0 flex justify-center items-center overflow-hidden pointer-events-none">
        <div className="w-[500px] h-[500px] bg-blue-400/20 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/4"></div>
        <div className="w-[400px] h-[400px] bg-purple-400/20 blur-[120px] rounded-full -translate-x-1/3 translate-y-1/4"></div>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8 relative z-10">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white/80 backdrop-blur-xl py-12 px-8 shadow-2xl rounded-3xl border border-white/50 text-center">
            
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-blue-100 rounded-2xl">
                <LineChart className="w-10 h-10 text-blue-600" />
              </div>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
              Welcome back
            </h2>
            <p className="text-slate-500 mb-10 text-sm">
              Sign in to continue to Datawise AI
            </p>

            <button
              onClick={login}
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 hover:ring-slate-400 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>

            <div className="mt-8 pt-6 border-t flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Join 10,000+ data professionals today
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
