import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import AnalysisView from './components/AnalysisView';
import ChatInterface from './components/ChatInterface';
import Auth from './components/Auth';
import Button from './components/Button';
import { AppState } from './types';

type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string;
  age_years: number;
  age_months: number;
  weight_lbs: number;
};

type Scan = {
  id: string;
  pet_name: string;
  category: string;
  severity: string;
  title: string;
  observations: string;
  created_at: string;
};

function App() {
  const [appState, setAppState] = useState<AppState>({ view: 'home' });
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<number>(0);
  const [creditsExpireAt, setCreditsExpireAt] = useState<Date | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showZeroCreditsModal, setShowZeroCreditsModal] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [showAddPet, setShowAddPet] = useState(false);

 // Fetch credits and expiration
const fetchCredits = async () => {
  if (!user) return;
  
  const { data: creditsData } = await supabase.rpc('get_user_credits', { 
    p_user_id: user.id 
  });

  const { data: expirationData } = await supabase.rpc('get_user_credit_expiration', {
    p_user_id: user.id
  });

  if (creditsData !== null) setCredits(creditsData);
  if (expirationData) setCreditsExpireAt(new Date(expirationData));
};

// Format expiration countdown
const formatExpiration = (expireDate: Date | null) => {
  if (!expireDate) return '';
  
  const now = new Date();
  const diffMs = expireDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return ' (expired)';
  if (diffDays === 0) return ' (expires today)';
  if (diffDays === 1) return ' (expires tomorrow)';
  return ` (expires in ${diffDays} days)`;
};

  // Fetch pets
  const fetchPets = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('pets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setPets(data);
  };

  // Fetch scans
  const fetchScans = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('scans')
      .select('id, pet_name, category, severity, title, observations, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) setScans(data);
  };

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

  useEffect(() => {
    if (user) {
      fetchCredits();
      fetchPets();
      fetchScans();
    }
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAppState({ view: 'home' });
  };

  const handleStartAnalysis = () => {
    if (credits === 0) {
      setShowZeroCreditsModal(true);
    } else {
      setAppState({ view: 'analysis' });
    }
  };

  const handleDeletePet = async (petId: string) => {
    if (!confirm('Delete this pet? This cannot be undone.')) return;
    
    await supabase.from('pets').delete().eq('id', petId);
    fetchPets();
  };

  const handleSavePet = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const petData = {
      user_id: user.id,
      name: formData.get('name') as string,
      species: formData.get('species') as string,
      breed: formData.get('breed') as string,
      age_years: parseInt(formData.get('age_years') as string) || 0,
      age_months: parseInt(formData.get('age_months') as string) || 0,
      weight_lbs: parseFloat(formData.get('weight_lbs') as string) || 0,
    };

    if (editingPet) {
      await supabase.from('pets').update(petData).eq('id', editingPet.id);
    } else {
      await supabase.from('pets').insert([petData]);
    }

    setEditingPet(null);
    setShowAddPet(false);
    fetchPets();
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

  // Refill Credits Modal
  const RefillModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <h3 className="text-2xl font-bold text-slate-900 mb-4">Refill Credits</h3>
        <p className="text-slate-600 mb-6">
          Credit purchases are currently manual. Please email us to purchase more credits:
        </p>
        <a 
          href="mailto:support@prevetscan.com?subject=Credit Purchase Request"
          className="block w-full bg-teal-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors mb-4"
        >
          Email Support
        </a>
        <button
          onClick={() => setShowRefillModal(false)}
          className="w-full text-slate-600 hover:text-slate-800 py-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  // Zero Credits Modal
  const ZeroCreditsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-4 text-center">Out of Credits</h3>
        <p className="text-slate-600 mb-6 text-center">
          You need credits to run health analyses. Purchase more to continue.
        </p>
        <button
          onClick={() => {
            setShowZeroCreditsModal(false);
            setShowRefillModal(true);
          }}
          className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors mb-3"
        >
          Refill Credits
        </button>
        <button
          onClick={() => setShowZeroCreditsModal(false)}
          className="w-full text-slate-600 hover:text-slate-800 py-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  // Pet Form Modal
  const PetFormModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 my-8">
        <h3 className="text-2xl font-bold text-slate-900 mb-6">
          {editingPet ? 'Edit Pet' : 'Add New Pet'}
        </h3>
        <form onSubmit={handleSavePet} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Pet Name</label>
            <input
              type="text"
              name="name"
              defaultValue={editingPet?.name}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
  <label className="block text-sm font-medium text-slate-700 mb-2">Species</label>
  <select
    name="species"
    defaultValue={editingPet?.species || 'dog'}
    required
    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
  >
    <option value="dog">Dog</option>
    <option value="cat">Cat</option>
    <option value="bird">Bird</option>
    <option value="small_mammal">Small Mammal (Rabbit, Guinea Pig, etc.)</option>
    <option value="reptile">Reptile</option>
    <option value="fish">Fish</option>
    <option value="other">Other</option>
  </select>
</div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Breed</label>
            <input
              type="text"
              name="breed"
              defaultValue={editingPet?.breed}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Age (Years)</label>
              <input
                type="number"
                name="age_years"
                defaultValue={editingPet?.age_years}
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Age (Months)</label>
              <input
                type="number"
                name="age_months"
                defaultValue={editingPet?.age_months}
                min="0"
                max="11"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Weight (lbs)</label>
            <input
              type="number"
              name="weight_lbs"
              defaultValue={editingPet?.weight_lbs}
              step="0.1"
              min="0"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
            >
              Save Pet
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingPet(null);
                setShowAddPet(false);
              }}
              className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Dashboard view
  if (appState.view === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-100">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
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
            <div className="flex items-center space-x-4">
              <span className="text-sm font-semibold text-slate-700 bg-white px-4 py-2 rounded-lg shadow">
                Credits: {credits}{formatExpiration(creditsExpireAt)}
              </span> 
              <button
                onClick={() => setAppState({ view: 'home' })}
                className="text-sm text-slate-600 hover:text-slate-800 bg-white px-4 py-2 rounded-lg shadow"
              >
                Home
              </button>
              <button
                onClick={handleSignOut}
                className="text-sm text-slate-600 hover:text-slate-800 bg-white px-4 py-2 rounded-lg shadow"
              >
                Sign Out
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Account Info */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Account</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-medium text-slate-900">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Credit Balance</p>
                    <p className="text-2xl font-bold text-teal-600">{credits}</p>
                  </div>
                  <button
                    onClick={() => setShowRefillModal(true)}
                    className="w-full bg-teal-600 text-white py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors mt-4"
                  >
                    Refill Credits
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleStartAnalysis}
                    className="w-full bg-teal-50 text-teal-700 py-3 rounded-lg font-semibold hover:bg-teal-100 transition-colors text-left px-4"
                  >
                    🔬 New Health Check
                  </button>
                  <button
                    onClick={() => setAppState({ view: 'chat' })}
                    className="w-full bg-purple-50 text-purple-700 py-3 rounded-lg font-semibold hover:bg-purple-100 transition-colors text-left px-4"
                  >
                    💬 Chat with Nora
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Pets Section */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-900">My Pets</h2>
                  <button
                    onClick={() => setShowAddPet(true)}
                    className="bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors text-sm"
                  >
                    + Add Pet
                  </button>
                </div>
                {pets.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 mb-4">No pets added yet</p>
                    <button
                      onClick={() => setShowAddPet(true)}
                      className="text-teal-600 hover:text-teal-700 font-semibold"
                    >
                      Add your first pet →
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pets.map((pet) => (
                      <div key={pet.id} className="border border-slate-200 rounded-lg p-4 hover:border-teal-300 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-slate-900 text-lg">{pet.name}</h3>
                            <p className="text-slate-600 text-sm">
                              {pet.species.charAt(0).toUpperCase() + pet.species.slice(1).replace('_', ' ')} {pet.breed && `• ${pet.breed}`}
                            </p>
                            <p className="text-slate-500 text-sm mt-1">
                              {pet.age_years > 0 && `${pet.age_years}y `}
                              {pet.age_months > 0 && `${pet.age_months}m`}
                              {pet.weight_lbs > 0 && ` • ${pet.weight_lbs} lbs`}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingPet(pet)}
                              className="text-teal-600 hover:text-teal-700 text-sm font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePet(pet.id)}
                              className="text-red-600 hover:text-red-700 text-sm font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Scan History */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Scans</h2>
                {scans.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 mb-4">No scans yet</p>
                    <button
                      onClick={handleStartAnalysis}
                      className="text-teal-600 hover:text-teal-700 font-semibold"
                    >
                      Run your first health check →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scans.map((scan) => (
                      <div key={scan.id} className="border border-slate-200 rounded-lg p-4 hover:border-teal-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-slate-900">{scan.title}</h3>
                            <p className="text-sm text-slate-600">{scan.pet_name} • {scan.category}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            scan.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                            scan.severity === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {scan.severity}
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm line-clamp-2">{scan.observations}</p>
                        <p className="text-xs text-slate-400 mt-2">
                          {new Date(scan.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {showRefillModal && <RefillModal />}
        {showZeroCreditsModal && <ZeroCreditsModal />}
        {(showAddPet || editingPet) && <PetFormModal />}
      </div>
    );
  }

  // Home view
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
            <div className="flex items-center space-x-4">
              <span className="text-sm font-semibold text-slate-700 bg-white px-4 py-2 rounded-lg shadow">
                Credits: {credits}{formatExpiration(creditsExpireAt)}
              </span>
              <button
                onClick={() => setAppState({ view: 'dashboard' })}
                className="text-sm text-slate-600 hover:text-slate-800 bg-white px-4 py-2 rounded-lg shadow"
              >
                Dashboard
              </button>
              <button
                onClick={handleSignOut}
                className="text-sm text-slate-600 hover:text-slate-800 bg-white px-4 py-2 rounded-lg shadow"
              >
                Sign Out
              </button>
            </div>
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
              <Button onClick={handleStartAnalysis} className="w-full">
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

        {showRefillModal && <RefillModal />}
        {showZeroCreditsModal && <ZeroCreditsModal />}
      </div>
    );
  }

  // Other views
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-100">
      {appState.view === 'analysis' && (
        <AnalysisView 
          onBack={() => {
            setAppState({ view: 'home' });
            fetchCredits(); // Refresh credits after analysis
            fetchScans(); // Refresh scan history
          }} 
        />
      )}
      {appState.view === 'chat' && (
        <ChatInterface onBack={() => setAppState({ view: 'home' })} />
      )}
    </div>
  );
}

export default App;