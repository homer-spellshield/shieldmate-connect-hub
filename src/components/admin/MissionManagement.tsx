import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, RefreshCw } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface Mission {
  id: string;
  title: string;
  status: string;
  estimated_hours: number | null;
  organizations: {
    name: string;
  } | null;
  created_at: string;
}

export const MissionManagement = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('missions')
        .select(`
          id,
          title,
          status,
          estimated_hours,
          created_at,
          organizations (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMissions(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch missions: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteMissions = async (missionIds: string[]) => {
    try {
      setDeleting(prev => [...prev, ...missionIds]);
      
      const { error } = await supabase.rpc('admin_delete_missions', {
        p_mission_ids: missionIds
      });

      if (error) throw error;

      setMissions(prev => prev.filter(m => !missionIds.includes(m.id)));
      toast({
        title: 'Success',
        description: `Deleted ${missionIds.length} mission(s)`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete missions: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(prev => prev.filter(id => !missionIds.includes(id)));
    }
  };

  const deleteCompletedMissions = async () => {
    const completedMissions = missions.filter(m => m.status === 'completed');
    if (completedMissions.length === 0) {
      toast({
        title: 'Info',
        description: 'No completed missions to delete',
      });
      return;
    }
    await deleteMissions(completedMissions.map(m => m.id));
    setDeleteAllDialogOpen(false);
  };

  const deleteSingleMission = async () => {
    if (selectedMissionId) {
      await deleteMissions([selectedMissionId]);
      setDeleteDialogOpen(false);
      setSelectedMissionId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'pending_closure': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mission Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <Skeleton className="h-5 w-64 mb-2" />
              <div className="flex gap-2 mb-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Mission Management</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMissions}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={missions.filter(m => m.status === 'completed').length === 0}
            onClick={() => setDeleteAllDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Completed
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {missions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No missions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {missions.map((mission) => (
              <div
                key={mission.id}
                className="border rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{mission.title}</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getStatusColor(mission.status)}>
                      {mission.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {mission.organizations?.name || 'Unknown Org'}
                    </span>
                    {mission.estimated_hours && (
                      <span className="text-sm text-muted-foreground">
                        {mission.estimated_hours}h
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(mission.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleting.includes(mission.id)}
                  onClick={() => {
                    setSelectedMissionId(mission.id);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Mission"
        description="This will permanently delete this mission and all related data. This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={deleteSingleMission}
      />

      <ConfirmationDialog
        open={deleteAllDialogOpen}
        onOpenChange={setDeleteAllDialogOpen}
        title="Delete All Completed Missions"
        description="This will permanently delete all completed missions and their related data. This action cannot be undone."
        confirmText="Delete All"
        variant="destructive"
        onConfirm={deleteCompletedMissions}
      />
    </Card>
  );
};