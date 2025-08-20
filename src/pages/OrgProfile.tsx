
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { InputSanitizer } from '@/lib/sanitizer';
import { AppErrorHandler } from '@/lib/errorHandler';
import { Building, Globe, Mail, Users } from 'lucide-react';

const orgProfileSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  description: z.string().optional(),
  website_url: z.string().url('Please enter a valid URL').or(z.literal('')),
  contact_email: z.string().email('Please enter a valid email').optional(),
});

type OrgProfileForm = z.infer<typeof orgProfileSchema>;

interface Organization {
  id: string;
  name: string;
  description: string;
  website_url: string;
  contact_email: string;
  domain: string;
  created_at: string;
  _count?: {
    organization_members: number;
    missions: number;
  };
}

const OrgProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm<OrgProfileForm>({
    resolver: zodResolver(orgProfileSchema),
    defaultValues: {
      name: '',
      description: '',
      website_url: '',
      contact_email: '',
    },
  });

  useEffect(() => {
    fetchOrganization();
  }, [user]);

  const fetchOrganization = async () => {
    if (!user) return;

    try {
      // Get the organization for this user
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (memberError) throw memberError;

      // Get organization details
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', memberData.organization_id)
        .single();

      if (orgError) throw orgError;

      // Get member count
      const { count: memberCount } = await supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', memberData.organization_id);

      // Get mission count
      const { count: missionCount } = await supabase
        .from('missions')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', memberData.organization_id);

      const orgWithCounts = {
        ...orgData,
        _count: {
          organization_members: memberCount || 0,
          missions: missionCount || 0,
        }
      };

      setOrganization(orgWithCounts);
      
      // Update form with current values
      form.reset({
        name: orgData.name || '',
        description: orgData.description || '',
        website_url: orgData.website_url || '',
        contact_email: orgData.contact_email || '',
      });
    } catch (error) {
      console.error('Error fetching organization:', error);
      toast({
        title: "Error",
        description: "Failed to load organization profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: OrgProfileForm) => {
    if (!organization) return;

    // Sanitize form data before submission
    const sanitizedData = InputSanitizer.sanitizeFormData(data);

    return AppErrorHandler.handleAsync(async () => {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: sanitizedData.name,
          description: sanitizedData.description || null,
          website_url: sanitizedData.website_url || null,
          contact_email: sanitizedData.contact_email || null,
        })
        .eq('id', organization.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization profile updated successfully",
      });

      fetchOrganization();
    }, 'Updating organization profile');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">No Organization Found</h2>
        <p className="text-muted-foreground">You are not associated with any organization.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization Profile</h1>
        <p className="text-muted-foreground">
          Manage your organization's information and settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organization Statistics</CardTitle>
            <CardDescription>Overview of your organization's activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Organization Name</p>
                <p className="font-medium">{organization.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Team Members</p>
                <p className="font-medium">{organization._count?.organization_members} members</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Posted Missions</p>
                <p className="font-medium">{organization._count?.missions} missions</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Domain</p>
                <p className="font-medium">{organization.domain}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your organization information</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your organization name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell volunteers about your organization..."
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
                  name="website_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://yourorganization.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="contact@yourorganization.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  Save Changes
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrgProfile;
