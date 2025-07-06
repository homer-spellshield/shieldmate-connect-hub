import { useState } from "react";
import { MissionCard } from "@/components/MissionCard";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, SlidersHorizontal } from "lucide-react";

const allMissions = [
  {
    id: "1",
    organisationName: "Local Food Bank",
    title: "Website Security Audit & Vulnerability Assessment",
    skills: ["Cybersecurity", "Penetration Testing", "OWASP", "Network Security"],
    timeCommitment: "2-3 weeks",
    applicantCount: 3,
  },
  {
    id: "2",
    organisationName: "Animal Rescue Center", 
    title: "Cloud Infrastructure Migration to AWS",
    skills: ["AWS", "DevOps", "Cloud Architecture", "Docker"],
    timeCommitment: "4-6 weeks",
    applicantCount: 7,
  },
  {
    id: "3",
    organisationName: "Youth Education Center",
    title: "Mobile App Development for Learning Platform",
    skills: ["React Native", "Firebase", "UI/UX", "JavaScript"],
    timeCommitment: "6-8 weeks",
    applicantCount: 12,
  },
  {
    id: "4",
    organisationName: "Community Health Clinic",
    title: "HIPAA Compliance Review & Implementation",
    skills: ["HIPAA", "Compliance", "Data Privacy", "Risk Assessment"],
    timeCommitment: "3-4 weeks",
    applicantCount: 2,
  },
  {
    id: "5",
    organisationName: "Environmental Group",
    title: "Data Analytics Dashboard for Impact Tracking",
    skills: ["Python", "Data Analytics", "Dashboard", "Visualization"],
    timeCommitment: "4-5 weeks",
    applicantCount: 5,
  },
  {
    id: "6",
    organisationName: "Senior Center",
    title: "Digital Literacy Training Platform Setup",
    skills: ["Training", "WordPress", "User Experience", "Documentation"],
    timeCommitment: "2-3 weeks",
    applicantCount: 4,
  }
];

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

  const handleViewDetails = (id: string) => {
    console.log("View mission details:", id);
    // Navigate to mission detail page
  };

  const filteredMissions = allMissions.filter(mission => {
    const matchesSearch = mission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mission.organisationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mission.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSkill = selectedSkill === "All Skills" || 
                        mission.skills.some(skill => skill.includes(selectedSkill));
    
    return matchesSearch && matchesSkill;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Discover Missions</h1>
        <p className="text-muted-foreground">
          Find meaningful projects where your tech skills can make a real impact.
        </p>
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
          <MissionCard
            key={mission.id}
            {...mission}
            onViewDetails={handleViewDetails}
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
                Try adjusting your search terms or filters to find more missions.
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