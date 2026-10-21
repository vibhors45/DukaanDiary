import { useState } from 'react';
import { supabase } from './utils/supabase';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('demo@dukaandiary.com');
  const [password, setPassword] = useState('hackathon2026');

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) onLogin();
    else alert('Login failed: ' + error.message);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <img src="/logo.png" alt="Logo" className="w-24 h-24 mb-6 rounded-2xl" />
      <h1 className="text-4xl font-extrabold mb-8">Dukaan diary</h1>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        className="w-full p-4 mb-4 text-black bg-white/80 rounded-xl"
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        className="w-full p-4 mb-8 text-black bg-white/80 rounded-xl"
      />
      <button onClick={handleLogin} className="w-full p-4 text-xl bg-[#00E676] text-black rounded-xl font-bold">
        Secure Login
      </button>
    </div>
  );
}