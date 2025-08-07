import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Clock, BarChart3, Shield, Code, Globe, Users, Lightbulb } from "lucide-react";

interface MissionTemplate {
  id: string;
  title: string;
  description: string;
  estimated_hours: number | null;
  difficulty_level: string | null;
}

interface MissionTemplateSelectorProps {
  templates: MissionTemplate[];
  selectedTemplate: MissionTemplate | null;
  onTemplateSelect: (templateId: string) => void;
}

const categoryConfig = {
  security: {
    title: "Security & Risk Management",
    description: "Protect your organization from digital threats",
    icon: Shield,
    keywords: ["security", "cyber", "vulnerability", "audit", "risk", "penetration", "threat"],
    color: "bg-red-50 border-red-200 text-red-900"
  },
  development: {
    title: "Technology Development", 
    description: "Build and improve your digital presence",
    icon: Code,
    keywords: ["development", "website", "application", "software", "api", "system", "database"],
    color: "bg-blue-50 border-blue-200 text-blue-900"
  },
  strategy: {
    title: "Digital Strategy & Consulting",
    description: "Plan and optimize your digital transformation",
    icon: Lightbulb,
    keywords: ["strategy", "consulting", "digital", "transformation", "optimization", "process", "analysis"],
    color: "bg-yellow-50 border-yellow-200 text-yellow-900"
  },
  marketing: {
    title: "Marketing & Outreach",
    description: "Expand your reach and engagement",
    icon: Globe,
    keywords: ["marketing", "social", "content", "seo", "campaign", "outreach", "branding"],
    color: "bg-green-50 border-green-200 text-green-900"
  },
  training: {
    title: "Training & Education",
    description: "Upskill your team and stakeholders",
    icon: Users,
    keywords: ["training", "education", "workshop", "awareness", "learning", "skill", "knowledge"],
    color: "bg-purple-50 border-purple-200 text-purple-900"
  }
};

const categorizeTemplate = (template: MissionTemplate) => {
  const content = `${template.title} ${template.description}`.toLowerCase();
  
  for (const [key, config] of Object.entries(categoryConfig)) {
    if (config.keywords.some(keyword => content.includes(keyword))) {
      return key;
    }
  }
  return "other";
};

const getDifficultyBadge = (difficulty: string | null) => {
  switch (difficulty?.toLowerCase()) {
    case 'beginner':
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Beginner Friendly</Badge>;
    case 'intermediate':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Intermediate</Badge>;
    case 'advanced':
      return <Badge variant="secondary" className="bg-red-100 text-red-800">Advanced</Badge>;
    default:
      return null;
  }
};

export const MissionTemplateSelector = ({ templates, selectedTemplate, onTemplateSelect }: MissionTemplateSelectorProps) => {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const categorizedTemplates = templates.reduce((acc, template) => {
    const category = categorizeTemplate(template);
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, MissionTemplate[]>);

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Choose a mission template that best matches your organization's needs. These templates help volunteers understand the scope and requirements.
      </div>
      
      {Object.entries(categoryConfig).map(([categoryKey, config]) => {
        const categoryTemplates = categorizedTemplates[categoryKey];
        if (!categoryTemplates?.length) return null;
        
        const Icon = config.icon;
        const isOpen = openCategories[categoryKey];
        
        return (
          <Collapsible key={categoryKey} open={isOpen} onOpenChange={() => toggleCategory(categoryKey)}>
            <CollapsibleTrigger asChild>
              <Card className={`cursor-pointer transition-all hover:shadow-md ${config.color}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" />
                      <div>
                        <CardTitle className="text-base">{config.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {config.description} • {categoryTemplates.length} templates
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </CardHeader>
              </Card>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-2 mt-2">
              {categoryTemplates.map((template) => (
                <Card 
                  key={template.id} 
                  className={`cursor-pointer transition-all hover:shadow-sm ${
                    selectedTemplate?.id === template.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-accent/50'
                  }`}
                  onClick={() => onTemplateSelect(template.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm font-medium">{template.title}</CardTitle>
                        <CardDescription className="text-xs mt-1 line-clamp-2">
                          {template.description}
                        </CardDescription>
                      </div>
                      {selectedTemplate?.id === template.id && (
                        <div className="w-2 h-2 bg-primary rounded-full ml-2 mt-1" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-3">
                      {template.estimated_hours && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {template.estimated_hours}h
                        </div>
                      )}
                      {getDifficultyBadge(template.difficulty_level)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
      
      {/* Other/uncategorized templates */}
      {categorizedTemplates.other?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Other Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {categorizedTemplates.other.map((template) => (
              <Card 
                key={template.id} 
                className={`cursor-pointer transition-all hover:shadow-sm ${
                  selectedTemplate?.id === template.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-accent/50'
                }`}
                onClick={() => onTemplateSelect(template.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">{template.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                    </div>
                    {selectedTemplate?.id === template.id && (
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
      
      {selectedTemplate && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-sm text-primary">Selected Template Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="text-sm font-medium">{selectedTemplate.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{selectedTemplate.description}</p>
            </div>
            <div className="flex items-center gap-4">
              {selectedTemplate.estimated_hours && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {selectedTemplate.estimated_hours} hours estimated
                </div>
              )}
              {getDifficultyBadge(selectedTemplate.difficulty_level)}
            </div>
            <div className="text-xs text-muted-foreground">
              💡 This template will pre-fill some fields and help volunteers understand what you're looking for.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
