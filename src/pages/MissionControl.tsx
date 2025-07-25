import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, Briefcase, Clock, BarChart3, Users, FileText, Download, Trash2, CheckCircle, Star, ShieldAlert,ThumbsUp } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

// --- TYPE DEFINITIONS ---
type ProfileInfo = Pick<Database['public']['Tables']['profiles']['Row'], 'user_id' | 'first_name' | 'last_name' | 'email'> | null;
type ChatMessage = Database['public']['Tables']['mission_messages']['Row'] & { profiles: ProfileInfo };
type MissionFile = Database['public']['Tables']['mission_files']['Row'] & { profiles: ProfileInfo };
type MissionRating = Database['public']['Tables']['mission_ratings']['Row'];

type MissionDetails = Database['public']['Tables']['missions']['Row'] & {
  organizations: Pick<Database['public']['Tables']['organizations']['Row'], 'id' | 'name'> | null;
  mission_applications: { volunteer_id: string, profiles: ProfileInfo }[];
  mission_templates: { mission_template_skills: { skills: Pick<Database['public']['Tables']['skills']['Row'], 'name'> | null }[] } | null;
  mission_ratings: MissionRating[];
};

// --- RATING COMPONENT ---
const StarRating = ({ rating, setRating, disabled }: { rating: number, setRating?: (rating: number) => void, disabled?: boolean }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={cn(
          "w-6 h-6",
          !disabled && "cursor-pointer",
          rating >= star ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/50"
        )}
        onClick={() => setRating && !disabled && setRating(star)}
      />
    ))}
  </div>
);

