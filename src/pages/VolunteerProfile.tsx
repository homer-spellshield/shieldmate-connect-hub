import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Award, 
  Star, 
  Calendar, 
  MapPin, 
  Mail, 
  Github, 
  Linkedin,
  Edit,
  Trophy,
  Target,
  Zap
} from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

// This should be dynamic, but for now we have a placeholder
const badges = [
    { id: 1, name: "Security Expert", description: "Completed 3+ cybersecurity missions", icon: "🛡️", earned: true, rarity: "rare" },
    { id: 2, name: "Cloud Specialist", description: "Successfully migrated 2+ organizations to cloud", icon: "☁️", earned: true, rarity: "uncommon" },
    { id: 3, name: "Quick Responder", description: "Applied to missions within 24 hours", icon: "⚡", earned: true, rarity: "common" },
    { id: 4, name: "Mentor", description: "Guided 5+ junior volunteers", icon: "🎓", earned: true, rarity: "rare" },
    { id: 5, name: "Perfect Score", description: "Received 5-star ratings on all completed missions", icon: "⭐", earned: true, rarity: "legendary" },
    { id: 6, name: "Mission Master", description: "Complete 10 missions", icon: "🏆", earned: false, rarity: "epic" }
];

// Function to calculate XP needed for the next level
const getXpForNextLevel = (level: number) => {
  return Math.floor(1000 * Math.pow(level, 1.5));
};

const VolunteerProfile = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if(profile) {
      setLoading(false);
    }
  }, [profile]);
  
  if (loading || !profile) {
    return <div><Skeleton className="h-96 w-full" /></div>;
  }
  
  const currentLevel = (profile as any).level || 1;
  const currentXP = (profile as any).xp_points || 0;
  const nextLevelXP = getXpForNextLevel(currentLevel);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Volunteer Profile</h1>
          <p className="text-muted-foreground">
            Your public profile showcasing your skills and contributions.
          </p>
        </div>
        <Button variant="outline" className="flex items-center space-x-2" onClick={() => navigate('/settings')}>
          <Edit className="w-4 h-4" />
          <span>Edit Profile</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="animate-fade-up">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground text-2xl font-bold">
                    {`${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground">{profile.first_name} {profile.last_name}</h2>
                  <p className="text-muted-foreground mb-2">{(profile as any).title || 'Volunteer'}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center space-x-1"><MapPin className="w-4 h-4" /><span>Remote</span></div>
                    <div className="flex items-center space-x-1"><Calendar className="w-4 h-4" /><span>Joined {new Date((profile as any).join_date || Date.now()).toLocaleDateString()}</span></div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <a href={`mailto:${user?.email}`} className="flex items-center space-x-1 text-primary hover:underline"><Mail className="w-4 h-4" /><span>Email</span></a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader><CardTitle>About</CardTitle></CardHeader>
            <CardContent><p className="text-foreground leading-relaxed">{(profile as any).bio || 'No bio provided. You can add one in the settings.'}</p></CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card className="animate-fade-up">
            <CardHeader className="pb-3"><CardTitle className="flex items-center space-x-2"><Shield className="w-5 h-5 text-primary" /><span>Current Rank</span></CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground mb-1">Level {currentLevel}</div>
                <div className="text-sm text-muted-foreground mb-3">{currentXP} / {nextLevelXP} XP to next level</div>
                <Progress value={(currentXP / nextLevelXP) * 100} className="h-3" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-3"><CardTitle className="flex items-center space-x-2"><Trophy className="w-5 h-5 text-primary" /><span>Achievement Badges</span></CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {badges.map((badge) => (
                  <div key={badge.id} className={`relative group cursor-pointer ${badge.earned ? 'opacity-100' : 'opacity-40 grayscale'}`} title={badge.description}>
                    <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl ${badge.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : badge.rarity === 'epic' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : badge.rarity === 'rare' ? 'bg-gradient-to-br from-blue-500 to-indigo-500' : badge.rarity === 'uncommon' ? 'bg-gradient-to-br from-green-500 to-teal-500' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                      {badge.icon}
                    </div>
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-popover border border-border rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {badge.name}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VolunteerProfile;