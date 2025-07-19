import { useAuth } from '@/hooks/useAuth';
import VolunteerDashboard from './VolunteerDashboard';
import OrganisationDashboard from './OrganisationDashboard';
import AdminDashboard from './AdminDashboard';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const { userRoles, loading } = useAuth();

  // While the authentication is loading, show a skeleton screen.
  // This is the critical step that prevents any pages from loading before we know who the user is.
  if (loading) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>
        </div>
    );
  }

  // --- Role-Based Routing ---
  // Once loading is complete, check the user's role and render the correct dashboard.

  if (userRoles.includes('super_admin')) {
    return <AdminDashboard />;
  }

  if (userRoles.includes('organization_owner') || userRoles.includes('team_member')) {
    return <OrganisationDashboard />;
  }

  if (userRoles.includes('volunteer')) {
    return <VolunteerDashboard />;
  }

  // Fallback for any edge cases where a user might not have a role.
  return (
    <div className="text-center py-10">
      <h1 className="text-2xl font-bold">Authentication Error</h1>
      <p className="text-muted-foreground">We could not determine your user role. Please sign out and try again, or contact support.</p>
    </div>
  );
};

export default Index;
