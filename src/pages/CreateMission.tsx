import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, MapPin, Clock, BarChart3, Loader2 } from 'lucide-react';

const missionSchema = z.object({
  template_id: z.string().min(1, 'Please select a mission template'),
  title: z.string().min(1, 'Mission title is required'),
  description: z.string().min(10, 'Please provide a detailed scope (at least 10 characters)'),
});

type MissionForm = z.infer<typeof missionSchema>;

interface MissionTemplate {
  id: string;
  title: string;
  description: string;
  estimated_hours: number | null;
  difficulty_level: string | null;
}

interface Organization {
  id: string;
  name: string;
  status: string;
}

const operationNames = [
  'Phoenix', 'Eagle', 'Falcon', 'Thunder', 'Lightning', 'Storm', 'Blaze', 'Arrow',
  'Shield', 'Compass', 'Anchor', 'Bridge', 'Summit', 'Dawn', 'Horizon', 'Velocity'
];

const CreateMission = () => {
  const [templates, setTemplates] = useState<MissionTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MissionTemplate | null>(null);
  const [userOrganization, setUserOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const form = useForm<MissionForm>({
    resolver: zodResolver(missionSchema),
    defaultValues: {
      template_id: '',
      title: `Operation ${operationNames[Math.floor(Math.random() * operationNames.length)]}`,
      description: '',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const { data: orgMemberData, error: orgMemberError } = await supabase
          .from('organization_members')
          .select('organizations ( id, name, status )')
          .eq('user_id', user.id)
          .single();

        if (orgMemberError || !orgMemberData?.organizations) {
          throw new Error("Could not find an organisation for your account.");
        }
        
        const orgData = orgMemberData.organizations as any as Organization;
        setUserOrganization(orgData);

        if (orgData.status !== 'approved') {
          toast({
            title: 'Verification Required',
            description: 'Your organisation must be approved before you can create missions.',
            variant: 'destructive',
          });
          navigate('/org-dashboard');
          return;
        }

        const { data: templatesData, error: templatesError } = await supabase
          .from('mission_templates')
          .select('id, title, description, estimated_hours, difficulty_level')
          .order('title');

        if (templatesError) {
          throw new Error("Failed to load mission templates. Please try again.");
        }
        setTemplates(templatesData || []);

      } catch (error: any) {
        toast({
          title: 'Error Loading Page',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast, navigate]);

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      form.setValue('template_id', templateId);
    }
  };

  const onSubmit = async (values: MissionForm) => {
    if (!userOrganization) {
      toast({
        title: 'Error',
        description: 'Unable to determine your organisation. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.from('missions').insert({
        title: values.title,
        description: values.description,
        organization_id: userOrganization.id,
        template_id: values.template_id,
        estimated_hours: selectedTemplate?.estimated_hours,
        difficulty_level: selectedTemplate?.difficulty_level,
        status: 'open',
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Mission posted successfully! Volunteers can now apply.',
      });

      navigate('/org-dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to post mission. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/org-dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Mission</h1>
        <p className="text-muted-foreground">
          Post a mission to connect with skilled volunteers who can help your organisation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Mission Details</CardTitle>
              <CardDescription>
                Fill in the details for your new mission based on a template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="template_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mission Template</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          handleTemplateSelect(value);
                        }}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a mission template" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mission Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Operation Phoenix" />
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
                        <FormLabel>Detailed Scope</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={6}
                            placeholder="Provide specific details about your project, requirements, timeline, and any other relevant information for volunteers..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Posting Mission...' : 'Post Mission'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Template Details</CardTitle>
                <CardDescription>
                  Based on: {selectedTemplate.title}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Description</h4>
                  <p className="text-sm">{selectedTemplate.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {selectedTemplate.estimated_hours && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Est. Hours</p>
                        <p className="text-sm font-medium">{selectedTemplate.estimated_hours}h</p>
                      </div>
                    </div>
                  )}

                  {selectedTemplate.difficulty_level && (
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Difficulty</p>
                        <Badge variant="outline" className="capitalize">
                          {selectedTemplate.difficulty_level}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {userOrganization && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Organisation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{userOrganization.name}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tips for Success</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <h5 className="font-medium">Be Specific</h5>
                <p className="text-muted-foreground">Include clear requirements and expected outcomes</p>
              </div>
              <div>
                <h5 className="font-medium">Set Expectations</h5>
                <p className="text-muted-foreground">Mention time commitment and communication preferences</p>
              </div>
              <div>
                <h5 className="font-medium">Provide Context</h5>
                <p className="text-muted-foreground">Explain how this mission helps your organisation's goals</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateMission;
