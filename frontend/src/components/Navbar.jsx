import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { LineChart, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, login, logout } = useAuth();

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <LineChart className="w-8 h-8 text-blue-600" />
            <span className="font-bold text-xl tracking-tight">DataWise</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900">Dashboard</Link>
                <div className="flex items-center space-x-2 ml-4 pl-4 border-l">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
                  ) : (
                    <User className="w-6 h-6 text-slate-400" />
                  )}
                  <span className="text-sm font-medium">{user.name}</span>
                  {user.plan === 'pro' && (
                    <span className="px-2 py-1 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full">PRO</span>
                  )}
                  <button onClick={logout} className="p-2 text-slate-400 hover:text-slate-600">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <button 
                onClick={login}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
