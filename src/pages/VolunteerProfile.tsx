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

const profileData = {
  name: "Alex Thompson",
  title: "Senior Cybersecurity Engineer",
  location: "San Francisco, CA",
  email: "alex.thompson@email.com",
  github: "github.com/alexthompson",
  linkedin: "linkedin.com/in/alexthompson",
  bio: "Passionate cybersecurity professional with 8+ years of experience in penetration testing, security audits, and cloud security architecture. I believe in using technology to make the world safer and more equitable. When I'm not securing systems, I enjoy mentoring junior developers and contributing to open-source security projects.",
  joinDate: "March 2023",
  currentLevel: 3,
  currentXP: 1450,
  nextLevelXP: 2000,
  rank: "ShieldMate Specialist",
  missionsCompleted: 5,
  organizationsHelped: 12,
  hoursContributed: 120,
  skills: [
    "Cybersecurity", "Penetration Testing", "OWASP", "Network Security",
    "AWS Security", "Cloud Architecture", "Risk Assessment", "HIPAA Compliance",
    "Incident Response", "Security Auditing", "Vulnerability Assessment"
  ],
  badges: [
    {
      id: 1,
      name: "Security Expert",
      description: "Completed 3+ cybersecurity missions",
      icon: "🛡️",
      earned: true,
      rarity: "rare"
    },
    {
      id: 2,
      name: "Cloud Specialist", 
      description: "Successfully migrated 2+ organizations to cloud",
      icon: "☁️",
      earned: true,
      rarity: "uncommon"
    },
    {
      id: 3,
      name: "Quick Responder",
      description: "Applied to missions within 24 hours",
      icon: "⚡",
      earned: true,
      rarity: "common"
    },
    {
      id: 4,
      name: "Mentor",
      description: "Guided 5+ junior volunteers",
      icon: "🎓",
      earned: true,
      rarity: "rare"
    },
    {
      id: 5,
      name: "Perfect Score",
      description: "Received 5-star ratings on all completed missions",
      icon: "⭐",
      earned: true,
      rarity: "legendary"
    },
    {
      id: 6,
      name: "Mission Master",
      description: "Complete 10 missions",
      icon: "🏆", 
      earned: false,
      rarity: "epic"
    }
  ],
  recentMissions: [
    {
      id: 1,
      title: "E-commerce Security Implementation",
      organization: "Community Store Co-op",
      completedAt: "2 weeks ago",
      rating: 5,
      feedback: "Alex delivered exceptional security improvements and was great to work with!"
    },
    {
      id: 2,
      title: "HIPAA Compliance Assessment",
      organization: "Community Health Clinic",
      completedAt: "1 month ago", 
      rating: 5,
      feedback: "Thorough, professional, and helped us achieve full compliance."
    },
    {
      id: 3,
      title: "Network Security Audit",
      organization: "Youth Education Center",
      completedAt: "2 months ago",
      rating: 5,
      feedback: "Identified critical vulnerabilities and provided clear remediation steps."
    }
  ]
};

const VolunteerProfile = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Volunteer Profile</h1>
          <p className="text-muted-foreground">
            Your public profile showcasing your skills and contributions to the ShieldMate community.
          </p>
        </div>
        <Button variant="outline" className="flex items-center space-x-2">
          <Edit className="w-4 h-4" />
          <span>Edit Profile</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card className="animate-fade-up">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground text-2xl font-bold">
                    {profileData.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground">{profileData.name}</h2>
                  <p className="text-muted-foreground mb-2">{profileData.title}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profileData.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {profileData.joinDate}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <a href={`mailto:${profileData.email}`} className="flex items-center space-x-1 text-primary hover:underline">
                      <Mail className="w-4 h-4" />
                      <span>Email</span>
                    </a>
                    <a href={`https://${profileData.github}`} className="flex items-center space-x-1 text-primary hover:underline">
                      <Github className="w-4 h-4" />
                      <span>GitHub</span>
                    </a>
                    <a href={`https://${profileData.linkedin}`} className="flex items-center space-x-1 text-primary hover:underline">
                      <Linkedin className="w-4 h-4" />
                      <span>LinkedIn</span>
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio */}
          <Card className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">{profileData.bio}</p>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle>Skills & Expertise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="skill-tag">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Missions */}
          <Card className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Recent Missions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileData.recentMissions.map((mission) => (
                <div key={mission.id} className="border-l-2 border-primary/20 pl-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">{mission.title}</h4>
                    <div className="flex items-center space-x-1">
                      {[...Array(mission.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{mission.organization}</p>
                  <p className="text-sm text-foreground italic">"{mission.feedback}"</p>
                  <p className="text-xs text-muted-foreground">Completed {mission.completedAt}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Gamification & Stats */}
        <div className="space-y-6">
          {/* Rank & Progress */}
          <Card className="animate-fade-up">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-primary" />
                <span>Current Rank</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="rank-badge w-full justify-center mb-3">
                  <Award className="w-4 h-4 mr-2" />
                  {profileData.rank}
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">Level {profileData.currentLevel}</div>
                <div className="text-sm text-muted-foreground mb-3">
                  {profileData.currentXP} / {profileData.nextLevelXP} XP to next level
                </div>
                <Progress value={(profileData.currentXP / profileData.nextLevelXP) * 100} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-3">
              <CardTitle>Impact Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{profileData.missionsCompleted}</div>
                  <div className="text-xs text-muted-foreground">Missions Completed</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{profileData.organizationsHelped}</div>
                  <div className="text-xs text-muted-foreground">Organizations Helped</div>
                </div>
              </div>
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <div className="text-2xl font-bold text-primary">{profileData.hoursContributed}</div>
                <div className="text-xs text-muted-foreground">Hours Contributed</div>
              </div>
            </CardContent>
          </Card>

          {/* Achievement Badges */}
          <Card className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span>Achievement Badges</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {profileData.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`relative group cursor-pointer ${
                      badge.earned 
                        ? 'opacity-100' 
                        : 'opacity-40 grayscale'
                    }`}
                    title={badge.description}
                  >
                    <div className={`
                      w-16 h-16 rounded-lg flex items-center justify-center text-2xl
                      ${badge.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                        badge.rarity === 'epic' ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
                        badge.rarity === 'rare' ? 'bg-gradient-to-br from-blue-500 to-indigo-500' :
                        badge.rarity === 'uncommon' ? 'bg-gradient-to-br from-green-500 to-teal-500' :
                        'bg-gradient-to-br from-gray-400 to-gray-500'
                      }
                    `}>
                      {badge.icon}
                    </div>
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-popover border border-border rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {badge.name}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Badge variant="secondary" className="text-xs">
                  {profileData.badges.filter(b => b.earned).length} / {profileData.badges.length} earned
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Next Goals */}
          <Card className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-primary" />
                <span>Next Goals</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Level 4</span>
                  <span className="text-foreground">550 XP needed</span>
                </div>
                <Progress value={72.5} className="h-2" />
              </div>
              
              <div className="pt-3 border-t border-border space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Mission Master Badge</span>
                  <span className="text-foreground">5 more missions</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Community Leader</span>
                  <span className="text-foreground">3 more mentees</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VolunteerProfile;