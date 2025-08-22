import { useState, useEffect } from "react";
import { MissionApplicationCard } from "@/components/MissionApplicationCard";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type Mission = {
  id: string;
  title: string;
  description: string;
  estimated_hours: number | null;
  difficulty_level: string | null;
  status: string;
  template_id: string;
  organizations: {
    name: string;
  };
  mission_templates: {
    title: string;
  };
};

type Skill = {
  id: string;
  name: string;
  category: string | null;
};

type MissionWithSkills = Mission & {
  skills: string[];
  applicantCount: number;
};

const skillCategories = [
  "All Skills",
  "Cybersecurity", 
  "Cloud Computing",
  "Web Development",
  "Mobile Development",
  "Data Analytics",
  "DevOps",
  "UI/UX Design"
];

const timeCommitments = [
  "Any Duration",
  "1-2 weeks",
  "2-4 weeks", 
  "1-2 months",
  "2+ months"
];

const MissionDiscovery = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("All Skills");
  const [selectedDuration, setSelectedDuration] = useState("Any Duration");
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [missions, setMissions] = useState<MissionWithSkills[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [volunteerSkillIds, setVolunteerSkillIds] = useState<string[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch missions and skills
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Use safe RPC to fetch missions with organizations (only exposes public fields)
        const { data: missionsData, error: missionsError } = await supabase
          .rpc('get_open_missions_public');

        if (missionsError) throw missionsError;

        // Fetch skills
        const { data: skillsData, error: skillsError } = await supabase
          .from('skills')
          .select('*')
          .order('name');

        if (skillsError) throw skillsError;

        // Get volunteer skills if user is logged in
        let userSkillIds: string[] = [];
        if (user) {
          const { data: volunteerSkillsData } = await supabase
            .from('volunteer_skills')
            .select('skill_id')
            .eq('volunteer_id', user.id);
          
          userSkillIds = volunteerSkillsData?.map(vs => vs.skill_id) || [];
          setVolunteerSkillIds(userSkillIds);
        }

        // Process missions to add skills and application counts
        const processedMissions: MissionWithSkills[] = [];
        
        for (const mission of missionsData || []) {
          // Get skills for this mission template
          const { data: templateSkills } = await supabase
            .from('mission_template_skills')
            .select(`
              skills(id, name)
            `)
            .eq('template_id', mission.template_id);

          // Get application count for this mission
          const { count: applicantCount } = await supabase
            .from('mission_applications')
            .select('*', { count: 'exact', head: true })
            .eq('mission_id', mission.id);

          const missionSkills = templateSkills?.map(ts => ts.skills.name) || [];
          const missionSkillIds = templateSkills?.map(ts => ts.skills.id) || [];
          
          // Only show missions that the volunteer has skills for (if logged in)
          if (user && userSkillIds.length > 0) {
            const hasRequiredSkills = missionSkillIds.some(skillId => userSkillIds.includes(skillId));
            if (!hasRequiredSkills) continue;
          }

          processedMissions.push({
            ...mission,
            organizations: { name: mission.organization_name },
            mission_templates: { title: mission.template_title },
            skills: missionSkills,
            applicantCount: applicantCount || 0
          });
        }

        setMissions(processedMissions);
        setSkills(skillsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load missions. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  // Apply search and category filters
  const filteredMissions = missions.filter(mission => {
    const matchesSearch = mission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mission.organizations.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mission.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSkill = selectedSkill === "All Skills" || 
                        mission.skills.some(skill => skill.includes(selectedSkill));
    
    return matchesSearch && matchesSkill;
  });

  const handleViewDetails = (id: string) => {
    window.location.href = `/mission-detail/${id}`;
  };

  const handleApplyToMission = async (missionId: string, applicationMessage: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to apply for missions.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsApplying(true);
      
      const { error } = await supabase
        .from('mission_applications')
        .insert({
          mission_id: missionId,
          volunteer_id: user.id,
          application_message: applicationMessage,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Application Submitted!",
        description: "Your application has been sent to the organization.",
      });

      // Update the mission's applicant count locally
      setMissions(prev => prev.map(mission => 
        mission.id === missionId 
          ? { ...mission, applicantCount: mission.applicantCount + 1 }
          : mission
      ));
    } catch (error: any) {
      console.error('Error applying to mission:', error);
      toast({
        title: "Error",
        description: error.message?.includes('duplicate key') 
          ? "You have already applied to this mission."
          : "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading missions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Discover Missions</h1>
        <p className="text-muted-foreground">
          Find meaningful projects where your tech skills can make a real impact.
        </p>
        {!user && (
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> You need to be logged in and have assigned skills to see missions you're qualified for.
            </p>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="animate-fade-up">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Main Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search missions, organizations, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Quick filters:</span>
              </div>
              
              <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select skill" />
                </SelectTrigger>
                <SelectContent>
                  {skillCategories.map((skill) => (
                    <SelectItem key={skill} value={skill}>
                      {skill}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Duration" />
                </SelectTrigger>
                <SelectContent>
                  {timeCommitments.map((duration) => (
                    <SelectItem key={duration} value={duration}>
                      {duration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                className="flex items-center space-x-1"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Advanced</span>
              </Button>
            </div>

            {/* Advanced Filters (Collapsible) */}
            {showAdvancedFilter && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Organization Type</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Any type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nonprofit">Non-profit</SelectItem>
                      <SelectItem value="education">Educational</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="community">Community</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Remote Work</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Any location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote only</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Urgency</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Any urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Filters */}
      {(selectedSkill !== "All Skills" || selectedDuration !== "Any Duration" || searchTerm) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {searchTerm && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>"{searchTerm}"</span>
              <button onClick={() => setSearchTerm("")} className="ml-1 text-xs">×</button>
            </Badge>
          )}
          {selectedSkill !== "All Skills" && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>{selectedSkill}</span>
              <button onClick={() => setSelectedSkill("All Skills")} className="ml-1 text-xs">×</button>
            </Badge>
          )}
          {selectedDuration !== "Any Duration" && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>{selectedDuration}</span>
              <button onClick={() => setSelectedDuration("Any Duration")} className="ml-1 text-xs">×</button>
            </Badge>
          )}
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {filteredMissions.length} missions found
        </h2>
        <Select defaultValue="newest">
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="urgent">Most urgent</SelectItem>
            <SelectItem value="popular">Most popular</SelectItem>
            <SelectItem value="duration">Shortest duration</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mission Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMissions.map((mission, index) => (
          <MissionApplicationCard
            key={mission.id}
            id={mission.id}
            title={mission.title}
            description={mission.description}
            organizationName={mission.organizations.name}
            estimatedHours={mission.estimated_hours}
            difficultyLevel={mission.difficulty_level}
            skills={mission.skills}
            applicantCount={mission.applicantCount}
            onViewDetails={handleViewDetails}
            onApply={handleApplyToMission}
            isApplying={isApplying}
            className="animate-fade-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          />
        ))}
      </div>

      {/* No Results */}
      {filteredMissions.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="space-y-3">
              <Search className="w-12 h-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-medium text-foreground">No missions found</h3>
              <p className="text-muted-foreground">
                {!user ? "Please log in to see missions you're qualified for." :
                 volunteerSkillIds.length === 0 ? "You need to have skills assigned by an administrator to see available missions." :
                 "Try adjusting your search terms or filters to find more missions."}
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedSkill("All Skills");
                  setSelectedDuration("Any Duration");
                }}
              >
                Clear all filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MissionDiscovery;