import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";

interface MissionCardProps {
  id: string;
  organisationName: string;
  organisationLogo?: string;
  title: string;
  skills: string[];
  timeCommitment: string;
  applicantCount?: number;
  onViewDetails: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const MissionCard = ({
  id,
  organisationName,
  organisationLogo,
  title,
  skills,
  timeCommitment,
  applicantCount,
  onViewDetails,
  className = "",
  style
}: MissionCardProps) => {
  return (
    <div className={`group mission-card animate-fade-up hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card via-card to-card/90 rounded-lg border border-border/50 p-6 ${className}`} style={style}>
      {/* Organisation Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center">
          {organisationLogo ? (
            <img 
              src={organisationLogo} 
              alt={`${organisationName} logo`} 
              className="w-8 h-8 rounded-md object-cover"
            />
          ) : (
            <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary/80 rounded-sm flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">
                {organisationName.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{organisationName}</p>
          <p className="text-xs text-muted-foreground">Non-profit organization</p>
        </div>
      </div>

      {/* Mission Title */}
      <h3 className="text-lg font-semibold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
        {title}
      </h3>

      {/* Skills Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {skills.slice(0, 3).map((skill, index) => (
          <Badge 
            key={index} 
            variant="secondary" 
            className="skill-tag bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/80 hover:to-secondary transition-all"
          >
            {skill}
          </Badge>
        ))}
        {skills.length > 3 && (
          <Badge 
            variant="secondary" 
            className="skill-tag bg-gradient-to-r from-muted to-muted/80 hover:from-muted/80 hover:to-muted transition-all"
          >
            +{skills.length - 3} more
          </Badge>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{timeCommitment}</span>
          </div>
          {applicantCount !== undefined && (
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{applicantCount} applicants</span>
            </div>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onViewDetails(id)}
          className="hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 group-hover:shadow-md"
        >
          View Details
        </Button>
      </div>
    </div>
  );
};