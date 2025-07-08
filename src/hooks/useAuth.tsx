// src/hooks/useAuth.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// List of disallowed free email providers
const freeEmailDomains = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'gmx.com'
];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string, orgName: string, isAuthorized: boolean) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  profile: any;
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
  const [profile, setProfile] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      setProfile(profileData);
      setUserRoles(rolesData ? rolesData.map(r => r.role) : []);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const refetchProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setUserRoles([]);
        }
        
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string, orgName: string, isAuthorized: boolean) => {
    // 1. Authorization Check
    if (!isAuthorized) {
      const error = { name: 'AuthError', message: 'You must confirm you are authorized to register this organization.' };
      toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
      return { error };
    }

    // 2. Free Email Domain Check
    const emailDomain = email.split('@')[1];
    if (freeEmailDomains.includes(emailDomain)) {
      const error = { name: 'AuthError', message: 'Registration with free email providers is not allowed. Please use your organization email.' };
      toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
      return { error };
    }

    // 3. Domain Uniqueness Check
    const { data: existingOrgs, error: domainCheckError } = await supabase
      .from('organizations')
      .select('id')
      .eq('domain', emailDomain);
    
    if (domainCheckError) {
      toast({ title: "Registration Check Failed", description: "An error occurred while verifying your domain. Please try again.", variant: "destructive" });
      console.error("Domain check error:", domainCheckError);
      return { error: domainCheckError };
    }

    if (existingOrgs && existingOrgs.length > 0) {
      const error = { name: 'AuthError', message: 'An organization with this email domain already exists. Please contact an admin in your organization to be added.' };
      toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
      return { error };
    }

    // 4. Proceed with Supabase User Signup
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
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
```typescript
// src/pages/Auth.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield } from 'lucide-react';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z.object({
  orgName: z.string().min(2, 'Organization name is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  isAuthorized: z.boolean().refine(val => val === true, {
    message: 'You must confirm your authorization to register.'
  }),
  agreedToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and privacy policy.'
  }),
});

type SignInForm = z.infer<typeof signInSchema>;
type SignUpForm = z.infer<typeof signUpSchema>;

const Auth = () => {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('signin');

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const signInForm = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      orgName: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      isAuthorized: false,
      agreedToTerms: false,
    },
  });

  const handleSignIn = async (data: SignInForm) => {
    const { error } = await signIn(data.email, data.password);
    if (!error) {
      navigate('/', { replace: true });
    }
  };

  const handleSignUp = async (data: SignUpForm) => {
    const { error } = await signUp(data.email, data.password, data.firstName, data.lastName, data.orgName, data.isAuthorized);
    if (!error) {
      signUpForm.reset();
      setActiveTab('signin');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">ShieldMate</h1>
          <p className="text-muted-foreground">
            Connecting organizations with tech volunteers
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome to ShieldMate</CardTitle>
            <CardDescription>
              Login or register your organization to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Organization Signup</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="pt-4">
                <Form {...signInForm}>
                  <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                    <FormField control={signInForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input type="email" placeholder="you@company.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={signInForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl><Input type="password" placeholder="Enter your password" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={signInForm.formState.isSubmitting}>
                      {signInForm.formState.isSubmitting ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="signup" className="pt-4">
                <Form {...signUpForm}>
                  <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                    <FormField control={signUpForm.control} name="orgName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl><Input placeholder="Your Company Inc." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={signUpForm.control} name="firstName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your First Name</FormLabel>
                          <FormControl><Input placeholder="John" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={signUpForm.control} name="lastName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Last Name</FormLabel>
                          <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={signUpForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Email</FormLabel>
                        <FormControl><Input type="email" placeholder="you@company.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={signUpForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl><Input type="password" placeholder="Create a strong password" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={signUpForm.control} name="isAuthorized" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>I confirm that I am authorized to register this organization.</FormLabel>
                                <FormMessage />
                            </div>
                        </FormItem>
                    )} />

                     <FormField control={signUpForm.control} name="agreedToTerms" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                             <div className="space-y-1 leading-none">
                                <FormLabel>I agree to the <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>.</FormLabel>
                                <FormMessage />
                            </div>
                        </FormItem>
                    )} />

                    <Button type="submit" className="w-full" disabled={signUpForm.formState.isSubmitting}>
                      {signUpForm.formState.isSubmitting ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
