import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Application {
  id: string;
  status: string;
  applied_at: string;
  application_message: string;
  missions: {
    id: string;
    title: string;
    description: string;
    difficulty_level: string;
    estimated_hours: number;
    organizations: {
      name: string;
    };
  };
}

const Applications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch applications with joined mission and organization data in a single query
      const { data: applicationData, error: appError } = await supabase
        .from('mission_applications')
        .select(`
          id, 
          status, 
          applied_at, 
          application_message,
          missions:mission_id (
            id,
            title,
            description,
            difficulty_level,
            estimated_hours,
            organizations:organization_id (
              name
            )
          )
        `)
        .eq('volunteer_id', user.id)
        .order('applied_at', { ascending: false });

      if (appError) {
        console.error('Error fetching applications:', appError);
        throw appError;
      }

      if (!applicationData || applicationData.length === 0) {
        setApplications([]);
        return;
      }

      // Format the data to match the expected structure
      const formattedApplications = applicationData.map(app => ({
        ...app,
        missions: app.missions || {
          id: '',
          title: 'Unknown Mission',
          description: '',
          difficulty_level: null,
          estimated_hours: null,
          organizations: { name: 'Unknown Organization' }
        }
      }));

      setApplications(formattedApplications as Application[]);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load your applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>
        <p className="text-muted-foreground">
          Track the status of your mission applications
        </p>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't applied to any missions yet. Start exploring available missions!
              </p>
              <Button onClick={() => navigate('/missions')}>Discover Missions</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {applications.map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-2">
                      {application.missions.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      {application.missions.organizations.name}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusBadgeVariant(application.status)}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {application.missions.description}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {application.missions.estimated_hours} hours
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {application.missions.difficulty_level || 'Not specified'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Applied {new Date(application.applied_at).toLocaleDateString()}
                  </div>
                </div>

                {application.application_message && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-medium mb-1">Your Application Message:</p>
                    <p className="text-sm text-muted-foreground">
                      {application.application_message}
                    </p>
                  </div>
                )}

                {application.status === 'accepted' && (
                  <div className="mt-4">
                    <Button onClick={() => navigate(`/mission/${application.missions.id}`)}>
                      Access Mission Workspace
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Applications;