const MissionControl = () => {
    const { missionId } = useParams<{ missionId: string }>();
    const { user, profile, userRoles, refetchProfile } = useAuth();
    const { toast } = useToast();

    const [mission, setMission] = useState<MissionDetails | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [missionFiles, setMissionFiles] = useState<MissionFile[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    
    // State for the rating system
    const [myRating, setMyRating] = useState<MissionRating | null>(null);
    const [theirRating, setTheirRating] = useState<MissionRating | null>(null);
    const [currentRating, setCurrentRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isOrganizationMember = userRoles.includes('organization_owner') || userRoles.includes('team_member');

    const getDisplayName = (p: ProfileInfo) => `${p?.first_name || ''} ${p?.last_name || ''}`.trim() || p?.email || 'A user';

    const volunteerProfile = mission?.mission_applications?.[0]?.profiles;
    const volunteerId = mission?.mission_applications?.[0]?.volunteer_id;
    const organizationId = mission?.organizations?.id;
    const otherPartyUserId = isOrganizationMember ? volunteerId : user?.id; // Simplified - assumes org members are not volunteers in same mission

    const fetchAllData = async () => {
        if (!missionId || !user) return;
        try {
            setLoading(true);
            const { data, error } = await supabase.from('missions').select(`*, organizations(id, name), mission_applications(volunteer_id, profiles(*)), mission_templates(mission_template_skills(skills(name))), mission_ratings(*)`).eq('id', missionId).single();
            if (error) throw error;
            setMission(data as any);
            
            // Separate ratings
            const myCurrentRating = data.mission_ratings.find(r => r.rater_user_id === user.id) || null;
            const theirCurrentRating = data.mission_ratings.find(r => r.rater_user_id !== user.id) || null;
            setMyRating(myCurrentRating);
            setTheirRating(theirCurrentRating);

            const { data: messagesData, error: messagesError } = await supabase.from('mission_messages').select('*, profiles(*)').eq('mission_id', missionId).order('created_at');
            if (messagesError) throw messagesError;
            setMessages(messagesData as any || []);

            const { data: filesData, error: filesError } = await supabase.from('mission_files').select('*, profiles(*)').eq('mission_id', missionId).order('created_at', { ascending: false });
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
        const channel = supabase.channel(`mission-control:${missionId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'missions', filter: `id=eq.${missionId}`}, () => fetchAllData()).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [missionId, user, toast]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !missionId) return;
        const content = newMessage;
        setNewMessage("");
        await supabase.from('mission_messages').insert({ mission_id: missionId, user_id: user.id, content: content });
    };
    
    const handleProposeClosure = async () => {
        if (!missionId || !user) return;
        const { error } = await supabase.from('missions').update({ status: 'pending_closure', closure_initiator_id: user.id, closure_initiated_at: new Date().toISOString() }).eq('id', missionId);
        if (error) {
            toast({ title: "Error", description: "Could not propose closure.", variant: "destructive" });
        } else {
            toast({ title: "Closure Proposed", description: "The other party has been notified to confirm." });
            // Create notification for the other party
            if (otherPartyUserId) {
                await supabase.from('notifications').insert({ user_id: otherPartyUserId, message: `${getDisplayName(profile)} has proposed to close the mission '${mission?.title}'.`, link_url: `/mission/${missionId}` });
            }
        }
    };

    const handleConfirmClosure = async () => {
        if (!missionId) return;
        const { error } = await supabase.from('missions').update({ status: 'completed', closed_at: new Date().toISOString() }).eq('id', missionId);
        if (error) {
            toast({ title: "Error", description: "Could not confirm closure.", variant: "destructive" });
        } else {
            toast({ title: "Mission Completed!", description: "This mission is now officially closed." });
            await refetchProfile(); // This fixes the dashboard bug
        }
    };

    const handleDisputeClosure = async () => {
        if (!missionId || !user) return;
        const { error } = await supabase.from('missions').update({ status: 'in_progress', closure_initiator_id: null, closure_initiated_at: null }).eq('id', missionId);
        if (error) {
            toast({ title: "Error", description: "Could not dispute closure.", variant: "destructive" });
        } else {
            toast({ title: "Closure Disputed", description: "The mission has been returned to 'in progress'." });
            // Notify the initiator
            if (mission?.closure_initiator_id) {
                await supabase.from('notifications').insert({ user_id: mission.closure_initiator_id, message: `Your closure proposal for '${mission?.title}' was disputed.`, link_url: `/mission/${missionId}` });
            }
        }
    };

    const handleSubmitReview = async () => {
        if (currentRating === 0 || !user || !missionId || !otherPartyUserId) {
            toast({ title: "Rating required", description: "Please select a star rating.", variant: "destructive" });
            return;
        }
        setIsSubmittingReview(true);
        try {
            const { data, error } = await supabase.from('mission_ratings').insert({
                mission_id: missionId,
                rater_user_id: user.id,
                rated_user_id: otherPartyUserId,
                rating: currentRating,
                review_text: reviewText
            }).select().single();
            if (error) throw error;
            setMyRating(data);
            toast({ title: "Review Submitted", description: "Thank you for your feedback!" });
        } catch (error: any) {
             toast({ title: "Error", description: "Failed to submit review.", variant: "destructive" });
        } finally {
            setIsSubmittingReview(false);
        }
    };

    if (loading) return <MissionControlSkeleton />;
    if (!mission) return <div className="text-center p-8">Mission Not Found or Access Denied.</div>;

    const skills = mission.mission_templates?.mission_template_skills.map(s => s.skills?.name).filter(Boolean) as string[] || [];

    const MissionActions = () => {
        if (mission.status === 'completed') {
            return (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CheckCircle className="text-green-500" />Mission Complete</CardTitle>
                        <CardDescription>This mission was closed on {new Date(mission.closed_at!).toLocaleDateString()}.</CardDescription>
                    </CardHeader>
                </Card>
            );
        }

        if (mission.status === 'pending_closure') {
            const userIsInitiator = mission.closure_initiator_id === user?.id;
            return (
                 <Card>
                    <CardHeader>
                        <CardTitle>Closure Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {userIsInitiator ? (
                            <p className="text-sm text-muted-foreground text-center">You have proposed to close this mission. Awaiting confirmation from the other party.</p>
                        ) : (
                            <>
                                <p className="text-sm text-center mb-4">The other party has proposed to close this mission. Please confirm or dispute.</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" onClick={handleDisputeClosure}><ShieldAlert className="mr-2 h-4 w-4"/>Dispute</Button>
                                    <Button onClick={handleConfirmClosure}><ThumbsUp className="mr-2 h-4 w-4"/>Confirm</Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )
        }

        // Default for 'in_progress'
        return (
            <Card>
                <CardHeader><CardTitle>Mission Actions</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <Button className="w-full" onClick={handleProposeClosure}>Propose Mission Closure</Button>
                    <Button variant="outline" className="w-full">Request Help</Button>
                </CardContent>
            </Card>
        );
    }
    
    const RatingSection = () => {
        if (mission.status !== 'completed') return null;

        return (
             <Card>
                <CardHeader>
                    <CardTitle>Mission Feedback</CardTitle>
                    <CardDescription>Rate your experience with the {isOrganizationMember ? 'volunteer' : 'organisation'}.</CardDescription>
                </CardHeader>
                <CardContent>
                    {myRating ? (
                        <div>
                            <p className="text-sm font-medium mb-2">You rated:</p>
                            <StarRating rating={myRating.rating} disabled />
                            {myRating.review_text && <p className="text-sm mt-2 text-muted-foreground italic">"{myRating.review_text}"</p>}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <StarRating rating={currentRating} setRating={setCurrentRating} />
                            <Textarea placeholder="Share your experience (optional)..." value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
                            <Button onClick={handleSubmitReview} disabled={isSubmittingReview || currentRating === 0} className="w-full">
                                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                            </Button>
                        </div>
                    )}
                     {theirRating && (
                        <div className="mt-4 pt-4 border-t">
                             <p className="text-sm font-medium mb-2">Their rating for you:</p>
                             <StarRating rating={theirRating.rating} disabled />
                             {theirRating.review_text && <p className="text-sm mt-2 text-muted-foreground italic">"{theirRating.review_text}"</p>}
                        </div>
                     )}
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{mission.title}</h1>
                <div className="flex items-center space-x-2 text-muted-foreground mt-1">
                    <Briefcase className="h-4 w-4" /><span>{mission.organizations?.name}</span>
                    <span className="text-xs">&bull;</span>
                    <Users className="h-4 w-4" /><span>{getDisplayName(volunteerProfile)}</span>
                </div>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Communication Channel</CardTitle></CardHeader>
                        <CardContent className="flex flex-col h-[32rem]">
                           <div ref={chatContainerRef} className="flex-1 space-y-4 overflow-y-auto p-4 border rounded-md bg-muted/50 mb-4">{/* Chat messages */}</div>
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <Input placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} disabled={mission.status === 'completed'} />
                                <Button type="submit" disabled={mission.status === 'completed'}><Send className="h-4 w-4" /></Button>
                            </form>
                        </CardContent>
                    </Card>
                    <RatingSection />
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Mission Briefing</CardTitle></CardHeader>
                        <CardContent className="space-y-4">{/* Mission briefing content */}</CardContent>
                    </Card>
                    <MissionActions />
                </div>
            </div>
        </div>
    );
};

// Skeleton component remains the same
const MissionControlSkeleton = () => ( <div className="space-y-6 animate-pulse">{/* ... */}</div> );

export default MissionControl;
