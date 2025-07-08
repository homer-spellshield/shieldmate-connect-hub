import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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