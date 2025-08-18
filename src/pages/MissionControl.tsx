import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Paperclip, Send, Briefcase, Clock, BarChart3, Users, FileText, Download, Trash2, CheckCircle, Star } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from "@/lib/utils";

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

type MissionRating = Database['public']['Tables']['mission_ratings']['Row'] & {
    profiles: ProfileInfo
};

type MissionDetails = Database['public']['Tables']['missions']['Row'] & {
  organizations: Pick<Database['public']['Tables']['organizations']['Row'], 'id' | 'name'> | null;
  mission_applications: {
    status: string;
    profiles: (Pick<Database['public']['Tables']['profiles']['Row'], 'user_id' | 'first_name' | 'last_name'> & { email?: string | null }) | null;
  }[];
  mission_templates: {
    mission_template_skills: {
      skills: Pick<Database['public']['Tables']['skills']['Row'], 'name'> | null;
    }[];
  } | null;
  org_closed?: boolean;
  volunteer_closed?: boolean;
  closure_initiated_at?: string;
};

const StarRating = ({ rating, setRating, disabled = false }: { rating: number; setRating: (rating: number) => void; disabled?: boolean }) => (
    <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
            <Star
                key={star}
                className={cn(
                    "h-6 w-6",
                    rating >= star ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground",
                    !disabled && "cursor-pointer"
                )}
                onClick={() => !disabled && setRating(star)}
            />
        ))}
    </div>
);


