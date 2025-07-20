import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Clock, Users } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';

type Mission = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  status: string;
  estimated_hours: number | null;
  difficulty_level: string | null;
  mission_applications: { count: number }[];
};

const MyMissions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMissions = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // Get the user's organization ID
        const { data: orgMemberData, error: orgMemberError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1);

        if (orgMemberError || !orgMemberData || orgMemberData.length === 0) {
          throw new Error("Could not determine your organization.");
        }
        const orgId = orgMemberData[0].organization_id;

        // Fetch missions for that organization and count applications
        const { data: missionsData, error: missionsError } = await supabase
          .from('missions')
          .select(`
            id,
            title,
            description,
            created_at,
            status,
            estimated_hours,
            difficulty_level,
            mission_applications ( count )
          `)
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false });

        if (missionsError) throw missionsError;
        setMissions(missionsData as unknown as Mission[]);
      } catch (error: any) {
        toast({ title: "Error", description: "Failed to load your missions.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchMissions();
  }, [user, toast]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'open': return 'secondary';
      case 'in_progress': return 'default';
      case 'completed': return 'success';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Missions</h1>
          <p className="text-muted-foreground">Manage your posted missions and applications.</p>
        </div>
        <Button onClick={() => navigate('/org-dashboard/missions/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Mission
        </Button>
      </div>

      {loading ? (
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
      ) : missions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium">No Missions Posted Yet</h3>
            <p className="text-muted-foreground mb-4">Click "Create Mission" to get started.</p>
            <Button onClick={() => navigate('/org-dashboard/missions/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Mission
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {missions.map(mission => (
            <Card key={mission.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>{mission.title}</CardTitle>
                  <Badge variant={getStatusVariant(mission.status)} className="capitalize">{mission.status.replace('_', ' ')}</Badge>
                </div>
                <CardDescription>Created on {new Date(mission.created_at).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{mission.description}</p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                  {mission.estimated_hours && <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>{mission.estimated_hours} hours</span></div>}
                  {mission.difficulty_level && <div className="flex items-center gap-1"><span className="capitalize">{mission.difficulty_level}</span></div>}
                  <div className="flex items-center gap-1"><Users className="w-4 h-4" /><span>{mission.mission_applications[0].count} applications</span></div>
                </div>
                <div className="flex justify-end space-x-2">
                    <Button variant="outline">View Details</Button>
                    <Button onClick={() => navigate(`/org-missions/${mission.id}/applications`)}>
                        Review Applications ({mission.mission_applications[0].count})
                    </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyMissions;
