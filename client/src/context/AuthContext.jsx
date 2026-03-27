import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadingProfile = useRef(false);

  useEffect(() => {
    let mounted = true;
    let timeoutId;

    async function init() {
      try {
        // Add timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((resolve) => {
          timeoutId = setTimeout(() => resolve({ data: { session: null } }), 3000);
        });

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        clearTimeout(timeoutId);

        if (session?.user && mounted) {
          setUser(session.user);
          await Promise.race([
            loadProfile(session.user.id, session.user.email),
            new Promise(resolve => setTimeout(resolve, 5000))
          ]);
        }

        // Attach listeners
        const { data: listener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              setUser(session.user);
              await Promise.race([
                loadProfile(session.user.id, session.user.email),
                new Promise(resolve => setTimeout(resolve, 5000))
              ]);
            }

            if (event === 'SIGNED_OUT') {
              setUser(null);
              setProfile(null);
            }
          }
        );

        return () => listener.subscription.unsubscribe();
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const loadProfile = async (userId, userEmail) => {
    if (loadingProfile.current) {
      return;
    }

    loadingProfile.current = true;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Profile fetch error:', error.message, error.code);

        if (error.code === 'PGRST116') {
          // No profile found — this user was deleted by an admin.
          // Sign them out immediately to revoke access.
          console.warn('🚫 No profile found for auth user — account may have been deleted. Signing out.');
          toast.error('Your account has been deleted. Please contact an administrator.');
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          loadingProfile.current = false;
          return;
        }

        loadingProfile.current = false;
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('💥 Exception loading profile:', error);
    } finally {
      loadingProfile.current = false;
    }
  };

  const signUp = async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email,
              full_name: fullName,
              role: 'user',
            },
          ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }

      toast.success('Account created successfully!');
      return { data, error: null };
    } catch (error) {
      toast.error(error.message);
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verify profile exists before saying welcome.
      // This catches accounts that were deleted from the users table but still exist in Auth.
      const { data: profileRecord, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profileRecord) {
        console.warn('🚫 Login successful but profile missing — account is likely deleted.');
        await supabase.auth.signOut();
        throw new Error('Your account has been deleted. Please contact an administrator.');
      }

      toast.success('Welcome back!');
      return { data, error: null };
    } catch (error) {
      toast.error(error.message);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setProfile(null);
      loadingProfile.current = false;
      toast.success('Logged out successfully!');

      window.location.href = '/login';
    } catch (error) {
      toast.error(error.message);
    }
  };

  const refreshProfile = async () => {
    if (!user?.id) return;
    await loadProfile(user.id, user.email);
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
