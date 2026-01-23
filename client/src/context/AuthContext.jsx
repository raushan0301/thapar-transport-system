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
  const loadingProfile = useRef(false); // Use ref to track loading state

  
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // 1. Load session manually first
        const { data: { session } } = await supabase.auth.getSession();

        // Session loaded

        if (session?.user && mounted) {
          setUser(session.user);
          // Wait for profile to load before continuing
          await loadProfile(session.user.id, session.user.email);
        }

        // 2. Attach listeners only AFTER session is initialized
        const { data: listener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            // Auth event triggered

            if (event === 'SIGNED_IN' && session?.user) {
              setUser(session.user);
              await loadProfile(session.user.id, session.user.email);
            }

            if (event === 'SIGNED_OUT') {
              setUser(null);
              setProfile(null);
            }
          }
        );

        // Cleanup function
        return () => listener.subscription.unsubscribe();
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
      } finally {
        // Now mark loading complete AFTER session+profile are loaded
        if (mounted) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - runs once on mount

  const loadProfile = async (userId, userEmail) => {
    // Prevent concurrent loads
    if (loadingProfile.current) {
      // Profile already loading, skip
      return;
    }

    loadingProfile.current = true;

    try {
      // Loading profile

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Profile fetch error:', error.message, error.code);

        if (error.code === 'PGRST116') {
          // Creating new profile

          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert([
              {
                id: userId,
                email: userEmail,
                full_name: userEmail.split('@')[0],
                role: 'user',
              },
            ])
            .select()
            .single();

          if (createError) {
            console.error('❌ Create profile error:', createError);
            toast.error('Failed to create profile');
            loadingProfile.current = false;
            return;
          }

          // Profile created successfully
          setProfile(newProfile);
          loadingProfile.current = false;
          return;
        }

        loadingProfile.current = false;
        return;
      }

      // Profile loaded successfully
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