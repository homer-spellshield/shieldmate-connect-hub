import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Clock, Award, Target } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Mission {
  id: string;
  title: string;
  description: string;
  estimated_hours: number | null;
  difficulty_level: string | null;
  organizations: {
    name: string;
  } | null;
}

interface Profile {
  first_name: string | null;
  last_name: string | null;
  xp_points: number | null;
  level: number | null;
}

const VolunteerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name, xp_points, level')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        // Fetch available missions manually to avoid relationship issues
        const { data: missionData } = await supabase
          .from('missions')
          .select('id, title, description, estimated_hours, difficulty_level, organization_id')
          .eq('status', 'open')
          .limit(3)
          .order('created_at', { ascending: false });

        if (missionData && missionData.length > 0) {
          // Fetch organization names separately
          const orgIds = [...new Set(missionData.map(m => m.organization_id))];
          const { data: orgData } = await supabase
            .from('organizations')
            .select('id, name')
            .in('id', orgIds);

          // Combine data
          const combinedMissions = missionData.map(mission => ({
            ...mission,
            organizations: orgData?.find(org => org.id === mission.organization_id) || { name: 'Unknown Organization' }
          }));

          setMissions(combinedMissions as Mission[]);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
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

  const firstName = profile?.first_name || 'Volunteer';
  const xpPoints = profile?.xp_points || 0;
  const level = profile?.level || 1;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Welcome back, {firstName}!</h1>
        <p className="text-muted-foreground">
          Ready to make a difference? Here are some missions that match your skills.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recommended Missions */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recommended for You</h2>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/missions'}>
                View All Missions
              </Button>
            </div>
            
            {missions.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">No missions available at the moment.</p>
                  <Button onClick={() => window.location.href = '/missions'}>
                    Explore All Missions
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {missions.map((mission) => (
                  <Card key={mission.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{mission.title}</h3>
                          <p className="text-sm text-muted-foreground">{mission.organizations?.name || 'Organization'}</p>
                        </div>
                        <Badge variant="outline">
                          {mission.difficulty_level || 'Open'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{mission.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {mission.estimated_hours ? `${mission.estimated_hours} hours` : 'TBD'}
                        </div>
                        <Button size="sm" onClick={() => window.location.href = `/mission/${mission.id}`}>
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Stats & Progress */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                ShieldMate Specialist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Level {level}</span>
                  <span>{xpPoints} / {level * 2000} XP</span>
                </div>
                <Progress value={(xpPoints / (level * 2000)) * 100} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">0</div>
                  <div className="text-xs text-muted-foreground">Missions Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{xpPoints}</div>
                  <div className="text-xs text-muted-foreground">Total XP</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Applications</span>
                  <Badge variant="outline">0</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Profile Completion</span>
                  <Badge variant="outline">
                    {profile?.first_name && profile?.last_name ? '80%' : '40%'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Skills Verified</span>
                  <Badge variant="outline">0</Badge>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button size="sm" variant="outline" className="w-full" onClick={() => window.location.href = '/profile'}>
                  Complete Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;