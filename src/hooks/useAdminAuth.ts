import { useState, useEffect } from 'react';
import { adminAuth, setAuthToken } from '@/lib/api';

interface User {
  id: string;
  email?: string;
}

interface Session {
  user: User;
  access_token: string;
}

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem('auth_token');
    if (token) {
      setAuthToken(token);
      setIsAdmin(true);
      setUser({ id: 'admin', email: 'admin' });
    }
    setLoading(false);
  }, []);



  const signIn = async (email: string, password: string) => {
    const { data, error } = await adminAuth.signIn(email, password);
    if (data?.token) {
      setAuthToken(data.token);
      setIsAdmin(true);
      setUser({ id: 'admin', email });
      setSession({ user: { id: 'admin', email }, access_token: data.token });
    }
    return { error };
  };

  const signOut = async () => {
    const { error } = await adminAuth.signOut();
    setAuthToken(null);
    setIsAdmin(false);
    setUser(null);
    setSession(null);
    return { error };
  };

  return {
    user,
    session,
    isAdmin,
    loading,
    signIn,
    signOut,
  };
}
