import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Clock, Award, Target, Rocket, AlertCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from "@/components/ui/alert";
import ErrorBoundary from '@/components/ErrorBoundary';

interface Mission {
  id: string;
  title: string;
  description: string;
  estimated_hours: number | null;
  difficulty_level: string | null;
  organization_name?: string;
  organization_id?: string;
  status?: string;
}

interface Profile {
  first_name: string | null;
  last_name: string | null;
  xp_points?: number | null;
  level?: number | null;
}

// Function to calculate XP needed for the next level
const getXpForNextLevel = (level: number) => {
  return Math.floor(1000 * Math.pow(level, 1.5));
};

const VolunteerDashboard = () => {
  const { user, profile: authProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [availableMissions, setAvailableMissions] = useState<Mission[]>([]);
  const [activeMissions, setActiveMissions] = useState<Mission[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSkills, setHasSkills] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        setProfile(authProfile ? {
          first_name: authProfile.first_name,
          last_name: authProfile.last_name,
          xp_points: (authProfile as any).xp_points || 0,
          level: (authProfile as any).level || 1
        } : null);

        // Check if user has skills assigned
        const { data: skillsData } = await supabase
          .from('volunteer_skills')
          .select('id')
          .eq('volunteer_id', user.id)
          .limit(1);
        
        setHasSkills(skillsData && skillsData.length > 0);

        // Fetch available missions using the public function
        const { data: missionsData, error: missionsError } = await supabase
          .rpc('get_open_missions_public', { p_limit: 3 });

        if (missionsError) throw missionsError;
        setAvailableMissions(missionsData as any || []);
        
        // Fetch active missions using the secure function  
        const { data: activeMissionsData, error: activeMissionsError } = await supabase
          .rpc('get_volunteer_missions');
          
        if (activeMissionsError) throw activeMissionsError;
        
        // Filter out completed missions
        const formattedActiveMissions = (activeMissionsData || [])
          .filter((m: any) => m.status !== 'completed');
        
        setActiveMissions(formattedActiveMissions);

      } catch (error: any) {
        setError(error.message);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data: ' + error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authProfile, toast]);

  if (loading) {
    // Skeleton Loader
    return (
        <div className="space-y-6">
            <div><Skeleton className="h-8 w-64 mb-2" /><Skeleton className="h-4 w-96" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => ( <Card key={i}><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-4" /></CardHeader><CardContent><Skeleton className="h-8 w-16 mb-2" /><Skeleton className="h-3 w-32" /></CardContent></Card> ))}</div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Card><CardHeader><Skeleton className="h-6 w-48" /></CardHeader><CardContent><div className="space-y-4">{[1, 2, 3].map((i) => ( <div key={i} className="border rounded-lg p-4"><Skeleton className="h-5 w-64 mb-2" /><Skeleton className="h-4 w-48 mb-2" /><div className="flex gap-2"><Skeleton className="h-5 w-16" /><Skeleton className="h-5 w-20" /></div></div> ))}</div></CardContent></Card><Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><div className="space-y-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-8 w-32" /></div></CardContent></Card></div>
        </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
          <p className="text-muted-foreground">Ready to make a difference?</p>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data: {error}
          </AlertDescription>
        </Alert>
        
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  const displayName = profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Volunteer';
  const currentLevel = profile?.level || 1;
  const currentXp = profile?.xp_points || 0;
  const nextLevelXp = getXpForNextLevel(currentLevel);

  return (
    <ErrorBoundary>
      <div className="space-y-6">
          <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome back, {displayName}!</h1>
              <p className="text-muted-foreground">Ready to make a difference? Here's what's happening in your volunteer journey.</p>
          </div>
          
          {hasSkills === false && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your skills haven't been assigned yet. Contact an administrator to get your skills set up so you can start applying for missions.
              </AlertDescription>
            </Alert>
          )}
          
          {activeMissions.length > 0 && (
              <Card className="bg-primary/10 border-primary/20">
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Rocket className="text-primary"/>Your Active Mission</CardTitle>
                  </CardHeader>
                  <CardContent>
                      {activeMissions.map(mission => (
                          <div key={mission.id}>
                              <h3 className="font-semibold">{mission.title}</h3>
                              <p className="text-sm text-muted-foreground mb-4">Organization: {mission.organization_name}</p>
                              <Button onClick={() => navigate(`/mission/${mission.id}`)}>Go to Mission Workspace</Button>
                          </div>
                      ))}
                  </CardContent>
              </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Current Level</CardTitle><Award className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{currentLevel}</div><p className="text-xs text-muted-foreground">Volunteer Status</p></CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">XP Points</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{currentXp}</div><p className="text-xs text-muted-foreground">Experience gained</p></CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Active Missions</CardTitle><Target className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{activeMissions.length}</div><p className="text-xs text-muted-foreground">Currently participating</p></CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Hours Contributed</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">0</div><p className="text-xs text-muted-foreground">Total volunteer time</p></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                  <CardHeader><CardTitle>Available Missions</CardTitle><p className="text-sm text-muted-foreground">Discover new opportunities to make an impact</p></CardHeader>
                  <CardContent>
                      {availableMissions.length === 0 ? (
                          <div className="text-center py-8"><p className="text-muted-foreground">No missions available at the moment.</p><p className="text-sm text-muted-foreground">Check back later for new opportunities!</p></div>
                      ) : (
                          <div className="space-y-4">
                              {availableMissions.map((mission) => (
                                  <div key={mission.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                                      <h4 className="font-medium mb-2">{mission.title}</h4>
                                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{mission.description}</p>
                                      <div className="flex items-center justify-between">
                                          <span className="text-sm text-muted-foreground">{mission.organization_name || 'Organization'}</span>
                                          <Button size="sm" variant="outline" onClick={() => navigate(`/mission-detail/${mission.id}`)}>Learn More</Button>
                                      </div>
                                  </div>
                              ))}
                              <Button variant="outline" className="w-full" onClick={() => navigate('/missions')}>View All Missions</Button>
                          </div>
                      )}
                  </CardContent>
              </Card>

              <Card>
                  <CardHeader><CardTitle>Your Progress</CardTitle><p className="text-sm text-muted-foreground">Track your volunteer journey</p></CardHeader>
                  <CardContent className="space-y-6">
                      <div>
                          <div className="flex justify-between text-sm mb-2"><span>Level Progress</span><span>{currentXp} / {nextLevelXp} XP</span></div>
                          <Progress value={Math.min((currentXp / nextLevelXp) * 100, 100)} />
                      </div>
                      <div className="space-y-3">
                          <h4 className="font-medium">Next Steps</h4>
                          <div className="space-y-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-primary rounded-full" />Complete your profile</div>
                              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-muted rounded-full" />Apply for your first mission</div>
                          </div>
                      </div>
                      <Button className="w-full" onClick={() => navigate('/settings')}>Complete Profile</Button>
                  </CardContent>
              </Card>
          </div>
      </div>
    </ErrorBoundary>
  );
};

export default VolunteerDashboard;