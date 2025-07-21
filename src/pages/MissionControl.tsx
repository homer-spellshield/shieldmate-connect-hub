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
import type { Database } from '@/types/supabase';

// Define types based on your Supabase schema
type ProfileInfo = {
  first_name: string | null;
  last_name: string | null;
  email?: string | null;
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
    const { user, profile } = useAuth();
    const { toast } = useToast();

    const [mission, setMission] = useState<MissionDetails | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [missionFiles, setMissionFiles] = useState<MissionFile[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getDisplayName = (p: ProfileInfo) => {
        const name = `${p?.first_name || ''} ${p?.last_name || ''}`.trim();
        return name || p?.email || 'A user';
    };

    useEffect(() => {
        const fetchAllData = async () => {
            if (!missionId || !user) return;

            try {
                setLoading(true);
                
                const { data: missionData, error: missionError } = await supabase
                    .from('missions')
                    .select(`
                        *,
                        organizations ( id, name ),
                        mission_applications ( profiles ( user_id, first_name, last_name, email ) ),
                        mission_templates ( mission_template_skills ( skills ( name ) ) )
                    `)
                    .eq('id', missionId)
                    .single();

                if (missionError) throw missionError;
                setMission(missionData as any);
                
                const { data: messagesData, error: messagesError } = await supabase
                    .from('mission_messages')
                    .select('*, profiles ( first_name, last_name, email )')
                    .eq('mission_id', missionId)
                    .order('created_at');

                if (messagesError) throw messagesError;
                setMessages(messagesData as any || []);

                const { data: filesData, error: filesError } = await supabase
                    .from('mission_files')
                    .select('*, profiles ( first_name, last_name, email )')
                    .eq('mission_id', missionId)
                    .order('created_at', { ascending: false });

                if (filesError) throw filesError;
                setMissionFiles(filesData as any || []);

            } catch (error: any) {
                toast({ title: "Error", description: "Failed to load mission data: " + error.message, variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [missionId, user, toast]);

    useEffect(() => {
        if (!missionId) return;

        const handleNewMessage = async (payload: any) => {
          if (payload.new.user_id === user?.id) return; // Ignore our own messages which are handled optimistically
          const { data } = await supabase.from('profiles').select('first_name, last_name, email').eq('user_id', payload.new.user_id).single();
          setMessages(currentMessages => [...currentMessages, { ...payload.new, profiles: data } as ChatMessage]);
        };

        const messageChannel = supabase.channel(`mission-messages:${missionId}`)
            .on<ChatMessage>('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mission_messages', filter: `mission_id=eq.${missionId}` }, handleNewMessage)
            .subscribe();
            
        return () => { supabase.removeChannel(messageChannel); };
    }, [missionId, user]);

    useEffect(() => {
        if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !missionId) return;
        
        const tempId = `temp_${Date.now()}`;
        const content = newMessage;
        setNewMessage("");

        const optimisticMessage: ChatMessage = {
          id: tempId,
          content,
          created_at: new Date().toISOString(),
          user_id: user.id,
          mission_id: missionId,
          profiles: { first_name: profile?.first_name || '', last_name: profile?.last_name || '', email: user.email },
        };
        setMessages(currentMessages => [...currentMessages, optimisticMessage]);

        const { error } = await supabase.from('mission_messages').insert({ mission_id: missionId, user_id: user.id, content: content });

        if (error) {
            toast({ title: "Error sending message", description: error.message, variant: "destructive" });
            setMessages(currentMessages => currentMessages.filter(m => m.id !== tempId));
            setNewMessage(content);
        }
    };
    
    // File handling functions remain the same...

    if (loading) return <MissionControlSkeleton />;
    if (!mission) return <div>Mission Not Found</div>;

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
                                {messages.map(msg => {
                                    const isCurrentUser = msg.user_id === user?.id;
                                    const senderName = getDisplayName(msg.profiles);
                                    const senderInitials = `${msg.profiles?.first_name?.[0] || ''}${msg.profiles?.last_name?.[0] || 'U'}`;
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
                                <Input placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                                <Button type="submit"><Send className="h-4 w-4" /></Button>
                            </form>
                        </CardContent>
                    </Card>
                    {/* File Repository remains the same */}
                </div>
                <div className="space-y-6">
                  {/* Mission Briefing and Actions remain the same */}
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
        </div>
        <div className="space-y-6">
          <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-12 w-full" /></CardContent></Card>
        </div>
      </div>
    </div>
);

export default MissionControl;