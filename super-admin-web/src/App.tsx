import React, { useEffect, useState } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import Login from './Login';
import Dashboard from './Dashboard';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white' }}>Cargando...</div>;
  }

  // Si no está logueado o si su correo no es el maestro, mostrar Login
  if (!user || user.email !== 'mateoperez08251@gmail.com') {
    return <Login onLogin={() => {}} />;
  }

  return <Dashboard />;
}

export default App;
