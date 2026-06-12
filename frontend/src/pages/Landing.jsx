import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BarChart3, Zap, Lock } from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Your AI Data Analyst
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Upload your CSV files and ask questions in plain English. Get instant insights, beautiful charts, and follow-up suggestions powered by the lightning-fast Llama 3 AI.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {user ? (
                <Link to="/dashboard" className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
                  Go to Dashboard
                </Link>
              ) : (
                <Link to="/login" className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
                  Get Started for Free
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="py-24 sm:py-32 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Simple, transparent pricing</h2>
          </div>
          <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-y-6 sm:mt-20 lg:max-w-4xl lg:grid-cols-2 lg:gap-x-8">
            <div className="flex flex-col justify-between rounded-3xl bg-white p-8 shadow-xl ring-1 ring-gray-200 xl:p-10">
              <div>
                <h3 className="text-lg font-semibold leading-8 text-gray-900">Free</h3>
                <p className="mt-4 text-sm leading-6 text-gray-600">Perfect for trying out DataWise.</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">$0</span>
                  <span className="text-sm font-semibold leading-6 text-gray-600">/month</span>
                </p>
                <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                  <li className="flex gap-x-3"><Lock className="h-6 w-5 flex-none text-blue-600" /> 3 queries per month</li>
                  <li className="flex gap-x-3"><BarChart3 className="h-6 w-5 flex-none text-blue-600" /> Basic charts</li>
                </ul>
              </div>
              <Link to="/login" className="mt-8 block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold leading-6 text-white hover:bg-blue-500 shadow-sm">Get started</Link>
            </div>
            
            <div className="flex flex-col justify-between rounded-3xl bg-gray-900 p-8 shadow-xl ring-1 ring-gray-900 xl:p-10">
              <div>
                <h3 className="text-lg font-semibold leading-8 text-white">Pro</h3>
                <p className="mt-4 text-sm leading-6 text-gray-300">Unlimited power for data professionals.</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-white">$9</span>
                  <span className="text-sm font-semibold leading-6 text-gray-300">/month</span>
                </p>
                <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-300">
                  <li className="flex gap-x-3"><Zap className="h-6 w-5 flex-none text-blue-400" /> Unlimited queries</li>
                  <li className="flex gap-x-3"><BarChart3 className="h-6 w-5 flex-none text-blue-400" /> Advanced charts & insights</li>
                </ul>
              </div>
              <Link to="/login" className="mt-8 block rounded-md bg-white px-3 py-2 text-center text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-100 shadow-sm">Upgrade to Pro</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
