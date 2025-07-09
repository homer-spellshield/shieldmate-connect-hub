import { MissionCard } from "@/components/MissionCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Users, CheckCircle, Clock, TrendingUp } from "lucide-react";

const organisationMissions = [
  {
    id: "org-1",
    organisationName: "Local Food Bank",
    title: "Website Security Audit & Vulnerability Assessment",
    skills: ["Cybersecurity", "Penetration Testing", "OWASP"],
    timeCommitment: "2-3 weeks",
    applicantCount: 8,
    status: "active"
  },
  {
    id: "org-2",
    organisationName: "Local Food Bank", 
    title: "Donor Management System Upgrade",
    skills: ["Database", "SQL", "System Migration"],
    timeCommitment: "4-6 weeks",
    applicantCount: 3,
    status: "active"
  },
  {
    id: "org-3",
    organisationName: "Local Food Bank",
    title: "Staff Training Platform Development",
    skills: ["LMS", "Training", "Web Development"],
    timeCommitment: "6-8 weeks",
    applicantCount: 12,
    status: "in_progress"
  }
];

const OrganisationDashboard = () => {
  const handleViewDetails = (id: string) => {
    console.log("View mission details:", id);
    // Navigate to mission detail page
  };

  const handlePostNewMission = () => {
    window.location.href = "/org-dashboard/missions/new";
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Local Food Bank Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your missions and connect with talented volunteers ready to help.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Active Missions */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Your Active Missions</h2>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {organisationMissions.length} missions
              </Badge>
            </div>
            <div className="space-y-4">
              {organisationMissions.map((mission) => (
                <div key={mission.id} className="relative">
                  <MissionCard
                    {...mission}
                    onViewDetails={handleViewDetails}
                  />
                  {/* Status indicator */}
                  <div className="absolute top-4 right-4">
                    {mission.status === "active" && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                        <Clock className="w-3 h-3 mr-1" />
                        Recruiting
                      </Badge>
                    )}
                    {mission.status === "in_progress" && (
                      <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        In Progress
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Actions & Stats */}
        <div className="space-y-6">
          {/* Post New Mission CTA */}
          <Card className="animate-fade-up bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-primary">
                <Plus className="w-5 h-5" />
                <span>Need Help?</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground">
                Post a new mission to connect with skilled volunteers who want to help your organization succeed.
              </p>
              <Button 
                onClick={handlePostNewMission}
                className="w-full btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Post New Mission
              </Button>
              <div className="text-xs text-muted-foreground text-center">
                Free to post • Get matched with experts
              </div>
            </CardContent>
          </Card>

          {/* Organization Stats */}
          <Card className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>Organization Impact</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">12</div>
                  <div className="text-xs text-muted-foreground">Total Missions</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">8</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Volunteer Applications</span>
                  <span className="text-sm font-medium text-foreground">23 this month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Volunteers</span>
                  <span className="text-sm font-medium text-foreground">5 working</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="text-sm font-medium text-success">92%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <p className="text-foreground">Sarah J. applied to Security Audit mission</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                  <div>
                    <p className="text-foreground">Training Platform mission marked complete</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-info rounded-full mt-2"></div>
                  <div>
                    <p className="text-foreground">New volunteer message in Donor System project</p>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>
                </div>
              </div>
              
              <Button variant="outline" size="sm" className="w-full mt-4">
                View All Activity
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Manage Team Members
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <CheckCircle className="w-4 h-4 mr-2" />
                Review Applications
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrganisationDashboard;