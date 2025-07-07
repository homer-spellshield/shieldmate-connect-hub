import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, Building, Award, Target } from 'lucide-react';

interface Stats {
  volunteers: number;
  organizations: number;
  skills: number;
  missions: number;
}

export const SystemOverview = () => {
  const [stats, setStats] = useState<Stats>({
    volunteers: 0,
    organizations: 0,
    skills: 0,
    missions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [volunteersRes, orgsRes, skillsRes, missionsRes] = await Promise.all([
          supabase.from('user_roles').select('id', { count: 'exact' }).eq('role', 'volunteer'),
          supabase.from('organizations').select('id', { count: 'exact' }),
          supabase.from('skills').select('id', { count: 'exact' }),
          supabase.from('mission_templates').select('id', { count: 'exact' })
        ]);

        setStats({
          volunteers: volunteersRes.count || 0,
          organizations: orgsRes.count || 0,
          skills: skillsRes.count || 0,
          missions: missionsRes.count || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Volunteers',
      value: stats.volunteers,
      icon: Users,
      description: 'Registered volunteers in the system'
    },
    {
      title: 'Organizations',
      value: stats.organizations,
      icon: Building,
      description: 'Active organizations seeking help'
    },
    {
      title: 'Available Skills',
      value: stats.skills,
      icon: Award,
      description: 'Skills available for matching'
    },
    {
      title: 'Mission Templates',
      value: stats.missions,
      icon: Target,
      description: 'Available mission templates'
    }
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>
            Overall system status and key metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database Connection</span>
              <span className="text-sm text-green-600">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Authentication</span>
              <span className="text-sm text-green-600">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Row Level Security</span>
              <span className="text-sm text-green-600">Enabled</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};