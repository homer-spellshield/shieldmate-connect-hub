import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session, PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// --- CONSTANTS ---
const freeEmailDomains = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'gmx.com'
];

// --- TYPES ---
interface Profile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRoles: string[];
  loading: boolean; // This is now the single source of truth for auth readiness
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, orgName: string, isAuthorized: boolean) => Promise<{ error: PostgrestError | Error | null }>;
}

// --- CONTEXT ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// --- PROVIDER COMPONENT ---
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true); // Start true, set to false only when all data is loaded or no user
  const { toast } = useToast();

  const fetchProfileAndRoles = useCallback(async (user: User) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (profileError) throw profileError;
      setProfile(profileData as Profile);

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      if (rolesError) throw rolesError;
      setUserRoles(rolesData ? rolesData.map(r => r.role) : []);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setProfile(null);
      setUserRoles([]);
    }
  }, []);

  useEffect(() => {
    // This effect runs ONLY ONCE on app mount.
    // It performs the initial check and sets up the listener.
    const initializeAuth = async () => {
      // 1. Get the initial session
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      const currentUser = initialSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfileAndRoles(currentUser);
      }
      
      // 2. Now that the initial state is set, we can say we are done loading.
      setLoading(false);

      // 3. Set up the listener for future auth changes (login/logout)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          setSession(session);
          const newCurrentUser = session?.user ?? null;
          setUser(newCurrentUser);

          if (newCurrentUser) {
            await fetchProfileAndRoles(newCurrentUser);
          } else {
            setProfile(null);
            setUserRoles([]);
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    };

    const subscriptionPromise = initializeAuth();

    // Cleanup function for the returned promise from initializeAuth
    return () => {
        subscriptionPromise.then(cleanup => {
            if (cleanup) {
                const { data: { subscription } } = cleanup;
                subscription.unsubscribe();
            }
        });
    };
  }, [fetchProfileAndRoles]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
    }
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out", description: "You have been successfully signed out." });
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string, orgName: string, isAuthorized: boolean) => {
    if (!isAuthorized) {
      const error = new Error('You must confirm you are authorized to register this organization.');
      toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
      return { error };
    }
    const emailDomain = email.split('@')[1];
    if (freeEmailDomains.includes(emailDomain)) {
      const error = new Error('Registration with free email providers is not allowed. Please use your organization email.');
      toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
      return { error };
    }
    const { data: existingOrgs, error: domainCheckError } = await supabase
      .from('organizations')
      .select('id')
      .eq('domain', emailDomain);
    if (domainCheckError) {
      toast({ title: "Registration Check Failed", description: "An error occurred while verifying your domain. Please try again.", variant: "destructive" });
      return { error: domainCheckError };
    }
    if (existingOrgs && existingOrgs.length > 0) {
      const error = new Error('An organization with this email domain already exists. Please contact an admin in your organization to be added.');
      toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
      return { error };
    }
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          org_name: orgName,
          domain: emailDomain
        },
      },
    });
    if (signUpError) {
      toast({ title: "Sign up failed", description: signUpError.message, variant: "destructive" });
      return { error: signUpError };
    }
    if (signUpData.user) {
      toast({
        title: "Check your email",
        description: "We've sent a confirmation link to complete your registration.",
      });
    }
    return { error: null };
  };

  const value = {
    user,
    session,
    profile,
    userRoles,
    loading,
    signOut,
    signIn,
    signUp,
    refetchProfile: useCallback(async () => {
        if (user) await fetchProfileAndRoles(user);
    }, [user, fetchProfileAndRoles]),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
