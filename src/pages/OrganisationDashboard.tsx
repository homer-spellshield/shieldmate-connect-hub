import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Users, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Mission {
  id: string;
  title: string;
  description: string;
  status: string;
  estimated_hours: number | null;
  difficulty_level: string | null;
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
}

const OrganisationDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Get user's organization
        const { data: orgMember } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (!orgMember) {
          toast({
            title: "No Organization",
            description: "You are not associated with any organization.",
            variant: "destructive"
          });
          return;
        }

        // Get organization details
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('id', orgMember.organization_id)
          .single();

        if (orgData) {
          setOrganization(orgData);
        }

        // Get organization's missions
        const { data: missionData } = await supabase
          .from('missions')
          .select('*')
          .eq('organization_id', orgMember.organization_id)
          .order('created_at', { ascending: false });

        if (missionData) {
          setMissions(missionData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  const handlePostNewMission = () => {
    window.location.href = "/org-dashboard/missions/new";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  const activeMissions = missions.filter(m => m.status === 'open');
  const inProgressMissions = missions.filter(m => m.status === 'in_progress');
  const completedMissions = missions.filter(m => m.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          {organization?.name || 'Organization'} Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage your missions and connect with talented volunteers ready to help.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Active Missions */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Active Missions</h2>
              <Button onClick={handlePostNewMission} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Post New Mission
              </Button>
            </div>
            
            {activeMissions.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">No active missions yet.</p>
                  <Button onClick={handlePostNewMission}>Create your first mission</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeMissions.map((mission) => (
                  <Card key={mission.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{mission.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{mission.description}</p>
                        </div>
                        <Badge variant="outline" className="capitalize">{mission.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {mission.estimated_hours ? `${mission.estimated_hours}h` : 'TBD'}
                        </div>
                        {mission.difficulty_level && (
                          <Badge variant="secondary" className="capitalize">
                            {mission.difficulty_level}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {inProgressMissions.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">In Progress</h2>
              <div className="space-y-4">
                {inProgressMissions.map((mission) => (
                  <Card key={mission.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{mission.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{mission.description}</p>
                        </div>
                        <Badge variant="default" className="bg-green-100 text-green-800">In Progress</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {mission.estimated_hours ? `${mission.estimated_hours}h` : 'TBD'}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => window.location.href = `/mission/${mission.id}`}>
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Stats & Actions */}
        <div className="space-y-6">
          {/* Post New Mission CTA */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-primary">
                <Plus className="w-5 h-5" />
                <span>Need Help?</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground">
                Post a new mission to connect with skilled volunteers who want to help your organization succeed.
              </p>
              <Button 
                onClick={handlePostNewMission}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Post New Mission
              </Button>
              <div className="text-xs text-muted-foreground text-center">
                Free to post • Get matched with experts
              </div>
            </CardContent>
          </Card>

          {/* Organization Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>Organization Impact</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{missions.length}</div>
                  <div className="text-xs text-muted-foreground">Total Missions</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{completedMissions.length}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Missions</span>
                  <span className="text-sm font-medium text-foreground">{activeMissions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">In Progress</span>
                  <span className="text-sm font-medium text-foreground">{inProgressMissions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="text-sm font-medium text-green-600">
                    {missions.length > 0 ? Math.round((completedMissions.length / missions.length) * 100) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.location.href = '/team-management'}>
                <Users className="w-4 h-4 mr-2" />
                Manage Team Members
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.location.href = '/org-missions'}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Review Applications
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.location.href = '/org-profile'}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Organization Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrganisationDashboard;