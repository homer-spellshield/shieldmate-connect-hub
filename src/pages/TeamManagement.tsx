import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const TeamManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
        <p className="text-muted-foreground">
          Invite and manage members of your organization.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                    The following users have access to this organization's dashboard.
                </CardDescription>
            </div>
            <Button>
                <Plus className="h-4 w-4 mr-2" />
                Invite Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Team member list will be displayed here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamManagement;
