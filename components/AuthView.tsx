import React, { useState } from 'react';
import { authService } from '../services/authService';
import { UserSession } from '../types';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

interface AuthViewProps {
  onLogin: (user: UserSession) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let user: UserSession;
      if (isLogin) {
        user = await authService.login(email, password);
      } else {
        user = await authService.signup(name, email, password);
      }
      onLogin(user);
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-6">
      <div className="w-full max-w-md animate-fade-in-up">
        
        {/* Logo / Header */}
        <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg shadow-rose-500/20 mb-6 overflow-hidden">
                <img src="https://iili.io/fC1i0s1.md.jpg" alt="Flow Index Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Flow Index</h1>
            <p className="text-gray-500 dark:text-gray-400">Your private, intelligent health companion.</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-purple-500/5 p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>

            {error && (
                <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300 text-sm font-bold rounded-xl flex items-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                
                {!isLogin && (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide ml-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input 
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-gray-900 dark:text-white transition-all font-medium placeholder-gray-400 outline-none"
                                placeholder="Jane Doe"
                                required={!isLogin}
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide ml-1">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-gray-900 dark:text-white transition-all font-medium placeholder-gray-400 outline-none"
                            placeholder="hello@example.com"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide ml-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-gray-900 dark:text-white transition-all font-medium placeholder-gray-400 outline-none"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 mt-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold shadow-lg shadow-gray-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center text-lg disabled:opacity-70 disabled:hover:scale-100"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <>
                            {isLogin ? 'Sign In' : 'Create Account'}
                            <ArrowRight size={20} className="ml-2" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button 
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        className="ml-2 text-rose-500 hover:text-rose-600 font-bold"
                    >
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </p>
            </div>
        </div>
        
        <p className="text-center text-gray-400 text-xs mt-8">
            © {new Date().getFullYear()} Flow Index. All rights reserved.
        </p>
      </div>
    </div>
  );
};