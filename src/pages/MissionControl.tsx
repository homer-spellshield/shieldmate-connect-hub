import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Paperclip, Send, Briefcase, Clock, BarChart3, Users, FileText, Download, Trash2, CheckCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

// --- TYPE DEFINITIONS ---
type ProfileInfo = {
  first_name: string | null;
  last_name: string | null;
  email?: string | null;
  user_id: string;
} | null;

type ChatMessage = Database['public']['Tables']['mission_messages']['Row'] & {
  profiles: ProfileInfo;
};

type MissionFile = Database['public']['Tables']['mission_files']['Row'] & {
  profiles: ProfileInfo;
};

type MissionDetails = Database['public']['Tables']['missions']['Row'] & {
  organizations: Pick<Database['public']['Tables']['organizations']['Row'], 'id' | 'name'> | null;
  mission_applications: {
    profiles: (Pick<Database['public']['Tables']['profiles']['Row'], 'user_id' | 'first_name' | 'last_name'> & { email?: string | null }) | null;
  }[];
  mission_templates: {
    mission_template_skills: {
      skills: Pick<Database['public']['Tables']['skills']['Row'], 'name'> | null;
    }[];
  } | null;
};


const MissionControl = () => {
    const { missionId } = useParams<{ missionId: string }>();
    const navigate = useNavigate();
    const { user, profile, userRoles } = useAuth();
    const { toast } = useToast();

    const [mission, setMission] = useState<MissionDetails | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [missionFiles, setMissionFiles] = useState<MissionFile[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isOrganizationMember = userRoles.includes('organization_owner') || userRoles.includes('team_member');

    const getDisplayName = (p: ProfileInfo) => {
        const name = `${p?.first_name || ''} ${p?.last_name || ''}`.trim();
        return name || p?.email || 'A user';
    };

    const fetchAllData = async () => {
        if (!missionId || !user) return;
        try {
            setLoading(true);
            const { data: missionData, error: missionError } = await supabase.from('missions').select(`*, organizations ( id, name ), mission_applications ( profiles ( user_id, first_name, last_name, email ) ), mission_templates ( mission_template_skills ( skills ( name ) ) )`).eq('id', missionId).single();
            if (missionError) throw missionError;
            setMission(missionData as any);
            const { data: messagesData, error: messagesError } = await supabase.from('mission_messages').select('*, profiles ( user_id, first_name, last_name, email )').eq('mission_id', missionId).order('created_at');
            if (messagesError) throw messagesError;
            setMessages(messagesData as any || []);
            const { data: filesData, error: filesError } = await supabase.from('mission_files').select('*, profiles ( user_id, first_name, last_name, email )').eq('mission_id', missionId).order('created_at', { ascending: false });
            if (filesError) throw filesError;
            setMissionFiles(filesData as any || []);
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to load mission data: " + error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [missionId, user, toast]);

    useEffect(() => {
        if (!missionId) return;
        const channel = supabase.channel(`mission-control:${missionId}`)
            .on<ChatMessage>('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mission_messages', filter: `mission_id=eq.${missionId}` }, async payload => {
                if (payload.new.user_id === user?.id) return;
                const { data } = await supabase.from('profiles').select('user_id, first_name, last_name, email').eq('user_id', payload.new.user_id).single();
                setMessages(currentMessages => [...currentMessages, { ...payload.new, profiles: data } as ChatMessage]);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'mission_files', filter: `mission_id=eq.${missionId}`}, () => fetchAllData())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [missionId, user]);

    useEffect(() => {
        if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !missionId) return;
        const content = newMessage;
        setNewMessage("");
        const optimisticMessage: ChatMessage = {
          id: `temp_${Date.now()}`,
          content,
          created_at: new Date().toISOString(),
          user_id: user.id,
          mission_id: missionId,
          profiles: { user_id: user.id, first_name: profile?.first_name || '', last_name: profile?.last_name || '', email: user.email },
        };
        setMessages(currentMessages => [...currentMessages, optimisticMessage]);
        const { error } = await supabase.from('mission_messages').insert({ mission_id: missionId, user_id: user.id, content: content });
        if (error) {
            toast({ title: "Error sending message", description: error.message, variant: "destructive" });
            setMessages(currentMessages => currentMessages.filter(m => m.id !== optimisticMessage.id));
            setNewMessage(content);
        }
    };

    const handleFileSelect = () => fileInputRef.current?.click();

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user || !missionId) return;
        if (file.size > 20 * 1024 * 1024) { // 20MB limit
            toast({ title: "File too large", description: "Please select a file smaller than 20MB.", variant: "destructive" });
            return;
        }
        setUploading(true);
        try {
            const filePath = `${missionId}/${user.id}/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage.from('mission-files').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { error: dbError } = await supabase.from('mission_files').insert({ mission_id: missionId, user_id: user.id, file_name: file.name, file_path: filePath, file_size: file.size, file_type: file.type });
            if (dbError) throw dbError;
            toast({ title: "File Uploaded", description: `${file.name} has been added to the mission.` });
        } catch (error: any) {
            toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
        } finally {
            setUploading(false);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDownload = async (filePath: string, fileName: string) => {
        try {
            const { data, error } = await supabase.storage.from('mission-files').download(filePath);
            if (error) throw error;
            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (error: any) {
            toast({ title: "Download Failed", description: error.message, variant: "destructive" });
        }
    };

    const handleDelete = async (file: MissionFile) => {
        if (!window.confirm(`Are you sure you want to delete ${file.file_name}?`)) return;
        try {
            const { error: storageError } = await supabase.storage.from('mission-files').remove([file.file_path]);
            if (storageError) throw storageError;
            const { error: dbError } = await supabase.from('mission_files').delete().eq('id', file.id);
            if (dbError) throw dbError;
            toast({ title: "File Deleted", description: `${file.file_name} has been removed.` });
        } catch (error: any) {
            toast({ title: "Deletion Failed", description: error.message, variant: "destructive" });
        }
    };

    const handleCompleteMission = async () => {
        if (!missionId || mission?.status !== 'in_progress') return;
        if (!window.confirm("Are you sure you want to mark this mission as complete? This action cannot be undone.")) return;
        try {
            const { error } = await supabase.from('missions').update({ status: 'completed' }).eq('id', missionId);
            if (error) throw error;
            toast({ title: "Mission Complete!", description: "The mission has been successfully marked as completed." });
            navigate('/org-missions');
        } catch (error: any) {
            toast({ title: "Error", description: `Failed to update mission status: ${error.message}`, variant: "destructive" });
        }
    };

    if (loading) return <MissionControlSkeleton />;
    if (!mission) return <div className="text-center p-8">Mission Not Found or Access Denied.</div>;

    const volunteerProfile = mission.mission_applications?.find(app => app.profiles)?.profiles;
    const volunteerName = getDisplayName(volunteerProfile);
    const volunteerInitials = `${volunteerProfile?.first_name?.[0] || ''}${volunteerProfile?.last_name?.[0] || 'V'}`;
    const skills = mission.mission_templates?.mission_template_skills.map(s => s.skills?.name).filter(Boolean) as string[] || [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{mission.title}</h1>
                <div className="flex items-center space-x-2 text-muted-foreground mt-1">
                    <Briefcase className="h-4 w-4" /><span>{mission.organizations?.name}</span>
                    <span className="text-xs">&bull;</span>
                    <Users className="h-4 w-4" /><span>{volunteerName}</span>
                </div>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Communication Channel</CardTitle></CardHeader>
                        <CardContent className="flex flex-col h-[32rem]">
                            <div ref={chatContainerRef} className="flex-1 space-y-4 overflow-y-auto p-4 border rounded-md bg-muted/50 mb-4">
                                {!messages || messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">Say hello to start the conversation!</div>
                                ) : messages.map(msg => {
                                    const isCurrentUser = msg.user_id === user?.id;
                                    const senderName = getDisplayName(msg.profiles);
                                    const senderInitials = `${msg.profiles?.first_name?.[0] || ''}${msg.profiles?.last_name?.[0] || 'U'}`;
                                    return (
                                        <div key={msg.id} className={`flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                                            <Avatar className="w-8 h-8"><AvatarFallback>{isCurrentUser ? 'You' : senderInitials}</AvatarFallback></Avatar>
                                            <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-sm">{isCurrentUser ? 'You' : senderName}</p>
                                                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</p>
                                                </div>
                                                <div className={`p-3 rounded-lg mt-1 max-w-xs md:max-w-md ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-background'}`}><p className="text-sm whitespace-pre-wrap">{msg.content}</p></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <Input placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                                <Button type="submit"><Send className="h-4 w-4" /></Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>File Repository</CardTitle></CardHeader>
                        <CardContent>
                            <Button onClick={handleFileSelect} disabled={uploading} className="mb-4">
                                <Paperclip className="h-4 w-4 mr-2"/> {uploading ? 'Uploading...' : 'Upload File'}
                            </Button>
                            <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" />
                            <div className="space-y-2">
                                {missionFiles.length === 0 ? (
                                  <p className="text-sm text-muted-foreground text-center py-4">No files have been uploaded for this mission yet.</p>
                                ) : missionFiles.map(file => (
                                    <div key={file.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-6 w-6 text-muted-foreground"/>
                                            <div>
                                                <p className="font-medium text-sm">{file.file_name}</p>
                                                <p className="text-xs text-muted-foreground">Uploaded by {getDisplayName(file.profiles)} &bull; {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleDownload(file.file_path, file.file_name)}><Download className="h-4 w-4"/></Button>
                                            {file.user_id === user?.id && <Button variant="ghost" size="icon" onClick={() => handleDelete(file)}><Trash2 className="h-4 w-4 text-destructive"/></Button>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Mission Briefing</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div><h4 className="font-semibold text-sm">Description</h4><p className="text-sm text-muted-foreground">{mission.description}</p></div>
                            <div><h4 className="font-semibold text-sm">Required Skills</h4><div className="flex flex-wrap gap-2 mt-2">{skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}</div></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Est. Hours</p><p className="font-medium">{mission.estimated_hours || 'N/A'}</p></div></div>
                                <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Difficulty</p><p className="font-medium capitalize">{mission.difficulty_level || 'N/A'}</p></div></div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Mission Actions</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {isOrganizationMember && (
                                <Button className="w-full" onClick={handleCompleteMission} disabled={mission.status !== 'in_progress'}>
                                    <CheckCircle className="h-4 w-4 mr-2"/> Mark Mission as Complete
                                </Button>
                            )}
                            <Button variant="outline" className="w-full">Request Help</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const MissionControlSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div><Skeleton className="h-9 w-3/4" /><Skeleton className="h-4 w-1/2 mt-2" /></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-[32rem] w-full" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
        </div>
        <div className="space-y-6">
          <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-12 w-full" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></CardContent></Card>
        </div>
      </div>
    </div>
);

export default MissionControl;