const MissionControl = () => {
    const { missionId } = useParams<{ missionId: string }>();
    const navigate = useNavigate();
    const { user, profile, userRoles } = useAuth();
    const { toast } = useToast();

    const [mission, setMission] = useState<MissionDetails | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [missionFiles, setMissionFiles] = useState<MissionFile[]>([]);
    const [ratings, setRatings] = useState<MissionRating[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isRatingOpen, setIsRatingOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState("");
    
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isOrganizationMember = userRoles.includes('organization_owner') || userRoles.includes('team_member');
    const isVolunteer = userRoles.includes('volunteer');
    const userHasRated = ratings.some(r => r.rater_user_id === user?.id);

    const getDisplayName = (p: ProfileInfo) => {
        const name = `${p?.first_name || ''} ${p?.last_name || ''}`.trim();
        return name || p?.email || 'A user';
    };

    const fetchAllData = async () => {
        if (!missionId || !user) return;
        setLoading(true);
        try {
            const { data: missionData, error: missionError } = await supabase.from('missions').select(`*, organizations ( id, name ), mission_applications ( status, profiles ( user_id, first_name, last_name, email ) ), mission_templates ( mission_template_skills ( skills ( name ) ) )`).eq('id', missionId).single();
            if (missionError) throw missionError;
            setMission(missionData as any);

            const [messagesRes, filesRes, ratingsRes] = await Promise.all([
                supabase.from('mission_messages').select('*, profiles ( user_id, first_name, last_name, email )').eq('mission_id', missionId).order('created_at'),
                supabase.from('mission_files').select('*, profiles ( user_id, first_name, last_name, email )').eq('mission_id', missionId).order('created_at', { ascending: false }),
                supabase.from('mission_ratings').select('*, profiles!mission_ratings_rater_user_id_fkey ( user_id, first_name, last_name, email )').eq('mission_id', missionId)
            ]);
            if (messagesRes.error) throw messagesRes.error;
            setMessages(messagesRes.data as any || []);
            if (filesRes.error) throw filesRes.error;
            setMissionFiles(filesRes.data as any || []);
            if (ratingsRes.error) throw ratingsRes.error;
            setRatings(ratingsRes.data as any || []);
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
                const { data } = await supabase
                  .rpc('get_profile_for_mission', { p_mission_id: missionId, p_user_id: payload.new.user_id })
                  .single();
                setMessages(currentMessages => [...currentMessages, { ...payload.new, profiles: data } as ChatMessage]);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'mission_files', filter: `mission_id=eq.${missionId}`}, () => fetchAllData())
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'missions', filter: `id=eq.${missionId}`}, () => fetchAllData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'mission_ratings', filter: `mission_id=eq.${missionId}`}, () => fetchAllData())
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
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/png',
            'image/jpeg',
            'text/plain'
        ];
        if (!allowedTypes.includes(file.type)) {
            toast({ title: "Unsupported file type", description: "Allowed: PDF, DOC, DOCX, XLSX, PNG, JPG, TXT.", variant: "destructive" });
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

    const handleMarkAsComplete = async () => {
        if (!missionId) return;
        try {
            const { error } = await supabase.functions.invoke('initiate-mission-closure', {
                body: { mission_id: missionId },
            });
            if (error) throw error;
            toast({ title: "Status Updated", description: "Awaiting confirmation from the other party to close the mission." });
            await fetchAllData();
        } catch (error: any) {
            toast({ title: "Error", description: `Failed to update mission status: ${error.message}`, variant: "destructive" });
        }
    };
    
    const handleSubmitRating = async () => {
        if (!mission || !user || !missionId) return;
        const acceptedApplication = mission.mission_applications?.find(app => app.status === 'accepted');
        const volunteerProfile = acceptedApplication?.profiles;
        if (!volunteerProfile) return;
    
        const raterIsVolunteer = user.id === volunteerProfile.user_id;
        let ratedUserId: string;
        
        if (raterIsVolunteer) {
            // Volunteer is rating the organization - need to find the organization owner
            const { data: orgOwner, error } = await supabase
                .from('organization_members')
                .select('user_id')
                .eq('organization_id', mission.organization_id)
                .eq('role', 'owner')
                .single();
            
            if (error || !orgOwner) {
                toast({ title: "Error", description: "Could not find organization contact to rate.", variant: "destructive" });
                return;
            }
            ratedUserId = orgOwner.user_id;
        } else {
            // Organization member is rating the volunteer
            ratedUserId = volunteerProfile.user_id;
        }
    
        if (!ratedUserId) {
            toast({ title: "Error", description: "Could not identify the user to rate.", variant: "destructive" });
            return;
        }
    
        try {
            const { error } = await supabase.from('mission_ratings').insert({
                mission_id: missionId,
                rater_user_id: user.id,
                rated_user_id: ratedUserId,
                rating: rating,
                review_text: review,
            });
            if (error) throw error;
            toast({ title: "Success", description: "Your review has been submitted." });
            setIsRatingOpen(false);
            setRating(0);
            setReview("");
            fetchAllData();
        } catch (error: any) {
            toast({ title: "Error", description: `Failed to submit review: ${error.message}`, variant: "destructive" });
        }
    };
    

    if (loading) return <MissionControlSkeleton />;
    if (!mission) return <div className="text-center p-8">Mission Not Found or Access Denied.</div>;

    const volunteerProfile = mission.mission_applications?.find(app => app.status === 'accepted')?.profiles;
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
                                <Input placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} disabled={mission.status === 'completed'} />
                                <Button type="submit" disabled={mission.status === 'completed'}><Send className="h-4 w-4" /></Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>File Repository</CardTitle></CardHeader>
                        <CardContent>
                            <Button onClick={handleFileSelect} disabled={uploading || mission.status === 'completed'} className="mb-4">
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
                                            {file.user_id === user?.id && (
                                              <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                  <Button variant="ghost" size="icon" disabled={mission.status === 'completed'}>
                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                  </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                  <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete File</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                      Are you sure you want to delete "{file.file_name}"? This action cannot be undone.
                                                    </AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction 
                                                      onClick={() => handleDelete(file)}
                                                      className="bg-destructive hover:bg-destructive/90"
                                                    >
                                                      Delete
                                                    </AlertDialogAction>
                                                  </AlertDialogFooter>
                                                </AlertDialogContent>
                                              </AlertDialog>
                                            )}
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
                            {mission.status === 'in_progress' && (
                              <>
                                {(isOrganizationMember && !mission.org_closed) && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button className="w-full">Mark as Complete</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Mark Mission as Complete</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to mark this mission as complete? This will notify the volunteer and begin the closure process.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleMarkAsComplete}>
                                          Yes, Mark Complete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                                {(isVolunteer && !mission.volunteer_closed) && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button className="w-full">Mark as Complete</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Mark Mission as Complete</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to mark this mission as complete? This will notify the organization and begin the closure process.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleMarkAsComplete}>
                                          Yes, Mark Complete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                                
                                {mission.org_closed && <p className="text-sm text-center text-muted-foreground">Organisation has marked as complete.</p>}
                                {mission.volunteer_closed && <p className="text-sm text-center text-muted-foreground">Volunteer has marked as complete.</p>}
                              </>
                            )}
                            {mission.status === 'pending_closure' && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-center p-4 bg-yellow-100/50 text-yellow-700 rounded-md">
                                  <Clock className="h-5 w-5 mr-2"/>
                                  <p className="text-sm font-medium">Awaiting Final Confirmation</p>
                                </div>
                                <p className="text-xs text-center text-muted-foreground">
                                  {mission.closure_initiated_at && `Initiated ${formatDistanceToNow(new Date(mission.closure_initiated_at), { addSuffix: true })}. Auto-completes in 3 days if no response.`}
                                </p>
                                {(isOrganizationMember && !mission.org_closed) && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button className="w-full">Confirm Completion</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Confirm Mission Completion</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to confirm the completion of this mission? This action will finalize the mission closure.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleMarkAsComplete}>
                                          Yes, Confirm
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                                {(isVolunteer && !mission.volunteer_closed) && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button className="w-full">Confirm Completion</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Confirm Mission Completion</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to confirm the completion of this mission? This action will finalize the mission closure.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleMarkAsComplete}>
                                          Yes, Confirm
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            )}
                            {mission.status === 'completed' && (
                                <>
                                <div className="flex items-center justify-center p-4 bg-green-100/50 text-green-700 rounded-md">
                                    <CheckCircle className="h-5 w-5 mr-2"/>
                                    <p className="text-sm font-medium">Mission Completed</p>
                                </div>
                                {!userHasRated ? (
                                    <Dialog open={isRatingOpen} onOpenChange={setIsRatingOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="w-full mt-2" variant="outline">Rate Your Experience</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Rate Your Experience</DialogTitle>
                                                <DialogDescription>Let others know how it went working with {isVolunteer ? mission.organizations?.name : volunteerName}.</DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label>Rating</Label>
                                                    <StarRating rating={rating} setRating={setRating} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Review (Optional)</Label>
                                                    <Textarea value={review} onChange={(e) => setReview(e.target.value)} placeholder="Share your feedback..."/>
                                                </div>
                                            </div>
                                            <Button onClick={handleSubmitRating} disabled={rating === 0}>Submit Review</Button>
                                        </DialogContent>
                                    </Dialog>
                                ) : (
                                    <p className="text-sm text-center text-muted-foreground pt-2">Thank you for your feedback!</p>
                                )}
                                </>
                            )}
                            <Button variant="outline" className="w-full">Request Help</Button>
                        </CardContent>
                    </Card>
                    
                    {ratings.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>Mission Reviews</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {ratings.map(r => (
                                    <div key={r.id} className="border-b pb-2 last:border-b-0">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-sm">{getDisplayName(r.profiles)}</p>
                                            <StarRating rating={r.rating} setRating={() => {}} disabled={true} />
                                        </div>
                                        <p className="text-sm text-muted-foreground italic mt-1">"{r.review_text}"</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
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