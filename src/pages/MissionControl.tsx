import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Paperclip, Send, Shield, Briefcase, Clock, BarChart3, Users } from "lucide-react";

// This is placeholder data. We will make this dynamic in the next steps.
const missionData = {
  operationName: "Operation Wombat",
  missionTitle: "Website Security Audit & Vulnerability Assessment",
  organization: { name: "Local Food Bank" },
  volunteer: { name: "Alex Thompson", initials: "AT" },
  description: "Conduct a comprehensive security audit of our public-facing website to identify and report on potential vulnerabilities. The primary goal is to ensure the safety of our donor data and prevent potential service disruptions. The audit should cover OWASP Top 10 vulnerabilities, server configuration, and third-party plugin security.",
  skills: ["Cybersecurity", "Penetration Testing", "OWASP"],
  estimatedHours: 40,
  difficulty: "Advanced",
};

const MissionControl = () => {
  return (
    <div className="space-y-6">
      {/* Mission Header */}
      <div>
        <h2 className="text-sm font-semibold text-primary">{missionData.operationName}</h2>
        <h1 className="text-3xl font-bold tracking-tight">{missionData.missionTitle}</h1>
        <div className="flex items-center space-x-2 text-muted-foreground mt-1">
            <Briefcase className="h-4 w-4" />
            <span>{missionData.organization.name}</span>
            <span className="text-xs">&bull;</span>
            <Users className="h-4 w-4" />
            <span>{missionData.volunteer.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Chat and File Uploads */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Communication Channel</CardTitle>
              <CardDescription>Chat with the volunteer or organization to coordinate.</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Chat Message Area - This will be made dynamic later */}
                <div className="space-y-4 h-96 overflow-y-auto p-4 border rounded-md bg-muted/50">
                    <div className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                            <AvatarFallback>AT</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-sm">Alex Thompson</p>
                            <div className="bg-background p-3 rounded-lg mt-1">
                                <p className="text-sm">Hey! Just wanted to confirm I'm starting the initial scan now. I'll post an update by end of day.</p>
                            </div>
                        </div>
                    </div>
                     <div className="flex items-start gap-3 flex-row-reverse">
                        <Avatar className="w-8 h-8">
                            <AvatarFallback>LFB</AvatarFallback>
                        </Avatar>
                        <div className="text-right">
                            <p className="font-semibold text-sm">Local Food Bank</p>
                            <div className="bg-primary text-primary-foreground p-3 rounded-lg mt-1">
                                <p className="text-sm">Sounds great, Alex! Let us know if you need anything from our end.</p>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Chat Input */}
                <div className="mt-4 flex items-center gap-2">
                    <Button variant="outline" size="icon"><Paperclip className="h-4 w-4" /></Button>
                    <Input placeholder="Type your message..." />
                    <Button><Send className="h-4 w-4" /></Button>
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>File Repository</CardTitle>
              <CardDescription>Upload and share mission-related files securely.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                File upload and list will be implemented here.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Mission Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mission Briefing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Scope & Objectives</h4>
                <p className="text-sm">{missionData.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Est. Hours</p>
                        <p className="text-sm font-medium">{missionData.estimatedHours}h</p>
                      </div>
                  </div>
                   <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Difficulty</p>
                        <Badge variant="outline">{missionData.difficulty}</Badge>
                      </div>
                  </div>
              </div>
               <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                    {missionData.skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <CardTitle>Mission Actions</CardTitle>
            </CardHeader>
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

export default MissionControl;
