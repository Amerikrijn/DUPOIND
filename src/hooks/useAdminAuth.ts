import { useState, useEffect } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';

export function useAdminAuth() {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
      setLoading(false);
    });
  }, []);

  const login = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
  const logout = () => signOut(auth);

  return { adminUser, loading, login, logout };
}
