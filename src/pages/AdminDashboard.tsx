
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VolunteerManagement } from '@/components/admin/VolunteerManagement';
import { SkillManagement } from '@/components/admin/SkillManagement';
import { MissionTemplateManagement } from '@/components/admin/MissionTemplateManagement';
import { SystemOverview } from '@/components/admin/SystemOverview';
import { Users, Award, BarChart3, Briefcase } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage volunteers, skills, mission templates, and system settings
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="volunteers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Volunteers
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Skills
          </TabsTrigger>
          <TabsTrigger value="mission_templates" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SystemOverview />
        </TabsContent>

        <TabsContent value="volunteers">
          <VolunteerManagement />
        </TabsContent>

        <TabsContent value="skills">
          <SkillManagement />
        </TabsContent>

        <TabsContent value="mission_templates">
          <MissionTemplateManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
