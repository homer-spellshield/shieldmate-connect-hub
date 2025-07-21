import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, Clock, MessageSquare, ShieldCheck, XCircle } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';

type Application = {
  id: string;
  application_message: string | null;
  applied_at: string;
  status: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    bio: string | null;
  } | null;
};

const MissionApplications = () => {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [missionTitle, setMissionTitle] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!missionId) return;
      try {
        setLoading(true);

        const { data: missionData, error: missionError } = await supabase
          .from('missions')
          .select('title')
          .eq('id', missionId)
          .single();

        if (missionError) throw missionError;
        setMissionTitle(missionData.title);

        const { data: appData, error: appError } = await supabase
          .from('mission_applications')
          .select(`
            id,
            application_message,
            applied_at,
            status,
            profiles!mission_applications_volunteer_id_fkey ( first_name, last_name, bio )
          `)
          .eq('mission_id', missionId);

        if (appError) throw appError;
        setApplications(appData as Application[]);

      } catch (error: any) {
        toast({ title: "Error", description: "Failed to load applications.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, [missionId, toast]);

  const handleUpdateStatus = async (applicationId: string, newStatus: 'accepted' | 'rejected') => {
    setProcessingId(applicationId);
    try {
      // Update the application status
      const { error: updateError } = await supabase
        .from('mission_applications')
        .update({ status: newStatus })
        .eq('id', applicationId);
      if (updateError) throw updateError;
      
      // If accepted, update the mission status and reject other applications
      if (newStatus === 'accepted' && missionId) {
        await supabase
            .from('missions')
            .update({ status: 'in_progress' })
            .eq('id', missionId);
        
        // Optionally, reject other pending applications for this mission
        const otherApps = applications.filter(app => app.id !== applicationId && app.status === 'pending');
        for (const app of otherApps) {
            await supabase.from('mission_applications').update({ status: 'rejected' }).eq('id', app.id);
        }
      }

      toast({ title: "Success", description: `Application has been ${newStatus}.` });
      // Refresh the list
      const updatedApps = applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : 
        (app.status === 'pending' && newStatus === 'accepted') ? { ...app, status: 'rejected' } : app
      );
      setApplications(updatedApps);

    } catch (error: any) {
      toast({ title: "Error", description: "Failed to update application status.", variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };
  
  const getInitials = (firstName: string | null, lastName: string | null) => `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" onClick={() => navigate('/org-missions')}><ArrowLeft className="h-4 w-4 mr-2" />Back to My Missions</Button>
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Review Applications</h1>
        <p className="text-muted-foreground">For mission: <span className="font-semibold text-primary">{missionTitle}</span></p>
      </div>

      {loading ? (
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium">No Applications Yet</h3>
            <p className="text-muted-foreground">Applications from volunteers will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <Card key={app.id}>
              <CardHeader className='flex-row items-start justify-between'>
                <div className="flex items-start space-x-4">
                  <Avatar className="w-12 h-12"><AvatarFallback>{getInitials(app.profiles?.first_name, app.profiles?.last_name)}</AvatarFallback></Avatar>
                  <div>
                    <h3 className="font-semibold">{app.profiles?.first_name} {app.profiles?.last_name}</h3>
                    <p className="text-sm text-muted-foreground">{app.profiles?.bio || "No bio provided."}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Applied on {new Date(app.applied_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <Badge variant={app.status === 'accepted' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">{app.status}</Badge>
              </CardHeader>
              <CardContent>
                {app.application_message && (
                  <div className="border p-4 rounded-md bg-muted/50 mb-4">
                    <p className="text-sm italic">{app.application_message}</p>
                  </div>
                )}
                {app.status === 'pending' && (
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(app.id, 'rejected')} disabled={!!processingId}>
                      <XCircle className="h-4 w-4 mr-2"/> Reject
                    </Button>
                    <Button size="sm" onClick={() => handleUpdateStatus(app.id, 'accepted')} disabled={!!processingId} >
                       {processingId === app.id ? 'Processing...' : <><ShieldCheck className="h-4 w-4 mr-2"/> Accept</>}
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

export default MissionApplications;
