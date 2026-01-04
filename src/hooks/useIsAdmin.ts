import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setIsAdmin(false);
            return;
        }

       
        const { data } = await supabase
          .from('user')
          .select('role')
          .eq('id', user.id)
          .single();

        setIsAdmin(data?.role === 'admin' || data?.role === 'owner');
      } catch (error) {
        console.error("Admin check failed", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  return { isAdmin, loading };
}