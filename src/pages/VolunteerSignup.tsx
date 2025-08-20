import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Heart, Shield } from 'lucide-react';
import { AppErrorHandler } from '@/lib/errorHandler';
import { InputSanitizer } from '@/lib/sanitizer';

const volunteerSignupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  availability: z.enum(['weekends', 'evenings', 'flexible']),
  selectedSkills: z.array(z.string()).min(1, 'Please select at least one skill area'),
  agreedToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms and conditions'),
});

type VolunteerSignupForm = z.infer<typeof volunteerSignupSchema>;

const skillAreas = [
  { id: 'web-development', label: 'Web Development' },
  { id: 'graphic-design', label: 'Graphic Design' },
  { id: 'project-management', label: 'Project Management' },
  { id: 'data-analysis', label: 'Data Analysis' },
  { id: 'content-writing', label: 'Content Writing' },
  { id: 'social-media', label: 'Social Media Management' },
  { id: 'fundraising', label: 'Fundraising' },
  { id: 'event-planning', label: 'Event Planning' },
  { id: 'legal-advice', label: 'Legal Advice' },
  { id: 'accounting', label: 'Accounting/Finance' },
];

export default function VolunteerSignup() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<VolunteerSignupForm>({
    resolver: zodResolver(volunteerSignupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      bio: '',
      availability: 'flexible',
      selectedSkills: [],
      agreedToTerms: false,
    },
  });

  const onSubmit = async (values: VolunteerSignupForm) => {
    try {
      setLoading(true);
      
      // Sanitize form data
      const sanitizedData = InputSanitizer.sanitizeFormData(values);
      
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: sanitizedData.email,
        password: values.password, // Don't sanitize password
        options: {
          data: {
            first_name: sanitizedData.firstName,
            last_name: sanitizedData.lastName,
            user_type: 'volunteer',
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create volunteer profile with additional data
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            bio: sanitizedData.bio,
            availability: sanitizedData.availability,
          })
          .eq('user_id', authData.user.id);

        if (profileError) {
          console.warn('Profile update error:', profileError);
        }

        // Assign volunteer role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'volunteer'
          });

        if (roleError) {
          console.warn('Role assignment error:', roleError);
        }

        toast({
          title: "Welcome to ShieldMate!",
          description: "Your account has been created. Please check your email to verify your account.",
        });

        navigate('/volunteer-dashboard');
      }
    } catch (error) {
      AppErrorHandler.showToast(error, 'volunteer signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Join ShieldMate as a Volunteer</CardTitle>
          <CardDescription>
            Connect with organizations that need your skills and make a meaningful impact in your community.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About You (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about your experience, interests, or what motivates you to volunteer..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="selectedSkills"
                render={() => (
                  <FormItem>
                    <FormLabel>Skill Areas</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-3">
                        {skillAreas.map((skill) => (
                          <FormField
                            key={skill.id}
                            control={form.control}
                            name="selectedSkills"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(skill.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, skill.id])
                                        : field.onChange(field.value?.filter((value) => value !== skill.id))
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {skill.label}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agreedToTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I agree to the <span className="text-primary cursor-pointer hover:underline">Terms of Service</span> and{' '}
                        <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4 mr-2" />
                      Join ShieldMate
                    </>
                  )}
                </Button>
                
                <div className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/auth')}>
                    Sign in here
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}