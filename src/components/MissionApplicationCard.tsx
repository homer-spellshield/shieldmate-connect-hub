import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Clock, Users, MapPin, Loader2 } from "lucide-react";
import { useState } from "react";

interface MissionApplicationCardProps {
  id: string;
  title: string;
  description: string;
  organizationName: string;
  organizationLogo?: string;
  estimatedHours: number | null;
  difficultyLevel: string | null;
  skills: string[];
  applicantCount?: number;
  onViewDetails: (id: string) => void;
  onApply: (missionId: string, message: string) => void;
  className?: string;
  style?: React.CSSProperties;
  isApplying?: boolean;
}

export const MissionApplicationCard = ({
  id,
  title,
  description,
  organizationName,
  organizationLogo,
  estimatedHours,
  difficultyLevel,
  skills,
  applicantCount,
  onViewDetails,
  onApply,
  className = "",
  style,
  isApplying = false
}: MissionApplicationCardProps) => {
  const [applicationMessage, setApplicationMessage] = useState("");
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);

  const handleApply = () => {
    onApply(id, applicationMessage);
    setApplicationMessage("");
    setShowApplicationDialog(false);
  };

  const timeCommitment = estimatedHours ? `${estimatedHours} hours` : "Time TBD";

  return (
    <div className={`bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow ${className}`} style={style}>
      {/* Organization Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
          {organizationLogo ? (
            <img 
              src={organizationLogo} 
              alt={`${organizationName} logo`} 
              className="w-8 h-8 rounded-md"
            />
          ) : (
            <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">
                {organizationName.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{organizationName}</p>
          <p className="text-xs text-muted-foreground">Non-profit organization</p>
        </div>
      </div>

      {/* Mission Title */}
      <h3 className="text-lg font-semibold text-foreground mb-3 line-clamp-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
        {description}
      </p>

      {/* Skills Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {skills.slice(0, 3).map((skill, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {skill}
          </Badge>
        ))}
        {skills.length > 3 && (
          <Badge variant="secondary" className="text-xs">
            +{skills.length - 3} more
          </Badge>
        )}
      </div>

      {/* Mission Details */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4" />
          <span>{timeCommitment}</span>
        </div>
        {difficultyLevel && (
          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4" />
            <span className="capitalize">{difficultyLevel}</span>
          </div>
        )}
        {applicantCount !== undefined && (
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{applicantCount} applicants</span>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onViewDetails(id)}
          className="hover:bg-primary hover:text-primary-foreground"
        >
          View Details
        </Button>

        <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
          <DialogTrigger asChild>
            <Button 
              size="sm"
              disabled={isApplying}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isApplying ? "Applying..." : "Apply Now"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Apply to Mission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-1">{title}</h4>
                <p className="text-xs text-muted-foreground">{organizationName}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="application-message">Application Message</Label>
                <Textarea
                  id="application-message"
                  placeholder="Tell the organization why you're interested in this mission and what relevant experience you have..."
                  value={applicationMessage}
                  onChange={(e) => setApplicationMessage(e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowApplicationDialog(false)}
                  disabled={isApplying}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApply}
                  disabled={isApplying || !applicationMessage.trim()}
                >
                  {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isApplying ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};