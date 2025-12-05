import { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase-rn';
import type { User, Session } from '@supabase/supabase-js';

interface Joueur {
  id: string;
  nom_complet: string;
  date_naissance: string;
  sexe: 'M' | 'F';
  club_id: number;
  points_classement: number;
  division_id: number;
  preference_langue: string;
  confidentialite: {
    masquer_position: boolean;
    masquer_profil: boolean;
    statut_en_ligne: boolean;
  };
  badges: string[];
  created_at: string;
  updated_at: string;
}

export function useAuth() {
  const mounted = useRef(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [joueur, setJoueur] = useState<Joueur | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mounted.current = true;

    const loadingTimeout = setTimeout(() => {
      if (mounted.current && loading) {
        console.log('⏱️ Loading timeout - forcing loading to false');
        setLoading(false);
      }
    }, 3000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted.current) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadJoueurProfile(session.user.id);
        } else {
          setLoading(false);
        }
      }
    }).catch((error) => {
      console.error('❌ Error getting session:', error);
      if (mounted.current) {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', { event, hasSession: !!session, userId: session?.user?.id });
        if (!mounted.current) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('👤 Loading joueur profile for:', session.user.id);
          await loadJoueurProfile(session.user.id);
        } else {
          console.log('❌ No session, clearing joueur');
          setJoueur(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted.current = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const loadJoueurProfile = async (userId: string) => {
    console.log('📥 loadJoueurProfile called for:', userId);
    if (!mounted.current) {
      console.log('⚠️ Component not mounted, skipping load');
      return;
    }

    try {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured, using mock data');
        // Create mock joueur profile
        const mockJoueur: any = {
          id: userId,
          nom_complet: 'Jean Dubois',
          date_naissance: '1988-11-08',
          sexe: 'M',
          club_id: 3,
          points_classement: 1247,
          division_id: 6,
          preference_langue: 'fr',
          victoires: 0,
          defaites: 0,
          matchs_joues: 0,
          confidentialite: {
            masquer_position: false,
            masquer_profil: false,
            statut_en_ligne: true
          },
          badges: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (mounted.current) {
          setJoueur(mockJoueur);
          setLoading(false);
        }
        return;
      }

      console.log('🔍 Fetching joueur from database...');
      const { data, error } = await supabase
        .from('joueurs')
        .select(`
          *,
          club:clubs(*),
          division:divisions(*)
        `)
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Database error loading profile:', error);
        if (mounted.current) {
          setLoading(false);
        }
        return;
      }

      if (!data) {
        console.error('❌ No joueur found for userId:', userId);
        if (mounted.current) {
          setLoading(false);
        }
        return;
      }

      console.log('✅ Joueur loaded:', {
        id: data.id,
        nom: data?.nom_complet,
        victoires: data?.victoires,
        defaites: data?.defaites,
        points: data?.points_classement
      });

      if (mounted.current) {
        setJoueur(data);
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Exception during profile load:', error);
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      // Mock successful sign-in when Supabase is not configured
      const mockUser = {
        id: 'mock-user-id',
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser,
      };
      
      // Store mock session
      if (mounted.current) {
        setSession(mockSession as any);
        setUser(mockUser as any);
        await loadJoueurProfile(mockUser.id);
      }
      
      return { data: { user: mockUser, session: mockSession }, error: null };
    }

    console.log('🔐 Tentative de connexion avec:', { email, passwordLength: password.length });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Erreur de connexion Supabase:', {
          message: error.message,
          status: error.status,
          details: error
        });
      } else {
        console.log('✅ Connexion réussie:', { userId: data.user?.id, email: data.user?.email });
      }

      return { data, error };
    } catch (networkError) {
      // Handle network errors gracefully
      console.error('Network error during sign-in:', networkError);
      return { 
        data: null, 
        error: { 
          message: 'Network connection failed. Please check your internet connection and try again.',
          name: 'NetworkError'
        } 
      };
    }
  };

  const signUp = async (email: string, password: string, userData: {
    nom_complet: string;
    date_naissance: string;
    sexe: 'M' | 'F';
    club_id: number;
    preference_langue: string;
  }) => {
    if (!isSupabaseConfigured()) {
      // Mock successful sign-up when Supabase is not configured
      return { 
        data: { 
          user: { id: 'mock-user-id', email: email },
          session: null 
        }, 
        error: null 
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (data.user && !error) {
        // Create joueur profile
        const { error: profileError } = await supabase
          .from('joueurs')
          .insert({
            id: data.user.id,
            ...userData,
          });

        if (profileError) {
          console.error('Erreur lors de la création du profil:', profileError);
        }
      }

      return { data, error };
    } catch (networkError) {
      // Handle network errors gracefully
      console.error('Network error during sign-up:', networkError);
      return { 
        data: null, 
        error: { 
          message: 'Network connection failed. Please check your internet connection and try again.',
          name: 'NetworkError'
        } 
      };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      setJoueur(null);
    }
    return { error };
  };

  const updateProfile = async (updates: Partial<Joueur>) => {
    if (!user) return { error: new Error('Non authentifié') };

    if (!isSupabaseConfigured()) {
      // Mock update for when Supabase is not configured
      if (joueur && mounted.current) {
        const updatedJoueur = { ...joueur, ...updates };
        setJoueur(updatedJoueur);
        return { data: updatedJoueur, error: null };
      }
      return { data: null, error: new Error('Aucun profil à mettre à jour') };
    }

    const { data, error } = await supabase
      .from('joueurs')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (data && !error && mounted.current) {
      setJoueur(data);
    }

    return { data, error };
  };

  const refreshJoueur = async () => {
    console.log('🔄 refreshJoueur called, user:', { id: user?.id, email: user?.email });
    if (user?.id) {
      console.log('⏳ Loading joueur profile...');
      await loadJoueurProfile(user.id);
      console.log('✅ Profile refresh complete');
    } else {
      console.warn('⚠️ No user ID, cannot refresh joueur');
    }
  };

  return {
    user,
    session,
    joueur,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshJoueur,
  };
}