import React, { useState } from 'react';
import AnalysisView from './components/AnalysisView';
import ChatInterface from './components/ChatInterface';
import Button from './components/Button';

type View = 'home' | 'analysis' | 'chat';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => setCurrentView('home')}>
              <div className="bg-teal-600 rounded-lg p-1.5 mr-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="font-bold text-xl text-slate-800 tracking-tight">Pre Vet Scan</span>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setCurrentView('home')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'home' ? 'text-teal-600 bg-teal-50' : 'text-slate-600 hover:text-teal-600'}`}
              >
                Home
              </button>
              <button 
                onClick={() => setCurrentView('analysis')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'analysis' ? 'text-teal-600 bg-teal-50' : 'text-slate-600 hover:text-teal-600'}`}
              >
                Checkup
              </button>
              <button 
                onClick={() => setCurrentView('chat')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'chat' ? 'text-teal-600 bg-teal-50' : 'text-slate-600 hover:text-teal-600'}`}
              >
                Chat
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow bg-slate-50">
        {currentView === 'home' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
                Don't wait for the claim denial. <br />
                <span className="text-teal-600">Prevent the bill.</span>
              </h1>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Traditional insurance reacts after your pet is sick. We use AI visual analysis to catch issues early, saving you thousands in surgery costs that insurance might not even cover.
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Button onClick={() => setCurrentView('analysis')} className="text-lg px-8 shadow-teal-500/30">
                  Start Health Scan
                </Button>
                <Button variant="secondary" onClick={() => setCurrentView('chat')} className="text-lg px-8">
                  Get Unbiased Opinion
                </Button>
              </div>
            </div>

            {/* Differentiator Comparison */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 mb-20">
              <div className="grid md:grid-cols-2">
                <div className="p-8 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100">
                   <h3 className="text-lg font-bold text-slate-500 mb-4 uppercase tracking-wider">Traditional Insurance</h3>
                   <ul className="space-y-4">
                     <li className="flex items-center text-slate-500">
                       <svg className="w-5 h-5 mr-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                       Reacts only after pet is sick
                     </li>
                     <li className="flex items-center text-slate-500">
                       <svg className="w-5 h-5 mr-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                       Incentivized to deny claims
                     </li>
                     <li className="flex items-center text-slate-500">
                       <svg className="w-5 h-5 mr-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                       Paperwork & waiting periods
                     </li>
                   </ul>
                </div>
                <div className="p-8 bg-teal-50/50">
                   <h3 className="text-lg font-bold text-teal-800 mb-4 uppercase tracking-wider">Pre Vet Scan</h3>
                   <ul className="space-y-4">
                     <li className="flex items-center text-slate-800 font-medium">
                       <svg className="w-5 h-5 mr-3 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                       Proactive prevention & early detection
                     </li>
                     <li className="flex items-center text-slate-800 font-medium">
                       <svg className="w-5 h-5 mr-3 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                       Unbiased "Second Opinion" AI
                     </li>
                     <li className="flex items-center text-slate-800 font-medium">
                       <svg className="w-5 h-5 mr-3 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                       Instant triage & Financial Forecasting
                     </li>
                   </ul>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon="🦷"
                title="Dental Health" 
                desc="Snap a photo of teeth. We calculate the cost savings of treating gingivitis now vs extraction later." 
              />
              <FeatureCard 
                icon="👁️"
                title="Eye Clarity" 
                desc="Monitor cloudiness or discharge. Get instant feedback on whether it's an emergency." 
              />
              <FeatureCard 
                icon="⚖️"
                title="Unbiased Advice" 
                desc="Our AI has no financial stake in your pet's care. Just pure, data-driven health guidance." 
              />
            </div>
            
             <div className="mt-20 bg-white rounded-2xl p-8 shadow-xl border border-slate-100 flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
                <span className="text-teal-600 font-bold uppercase tracking-wider text-sm mb-2 block">Deep Reasoning Mode</span>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Complex questions? We think deeper.</h3>
                <p className="text-slate-600 mb-6">
                  Our new 'Deep Thinking' chat mode uses advanced reasoning (Gemini 3 Pro) to tackle complicated health histories and symptoms that simple bots miss.
                </p>
                <Button variant="outline" onClick={() => setCurrentView('chat')}>Try Thinking Mode</Button>
              </div>
              <div className="md:w-1/2 bg-slate-100 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-teal-100 rounded-full opacity-50"></div>
                 <div className="space-y-3">
                   <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm text-sm text-slate-700 w-3/4">
                     My vet quoted $3000 for TPLO surgery. Is this standard?
                   </div>
                   <div className="bg-teal-600 p-3 rounded-lg rounded-tr-none shadow-sm text-sm text-white w-5/6 ml-auto">
                     <div className="flex items-center text-teal-100 text-xs mb-1">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"/></svg>
                        Unbiased Analysis...
                     </div>
                     TPLO ranges $2500-$5500 nationwide. $3k is reasonable. However, have you considered conservative management/CM? For dogs under 40lbs, success rate is...
                   </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'analysis' && <AnalysisView onBack={() => setCurrentView('home')} />}
        
        {currentView === 'chat' && <ChatInterface onBack={() => setCurrentView('home')} />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="mb-2">© 2024 Pre Vet Scan.</p>
          <p className="text-sm">
            Disclaimer: This tool provides information, not medical diagnosis. Always consult a veterinarian for medical advice.
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: string; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
    <p className="text-slate-600">{desc}</p>
  </div>
);

export default App;