import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PostgrestError } from '@supabase/supabase-js';

// List of disallowed free email providers for organization sign-up
const freeEmailDomains = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'gmx.com'
];

// Define a more specific type for the user profile
interface Profile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  // Add other profile fields here as needed
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string, orgName: string, isAuthorized: boolean) => Promise<{ error: PostgrestError | Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: PostgrestError | Error | null }>;
  signOut: () => Promise<void>;
  profile: Profile | null;
  userRoles: string[];
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (rolesError) throw rolesError;

      setProfile(profileData);
      setUserRoles(rolesData ? rolesData.map(r => r.role) : []);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      setUserRoles([]);
    }
  }, []);

  const refetchProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    const getSessionAndProfile = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Error getting session:", sessionError);
        setLoading(false);
        return;
      }

      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
      }
      setLoading(false);
    };
    
    getSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
          setUserRoles([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

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

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    profile,
    userRoles,
    refetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
