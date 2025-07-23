import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, Building, Award, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Stats {
  volunteers: number;
  organizations: number;
  skills: number;
  missions: number;
}

// Dummy data for the new chart
const missionActivityData = [
  { month: 'Jan', created: 4 },
  { month: 'Feb', created: 3 },
  { month: 'Mar', created: 5 },
  { month: 'Apr', created: 7 },
  { month: 'May', created: 6 },
  { month: 'Jun', created: 10 },
];

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
    { title: 'Total Volunteers', value: stats.volunteers, icon: Users, description: 'Registered volunteers in the system' },
    { title: 'Organisations', value: stats.organizations, icon: Building, description: 'Active organisations seeking help' },
    { title: 'Available Skills', value: stats.skills, icon: Award, description: 'Skills available for matching' },
    { title: 'Mission Templates', value: stats.missions, icon: Target, description: 'Available mission templates' }
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Loading...</CardTitle></CardHeader><CardContent><div className="h-8 w-16 bg-muted animate-pulse rounded"></div></CardContent></Card>
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
          <CardTitle>Mission Activity</CardTitle>
          <CardDescription>
            A look at the number of missions created over the past months.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] w-full">
          <ResponsiveContainer>
            <BarChart data={missionActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                }}
              />
              <Bar dataKey="created" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
