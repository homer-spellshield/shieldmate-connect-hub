import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Paperclip, Send, Briefcase, Clock, BarChart3, Users, FileText, Download, Trash2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

// Type for a single chat message
type ChatMessage = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
};

// Type for a single mission file
type MissionFile = {
    id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    created_at: string;
    user_id: string;
    profiles: {
        first_name: string | null;
        last_name: string | null;
    } | null;
};

// Define a more detailed type for our fetched mission data
type MissionDetails = {
  id: string;
  title: string;
  description: string;
  estimated_hours: number | null;
  difficulty_level: string | null;
  organizations: {
    id: string;
    name: string;
  } | null;
  mission_applications: {
    profiles: {
      user_id: string;
      first_name: string | null;
      last_name: string | null;
    } | null;
  }[];
  mission_templates: {
    mission_template_skills: {
      skills: {
        name: string;
      } | null;
    }[];
  } | null;
};

// A simple function to generate a consistent operation name
const generateOperationName = (missionId: string) => {
    const names = ["Wombat", "Fortify", "Blizzard", "Eagle", "Phoenix", "Anchor", "Compass", "Summit", "Velocity"];
    const hash = missionId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `Operation ${names[hash % names.length]}`;
};


const MissionControl = () => {
    const { missionId } = useParams<{ missionId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const [mission, setMission] = useState<MissionDetails | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [missionFiles, setMissionFiles] = useState<MissionFile[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Effect for fetching all initial data
    useEffect(() => {
        const fetchAllData = async () => {
            if (!missionId || !user) return;

            try {
                setLoading(true);
                // Fetch mission details, messages, and files concurrently
                const [missionRes, messagesRes, filesRes] = await Promise.all([
                    supabase
                        .from('missions')
                        .select(`*, organizations(id, name), mission_applications(profiles(user_id, first_name, last_name)), mission_templates(mission_template_skills(skills(name)))`)
                        .eq('id', missionId)
                        .eq('mission_applications.status', 'accepted')
                        .single(),
                    supabase
                        .from('mission_messages')
                        .select(`*, profiles(first_name, last_name)`)
                        .eq('mission_id', missionId)
                        .order('created_at', { ascending: true }),
                    supabase
                        .from('mission_files')
                        .select(`*, profiles(first_name, last_name)`)
                        .eq('mission_id', missionId)
                        .order('created_at', { ascending: false })
                ]);

                if (missionRes.error) throw missionRes.error;
                if (!missionRes.data) throw new Error("Mission not found or you don't have access.");
                setMission(missionRes.data as MissionDetails);

                if (messagesRes.error) throw messagesRes.error;
                setMessages(messagesRes.data as ChatMessage[]);

                if (filesRes.error) throw filesRes.error;
                setMissionFiles(filesRes.data as MissionFile[]);

            } catch (error: any) {
                toast({ title: "Error", description: error.message, variant: "destructive" });
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [missionId, user, toast, navigate]);

    // Effect for real-time subscriptions
    useEffect(() => {
        if (!missionId) return;

        const chatChannel = supabase.channel(`mission_chat_${missionId}`)
            .on<ChatMessage>('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mission_messages', filter: `mission_id=eq.${missionId}` }, async payload => {
                const { data: profileData } = await supabase.from('profiles').select('first_name, last_name').eq('user_id', payload.new.user_id).single();
                setMessages(current => [...current, { ...payload.new, profiles: profileData } as ChatMessage]);
            }).subscribe();

        const filesChannel = supabase.channel(`mission_files_${missionId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'mission_files', filter: `mission_id=eq.${missionId}` }, async () => {
                const { data: filesData, error: filesError } = await supabase.from('mission_files').select(`*, profiles(first_name, last_name)`).eq('mission_id', missionId).order('created_at', { ascending: false });
                if (!filesError) setMissionFiles(filesData as MissionFile[]);
            }).subscribe();

        return () => {
            supabase.removeChannel(chatChannel);
            supabase.removeChannel(filesChannel);
        };
    }, [missionId]);

    // Effect to scroll chat
    useEffect(() => {
        if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !missionId) return;
        const content = newMessage.trim();
        setNewMessage("");
        const { error } = await supabase.from('mission_messages').insert({ content, mission_id: missionId, user_id: user.id });
        if (error) {
            toast({ title: "Error sending message", description: error.message, variant: "destructive" });
            setNewMessage(content);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0 || !user || !missionId) return;
        const file = event.target.files[0];
        if (file.size > 20971520) { // 20MB
            toast({ title: "File too large", description: "Please upload files smaller than 20MB.", variant: "destructive" });
            return;
        }
        try {
            setUploading(true);
            const filePath = `${missionId}/${user.id}/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage.from('mission-files').upload(filePath, file);
            if (uploadError) throw uploadError;

            const { error: dbError } = await supabase.from('mission_files').insert({
                mission_id: missionId,
                user_id: user.id,
                file_name: file.name,
                file_path: filePath,
                file_size: file.size,
                file_type: file.type,
            });
            if (dbError) throw dbError;
            toast({ title: "Success", description: "File uploaded successfully." });
        } catch (error: any) {
            toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        } finally {
            setUploading(false);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleFileDelete = async (file: MissionFile) => {
        if (!user || user.id !== file.user_id) return;
        if (!confirm(`Are you sure you want to delete "${file.file_name}"?`)) return;
        try {
            const { error: storageError } = await supabase.storage.from('mission-files').remove([file.file_path]);
            if (storageError) throw storageError;
            const { error: dbError } = await supabase.from('mission_files').delete().eq('id', file.id);
            if (dbError) throw dbError;
            toast({ title: "Success", description: "File deleted." });
        } catch (error: any) {
            toast({ title: "Error", description: `Failed to delete file: ${error.message}`, variant: "destructive" });
        }
    };

    const handleFileDownload = async (file: MissionFile) => {
        try {
            const { data, error } = await supabase.storage.from('mission-files').download(file.file_path);
            if (error) throw error;
            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.file_name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error: any) {
             toast({ title: "Error", description: `Failed to download file: ${error.message}`, variant: "destructive" });
        }
    };

    if (loading) return <MissionControlSkeleton />;
    if (!mission) return <div className="text-center py-10"><h2 className="text-xl font-semibold">Mission Not Found</h2><p className="text-muted-foreground">The requested mission could not be loaded.</p></div>;

    const volunteerProfile = mission.mission_applications?.[0]?.profiles;
    const volunteerName = volunteerProfile ? `${volunteerProfile.first_name} ${volunteerProfile.last_name}` : 'N/A';
    const volunteerInitials = `${volunteerProfile?.first_name?.[0] || ''}${volunteerProfile?.last_name?.[0] || ''}`;
    const skills = mission.mission_templates?.mission_template_skills.map(s => s.skills?.name).filter(Boolean) as string[] || [];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-sm font-semibold text-primary">{generateOperationName(mission.id)}</h2>
                <h1 className="text-3xl font-bold tracking-tight">{mission.title}</h1>
                <div className="flex items-center space-x-2 text-muted-foreground mt-1">
                    <Briefcase className="h-4 w-4" />
                    <span>{mission.organizations?.name}</span>
                    <span className="text-xs">&bull;</span>
                    <Users className="h-4 w-4" />
                    <span>{volunteerName}</span>
                </div>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Communication Channel</CardTitle></CardHeader>
                        <CardContent className="flex flex-col h-[32rem]">
                            <div ref={chatContainerRef} className="flex-1 space-y-4 overflow-y-auto p-4 border rounded-md bg-muted/50 mb-4">
                                {messages.map(msg => {
                                    const isCurrentUser = msg.user_id === user?.id;
                                    const senderName = `${msg.profiles?.first_name} ${msg.profiles?.last_name}`;
                                    const senderInitials = `${msg.profiles?.first_name?.[0] || ''}${msg.profiles?.last_name?.[0] || ''}`;
                                    return (
                                        <div key={msg.id} className={`flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                                            <Avatar className="w-8 h-8"><AvatarFallback>{isCurrentUser ? 'You' : senderInitials}</AvatarFallback></Avatar>
                                            <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                                <p className="font-semibold text-sm">{isCurrentUser ? 'You' : senderName}</p>
                                                <div className={`p-3 rounded-lg mt-1 max-w-xs md:max-w-md ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-background'}`}><p className="text-sm whitespace-pre-wrap">{msg.content}</p></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                <Button variant="outline" size="icon" type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}><Paperclip className="h-4 w-4" /></Button>
                                <Input placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                                <Button type="submit"><Send className="h-4 w-4" /></Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>File Repository</CardTitle><CardDescription>Upload and share mission-related files securely.</CardDescription></CardHeader>
                        <CardContent>
                            {uploading && <p className="text-sm text-muted-foreground text-center">Uploading file...</p>}
                            {missionFiles.length === 0 && !uploading ? (
                                <p className="text-center text-muted-foreground py-8">No files have been uploaded for this mission yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {missionFiles.map(file => (
                                        <div key={file.id} className="flex items-center justify-between p-2 rounded-md border hover:bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-5 w-5 text-primary" />
                                                <div>
                                                    <p className="font-medium text-sm">{file.file_name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Uploaded by {file.profiles?.first_name || 'User'} {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleFileDownload(file)}><Download className="h-4 w-4" /></Button>
                                                {user?.id === file.user_id && (
                                                    <Button variant="ghost" size="icon" onClick={() => handleFileDelete(file)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Mission Briefing</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground mb-1">Scope & Objectives</h4>
                                <p className="text-sm">{mission.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div className="flex items-center space-x-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Est. Hours</p>
                                        <p className="text-sm font-medium">{mission.estimated_hours ? `${mission.estimated_hours}h` : 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Difficulty</p>
                                        <Badge variant="outline" className="capitalize">{mission.difficulty_level || 'N/A'}</Badge>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground mb-2">Required Skills</h4>
                                <div className="flex flex-wrap gap-2">{skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Mission Actions</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="destructive" className="w-full">Mark Mission as Complete</Button>
                            <Button variant="outline" className="w-full">Request Help from Admin</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const MissionControlSkeleton = () => (
    <div className="space-y-6">
      <div><Skeleton className="h-4 w-1/4" /><Skeleton className="h-9 w-3/4 mt-2" /><Skeleton className="h-4 w-1/2 mt-2" /></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-[32rem] w-full" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
            <CardContent className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-12 w-full" /></CardContent>
          </Card>
        </div>
      </div>
    </div>
);

export default MissionControl;
