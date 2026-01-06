import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import AnalysisView from './components/AnalysisView';
import ChatInterface from './components/ChatInterface';
import Auth from './components/Auth';
import Button from './components/Button';
import { AppState } from './types';

function App() {
  const [appState, setAppState] = useState<AppState>({ view: 'home' });
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAppState({ view: 'home' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={() => setAppState({ view: 'home' })} />;
  }

  // Home view (inline landing page)
  if (appState.view === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-slate-800">PreVetScan</h1>
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm text-slate-600 hover:text-slate-800 bg-white px-4 py-2 rounded-lg shadow"
            >
              Sign Out
            </button>
          </div>

          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Don't wait for the claim denial.<br />
              <span className="text-teal-600">Prevent the bill.</span>
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              AI-powered health screening for your pet. Know what you're looking at before the vet visit.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Health Checkup</h3>
              <p className="text-slate-600 mb-6">
                Upload a photo of your pet's teeth, skin, eyes, or gait for an AI-powered health assessment.
              </p>
              <Button onClick={() => setAppState({ view: 'analysis' })} className="w-full">
                Start Checkup
              </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Chat with Nora</h3>
              <p className="text-slate-600 mb-6">
                Ask Nora questions about symptoms, audit vet quotes, or get second opinions on treatment options.
              </p>
              <Button onClick={() => setAppState({ view: 'chat' })} variant="secondary" className="w-full">
                Start Chat
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Other views
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-100">
      {appState.view === 'analysis' && (
        <AnalysisView onBack={() => setAppState({ view: 'home' })} />
      )}
      {appState.view === 'chat' && (
        <ChatInterface onBack={() => setAppState({ view: 'home' })} />
      )}
    </div>
  );
}

export default App;