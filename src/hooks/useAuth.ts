import { useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, session, loading, setUser, setSession, setLoading } = useAuthStore();
  const [authReady, setAuthReady] = useState(false);
  const mountedRef = useRef(true); // Prevent setState on unmounted component

  useEffect(() => {
    mountedRef.current = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mountedRef.current) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setAuthReady(true);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mountedRef.current) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [setUser, setSession, setLoading]);

  return { user, session, loading, authReady };
}
