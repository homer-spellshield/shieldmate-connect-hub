import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VolunteerManagement } from '@/components/admin/VolunteerManagement';
import { SkillManagement } from '@/components/admin/SkillManagement';
import { SystemOverview } from '@/components/admin/SystemOverview';
import { Users, Award, BarChart3 } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage volunteers, skills, and system settings
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
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Organizations
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

        <TabsContent value="organizations">
          <Card>
            <CardHeader>
              <CardTitle>Organization Management</CardTitle>
              <CardDescription>
                Manage registered organizations and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Organization management interface coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;