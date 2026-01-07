import React, { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { supabase } from '../lib/supabase';
import Button from './Button';

interface AuthProps {
  onAuthSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Turnstile token (only required for Sign Up)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Site key must be exposed to the browser (Vite requires VITE_ prefix)
  const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string) ?? '';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // If user is signing up, require Turnstile token
      if (isSignUp) {
        if (!TURNSTILE_SITE_KEY) {
          throw new Error('Turnstile site key is missing. Set VITE_TURNSTILE_SITE_KEY in your environment variables.');
        }
        if (!turnstileToken) {
          setLoading(false);
          setMessage('Please confirm you are human.');
          return;
        }

        // NOTE: This only checks token exists. Real protection requires server-side verification.
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          // You said you don't want verification friction, but Supabase may still email depending on settings.
          setMessage('Success! Your account was created.');
        }
      } else {
        console.log('Attempting sign in with:', email);

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        console.log('Auth response:', { error, userExists: !!data?.user });

        if (error) {
          console.error('Auth error:', error);
          throw error;
        }

        if (data.user) {
          onAuthSuccess();
        }
      }
    } catch (error: any) {
      console.error('Full error object:', error);
      setMessage(error?.message || error?.toString?.() || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">PreVetScan</h2>
          <p className="text-slate-500 mt-2">{isSignUp ? 'Create your account' : 'Welcome back'}</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                placeholder="John Doe"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              placeholder="••••••••"
            />
          </div>

          {/* Turnstile only on Sign Up */}
          {isSignUp && (
            <div className="pt-2">
              {TURNSTILE_SITE_KEY ? (
                <Turnstile
                  siteKey={TURNSTILE_SITE_KEY}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => setTurnstileToken(null)}
                />
              ) : (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                  Missing <code>VITE_TURNSTILE_SITE_KEY</code>. Add it to your environment variables.
                </div>
              )}
            </div>
          )}

          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.includes('Success')
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message}
            </div>
          )}

          <Button type="submit" disabled={loading} isLoading={loading} className="w-full">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage('');
              setTurnstileToken(null); // reset token when toggling modes
            }}
            className="text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        {!isSignUp && (
          <div className="mt-4 pt-4 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500">New users get 1 free scan to try PreVetScan!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
