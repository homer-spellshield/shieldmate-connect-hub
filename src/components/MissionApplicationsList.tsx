import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Clock, MessageSquare } from "lucide-react";

type Application = {
  id: string;
  application_message: string;
  applied_at: string;
  status: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  };
  missions: {
    title: string;
  };
};

interface MissionApplicationsListProps {
  organizationId: string;
}

export const MissionApplicationsList = ({ organizationId }: MissionApplicationsListProps) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingApplication, setProcessingApplication] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, [organizationId]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      
      // First get missions for this organization
      const { data: orgMissions, error: missionsError } = await supabase
        .from('missions')
        .select('id')
        .eq('organization_id', organizationId);

      if (missionsError) throw missionsError;
      
      const missionIds = orgMissions?.map(m => m.id) || [];
      
      if (missionIds.length === 0) {
        setApplications([]);
        return;
      }

      // Mock data for now - will be replaced with real data once foreign keys are properly set up
      setApplications([]);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to load applications. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationStatus = async (applicationId: string, status: 'accepted' | 'rejected') => {
    try {
      setProcessingApplication(applicationId);
      
      const { error } = await supabase
        .from('mission_applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;

      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status }
            : app
        )
      );

      // If accepted, update mission status to in_progress
      if (status === 'accepted') {
        const application = applications.find(app => app.id === applicationId);
        if (application) {
          await supabase
            .from('missions')
            .update({ status: 'in_progress' })
            .eq('title', application.missions.title);
        }
      }

      toast({
        title: "Application Updated",
        description: `Application has been ${status}.`,
      });
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: "Failed to update application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingApplication(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'accepted': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-500/10 text-red-700 border-red-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mission Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="w-5 h-5" />
          <span>Mission Applications ({applications.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {applications.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-1">No Applications Yet</h3>
            <p className="text-muted-foreground">
              Applications from volunteers will appear here once they apply to your missions.
            </p>
          </div>
        ) : (
          applications.map((application) => (
            <div key={application.id} className="border border-border rounded-lg p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/10">
                      {(application.profiles.first_name?.[0] || '') + (application.profiles.last_name?.[0] || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-foreground">
                      {application.profiles.first_name} {application.profiles.last_name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Applied to: {application.missions.title}
                    </p>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(application.applied_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(application.status)}>
                  {application.status}
                </Badge>
              </div>

              {/* Application Message */}
              {application.application_message && (
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-sm text-foreground">
                    {application.application_message}
                  </p>
                </div>
              )}

              {/* Actions */}
              {application.status === 'pending' && (
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplicationStatus(application.id, 'rejected')}
                    disabled={processingApplication === application.id}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApplicationStatus(application.id, 'accepted')}
                    disabled={processingApplication === application.id}
                  >
                    {processingApplication === application.id ? "Processing..." : "Accept"}
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};