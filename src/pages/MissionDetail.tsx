import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Clock, Users, ArrowLeft, MapPin, Calendar, Briefcase } from 'lucide-react';

interface Mission {
  id: string;
  title: string;
  description: string;
  estimated_hours: number;
  difficulty_level: string;
  status: string;
  created_at: string;
  organization: {
    name: string;
    logo_url?: string;
  };
  skills: { name: string }[];
  applicant_count: number;
  user_application?: {
    id: string;
    status: string;
    application_message: string;
  };
}

export default function MissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }
    fetchMissionDetail();
  }, [id, user]);

  const fetchMissionDetail = async () => {
    try {
      setLoading(true);
      
      // Fetch mission with organization and skills
      const { data: missionData, error: missionError } = await supabase
        .from('missions')
        .select(`
          *,
          organization:organizations!inner(name, logo_url)
        `)
        .eq('id', id)
        .single();

      if (missionError) throw missionError;

      // Fetch skills for this mission
      const { data: skillsData } = await supabase
        .from('mission_template_skills')
        .select('skills(name)')
        .eq('template_id', missionData.template_id);

      // Get application count
      const { count: applicantCount } = await supabase
        .from('mission_applications')
        .select('*', { count: 'exact', head: true })
        .eq('mission_id', id);

      // Check if user has already applied
      let userApplication = null;
      if (user) {
        const { data: appData } = await supabase
          .from('mission_applications')
          .select('*')
          .eq('mission_id', id)
          .eq('volunteer_id', user.id)
          .maybeSingle();
        
        userApplication = appData;
      }

      setMission({
        ...missionData,
        skills: skillsData?.map(s => s.skills).flat() || [],
        applicant_count: applicantCount || 0,
        user_application: userApplication
      });
    } catch (error) {
      console.error('Error fetching mission:', error);
      toast({
        title: "Error",
        description: "Failed to load mission details. Please try again.",
        variant: "destructive"
      });
      navigate('/mission-discovery');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to apply for missions.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (!applicationMessage.trim()) {
      toast({
        title: "Application Message Required",
        description: "Please provide a message with your application.",
        variant: "destructive"
      });
      return;
    }

    try {
      setApplying(true);
      
      const { error } = await supabase
        .from('mission_applications')
        .insert({
          mission_id: id,
          volunteer_id: user.id,
          application_message: applicationMessage.trim(),
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully!"
      });

      setDialogOpen(false);
      setApplicationMessage('');
      fetchMissionDetail(); // Refresh to show application status
    } catch (error) {
      console.error('Error applying:', error);
      toast({
        title: "Application Failed",
        description: "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-6 w-32" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Mission Not Found</h1>
        <p className="text-muted-foreground mb-6">The mission you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/mission-discovery')}>
          Browse Other Missions
        </Button>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-700 dark:text-green-300';
      case 'intermediate': return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-orange-700 dark:text-orange-300';
      case 'advanced': return 'bg-gradient-to-r from-red-500/20 to-purple-500/20 text-red-700 dark:text-red-300';
      default: return 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Back Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <span className="text-sm text-muted-foreground">Mission Details</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mission Header */}
            <Card className="shadow-lg border-0 bg-gradient-to-r from-card via-card to-card/80">
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold leading-tight">{mission.title}</h1>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {mission.organization.logo_url ? (
                          <img 
                            src={mission.organization.logo_url} 
                            alt={`${mission.organization.name} logo`}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {mission.organization.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <span className="font-medium text-foreground">{mission.organization.name}</span>
                      </div>
                      <Badge variant="outline" className={getDifficultyColor(mission.difficulty_level)}>
                        {mission.difficulty_level}
                      </Badge>
                    </div>
                  </div>
                  {mission.user_application && (
                    <Badge variant={getStatusBadgeVariant(mission.user_application.status) as any}>
                      {mission.user_application.status}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Mission Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10">
                    <Clock className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Estimated</p>
                      <p className="text-sm font-medium">{mission.estimated_hours}h</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-secondary/5 to-secondary/10">
                    <Users className="w-4 h-4 text-secondary-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Applicants</p>
                      <p className="text-sm font-medium">{mission.applicant_count}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-accent/5 to-accent/10">
                    <Calendar className="w-4 h-4 text-accent-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Posted</p>
                      <p className="text-sm font-medium">
                        {new Date(mission.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-muted/5 to-muted/15">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="text-sm font-medium capitalize">{mission.status}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">About This Mission</h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-foreground/80 leading-relaxed">{mission.description}</p>
                  </div>
                </div>

                {/* Skills */}
                {mission.skills.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {mission.skills.map((skill, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/80 hover:to-secondary"
                        >
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/90">
              <CardHeader>
                <CardTitle className="text-lg">Apply for Mission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!user ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Sign in to apply for this mission and make a difference.
                    </p>
                    <Button 
                      onClick={() => navigate('/auth')} 
                      className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                    >
                      Sign In to Apply
                    </Button>
                  </div>
                ) : mission.user_application ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30">
                      <p className="text-sm font-medium mb-1">Application Status</p>
                      <Badge variant={getStatusBadgeVariant(mission.user_application.status) as any}>
                        {mission.user_application.status}
                      </Badge>
                    </div>
                    
                    {mission.user_application.application_message && (
                      <div className="p-3 rounded-lg bg-gradient-to-r from-secondary/10 to-secondary/5">
                        <p className="text-sm font-medium mb-1">Your Message</p>
                        <p className="text-sm text-muted-foreground">
                          {mission.user_application.application_message}
                        </p>
                      </div>
                    )}
                  </div>
                ) : mission.status === 'open' ? (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
                        Apply Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Apply for {mission.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="message">Application Message</Label>
                          <Textarea
                            id="message"
                            placeholder="Tell the organization why you're interested in this mission and what you can contribute..."
                            value={applicationMessage}
                            onChange={(e) => setApplicationMessage(e.target.value)}
                            className="min-h-[100px] mt-2"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setDialogOpen(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleApply} 
                            disabled={applying || !applicationMessage.trim()}
                            className="flex-1"
                          >
                            {applying ? 'Submitting...' : 'Submit Application'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      This mission is no longer accepting applications.
                    </p>
                    <Button variant="outline" className="w-full" disabled>
                      Mission Closed
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Info Card */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/90">
              <CardHeader>
                <CardTitle className="text-lg">Mission Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Join {mission.applicant_count} other volunteers interested in making a difference through this mission.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}