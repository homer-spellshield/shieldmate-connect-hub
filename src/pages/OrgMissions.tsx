import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Clock, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Mission {
  id: string;
  title: string;
  description: string;
  status: string;
  difficulty_level: string;
  estimated_hours: number;
  created_at: string;
  _count?: {
    mission_applications: number;
  };
}

const OrgMissions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMissions();
  }, [user]);

  const fetchMissions = async () => {
    if (!user) return;

    try {
      // First get the organization for this user
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (memberError) throw memberError;

      // Then get missions for that organization
      const { data: missionsData, error: missionsError } = await supabase
        .from('missions')
        .select(`
          id,
          title,
          description,
          status,
          difficulty_level,
          estimated_hours,
          created_at
        `)
        .eq('organization_id', memberData.organization_id)
        .order('created_at', { ascending: false });

      if (missionsError) throw missionsError;

      // Get application counts for each mission
      const missionsWithCounts = await Promise.all(
        (missionsData || []).map(async (mission) => {
          const { count } = await supabase
            .from('mission_applications')
            .select('*', { count: 'exact', head: true })
            .eq('mission_id', mission.id);

          return {
            ...mission,
            _count: { mission_applications: count || 0 }
          };
        })
      );

      setMissions(missionsWithCounts);
    } catch (error) {
      console.error('Error fetching missions:', error);
      toast({
        title: "Error",
        description: "Failed to load your missions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'in_progress': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Missions</h1>
          <p className="text-muted-foreground">
            Manage your posted missions and applications
          </p>
        </div>
        <Button onClick={() => navigate('/org-dashboard/missions/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Mission
        </Button>
      </div>

      {missions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No Missions Posted</h3>
              <p className="text-muted-foreground mb-4">
                You haven't created any missions yet. Start by posting your first mission!
              </p>
              <Button onClick={() => navigate('/org-dashboard/missions/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Mission
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {missions.map((mission) => (
            <Card key={mission.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-2">
                      {mission.title}
                    </CardTitle>
                    <CardDescription>
                      Created on {new Date(mission.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusBadgeVariant(mission.status)}>
                    {mission.status.replace('_', ' ').charAt(0).toUpperCase() + mission.status.replace('_', ' ').slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {mission.description}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {mission.estimated_hours} hours
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {mission.difficulty_level || 'Not specified'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {mission._count?.mission_applications || 0} applications
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/mission/${mission.id}`)}>
                    View Details
                  </Button>
                  {mission.status === 'open' && mission._count?.mission_applications && mission._count.mission_applications > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/org-missions/${mission.id}/applications`)}
                    >
                      Review Applications ({mission._count.mission_applications})
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrgMissions;