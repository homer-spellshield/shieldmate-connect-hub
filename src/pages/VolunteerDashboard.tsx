import { MissionCard } from "@/components/MissionCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Clock, Award, Target } from "lucide-react";

const recommendedMissions = [
  {
    id: "1",
    organisationName: "Local Food Bank",
    title: "Website Security Audit & Vulnerability Assessment",
    skills: ["Cybersecurity", "Penetration Testing", "OWASP"],
    timeCommitment: "2-3 weeks",
  },
  {
    id: "2", 
    organisationName: "Animal Rescue Center",
    title: "Cloud Infrastructure Migration to AWS",
    skills: ["AWS", "DevOps", "Cloud Architecture"],
    timeCommitment: "4-6 weeks",
  },
  {
    id: "3",
    organisationName: "Youth Education Center",
    title: "Mobile App Development for Learning Platform",
    skills: ["React Native", "Firebase", "UI/UX"],
    timeCommitment: "6-8 weeks",
  }
];

const activeMissions = [
  {
    id: "active-1",
    title: "E-commerce Security Implementation",
    organisation: "Community Store Co-op",
    progress: 65,
    deadline: "2 weeks",
  },
  {
    id: "active-2", 
    title: "Database Optimization Project",
    organisation: "Health Clinic Network",
    progress: 30,
    deadline: "1 month",
  }
];

const VolunteerDashboard = () => {
  const handleViewDetails = (id: string) => {
    console.log("View mission details:", id);
    // Navigate to mission detail page
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Welcome back, Alex!</h1>
        <p className="text-muted-foreground">
          Ready to make a difference? Here are some missions that match your skills.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recommended Missions */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Recommended for You</h2>
              <Button variant="outline" size="sm">
                View All Missions
              </Button>
            </div>
            <div className="space-y-4">
              {recommendedMissions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  {...mission}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Active Missions */}
        <div className="space-y-6">
          {/* Gamification Stats */}
          <Card className="animate-fade-up">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-primary" />
                <span>Your Impact</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="rank-badge w-full justify-center mb-3">
                  ShieldMate Specialist
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">Level 3</div>
                <div className="text-sm text-muted-foreground mb-3">1,450 / 2,000 XP to next level</div>
                <Progress value={72.5} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">5</div>
                  <div className="text-xs text-muted-foreground">Missions Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">12</div>
                  <div className="text-xs text-muted-foreground">Organizations Helped</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="secondary" className="text-xs">
                  🛡️ Security Expert
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  ☁️ Cloud Specialist
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  ⚡ Quick Responder
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Active Missions */}
          <Card className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-primary" />
                <span>Active Missions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeMissions.map((mission) => (
                <div key={mission.id} className="space-y-3">
                  <div>
                    <h4 className="font-medium text-foreground text-sm">{mission.title}</h4>
                    <p className="text-xs text-muted-foreground">{mission.organisation}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-foreground font-medium">{mission.progress}%</span>
                    </div>
                    <Progress value={mission.progress} className="h-1.5" />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{mission.deadline} left</span>
                    </div>
                    <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                      Continue
                    </Button>
                  </div>
                  {mission.id !== activeMissions[activeMissions.length - 1].id && (
                    <div className="border-b border-border" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>This Month</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Applications Sent</span>
                  <span className="text-sm font-medium text-foreground">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Hours Contributed</span>
                  <span className="text-sm font-medium text-foreground">24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">XP Earned</span>
                  <span className="text-sm font-medium text-primary">450</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;