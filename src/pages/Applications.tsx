
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    if (!user) return;

    try {
      // Fetch applications first
      const { data: applicationData, error: appError } = await supabase
        .from('mission_applications')
        .select('id, status, applied_at, application_message, mission_id')
        .eq('volunteer_id', user.id)
        .order('applied_at', { ascending: false });

      if (appError) throw appError;

      if (!applicationData || applicationData.length === 0) {
        setApplications([]);
        return;
      }

      // Get unique mission IDs
      const missionIds = [...new Set(applicationData.map(app => app.mission_id))];

      // Fetch mission details
      const { data: missionData, error: missionError } = await supabase
        .from('missions')
        .select('id, title, description, difficulty_level, estimated_hours, organization_id')
        .in('id', missionIds);

      if (missionError) throw missionError;

      // Get unique organization IDs
      const orgIds = [...new Set(missionData?.map(mission => mission.organization_id) || [])];

      // Fetch organization details
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', orgIds);

      if (orgError) throw orgError;

      // Combine the data
      const combinedData = applicationData.map(app => {
        const mission = missionData?.find(m => m.id === app.mission_id);
        const organization = orgData?.find(o => o.id === mission?.organization_id);
        
        return {
          ...app,
          missions: mission ? {
            ...mission,
            organizations: organization || { name: 'Unknown Organization' }
          } : {
            id: '',
            title: 'Unknown Mission',
            description: '',
            difficulty_level: null,
            estimated_hours: null,
            organizations: { name: 'Unknown Organization' }
          }
        };
      });

      setApplications(combinedData);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to load your applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
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
              <Button asChild>
                <a href="/missions">Discover Missions</a>
              </Button>
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

                {application.status === 'approved' && (
                  <div className="mt-4">
                    <Button asChild>
                      <a href={`/mission/${application.missions.id}`}>
                        Access Mission Workspace
                      </a>
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
