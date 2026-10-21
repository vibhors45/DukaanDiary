import { useState, type ReactNode } from 'react';
import QuickSale from './Quicksale';
import AddItem from './Additem';
import CustomerOrders from './Customerorders';
import VoiceSale from './Voicesale';

// --- EMERGENCY HACKATHON LOGIN BYPASS ---
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('demo@dukaandiary.com');
  const [password, setPassword] = useState('hackathon2026');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      onLogin();
    }, 400); 
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-white">
      <img 
        src="/logod1.png.jpeg" 
        alt="Dukaan Dairy" 
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          document.getElementById('logo-fallback')!.style.display = 'block';
        }}
        className="w-64 mb-10 drop-shadow-xl rounded-2xl" 
      />
      <h1 id="logo-fallback" style={{ display: 'none' }} className="text-5xl font-extrabold mb-10 text-[#00E676] drop-shadow-lg">DukaanDairy</h1>
      
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-4 mb-4 text-white placeholder-white/70 bg-white/20 border border-white/40 rounded-2xl focus:outline-none focus:bg-white/30 backdrop-blur-md transition-all"
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-4 mb-8 text-white placeholder-white/70 bg-white/20 border border-white/40 rounded-2xl focus:outline-none focus:bg-white/30 backdrop-blur-md transition-all"
        placeholder="Password"
      />
      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full p-4 text-xl bg-[#00E676] hover:bg-[#00c968] text-gray-900 rounded-2xl font-extrabold shadow-lg transition-all active:scale-95 disabled:opacity-50 border-none"
      >
        {loading ? 'Authenticating...' : 'Secure Login'}
      </button>
    </div>
  );
}

// --- MAIN APP CONFIG ---
type TabId = 'sale' | 'add' | 'orders';

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: 'sale', label: 'Sale', icon: <path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" /> },
  { id: 'add', label: 'Add Item', icon: <path d="M12 4v16M4 12h16" /> },
  { id: 'orders', label: 'Orders', icon: <path d="M5 7h14M5 12h14M5 17h9" /> },
];

export default function App() {
  const [tab, setTab] = useState<TabId>('sale');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-transparent sm:p-6">
      <div className="w-full h-full min-h-screen sm:min-h-0 sm:h-[850px] sm:max-w-[420px] sm:rounded-[40px] sm:border-[6px] sm:border-white/20 sm:shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden relative flex flex-col bg-white/10 backdrop-blur-xl">

        {!isAuthenticated ? (
          <LoginScreen onLogin={() => setIsAuthenticated(true)} />
        ) : (
          <>
            <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-white/20 bg-white/10 px-5 py-4 backdrop-blur-md shadow-sm">
              <img src="/logod.png.jpeg" alt="Logo Icon" className="w-12 h-12 rounded-xl border border-white/30 shadow-sm object-cover bg-white" />
              <div>
                <h1 className="font-display text-2xl font-extrabold leading-none text-white drop-shadow-md">Dukaan Dairy</h1>
                <p className="mt-1 font-body text-xs font-medium text-white/80">Smart Stock Manager</p>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto px-4 pb-28 pt-5 custom-scrollbar">
              {tab === 'sale' && (
                <div className="flex flex-col gap-5">
                  <VoiceSale />
                  <QuickSale onAddItem={() => setTab('add')} />
                </div>
              )}
              {tab === 'add' && <AddItem />}
              {tab === 'orders' && <CustomerOrders shopName="Dukaan Dairy" />}
            </main>

            <nav className="absolute bottom-0 w-full z-20 border-t border-white/20 bg-white/10 backdrop-blur-xl px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
              <ul className="grid grid-cols-3 gap-2">
                {TABS.map((t) => {
                  const active = tab === t.id;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => setTab(t.id)}
                        className={`flex h-[72px] w-full flex-col items-center justify-center gap-1 rounded-2xl font-display text-sm font-bold transition-all border-none shadow-none ${
                          active
                            ? 'bg-white/30 text-white shadow-inner scale-105'
                            : 'bg-transparent text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" className="h-6 w-6 mb-1" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          {t.icon}
                        </svg>
                        {t.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </>
        )}
      </div>
    </div>
  );
}