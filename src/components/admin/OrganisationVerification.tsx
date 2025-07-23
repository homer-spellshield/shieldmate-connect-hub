import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Building, Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

// Define the type for an organisation object based on the database schema
// This now includes the new 'status' and 'abn' fields.
type Organisation = Database['public']['Tables']['organizations']['Row'];

export const OrganisationVerification = () => {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Function to fetch organisations awaiting verification
  const fetchPendingOrganisations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('status', 'pending_verification')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setOrganisations(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch pending organisations: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingOrganisations();
  }, []);

  // Handler to approve an organisation
  const handleApprove = async (orgId: string) => {
    setProcessingId(orgId);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ status: 'approved' })
        .eq('id', orgId);

      if (error) throw error;

      toast({
        title: 'Organisation Approved',
        description: 'The organisation can now post missions.',
      });
      // Refresh the list by filtering out the approved organisation
      setOrganisations(prev => prev.filter(org => org.id !== orgId));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to approve organisation: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Handler to reject an organisation
  const handleReject = async (orgId: string) => {
    if (!window.confirm('Are you sure you want to reject this organisation? This action cannot be undone.')) {
        return;
    }
    setProcessingId(orgId);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ status: 'rejected' })
        .eq('id', orgId);

      if (error) throw error;

      toast({
        title: 'Organisation Rejected',
        description: 'The organisation has been marked as rejected.',
        variant: 'destructive',
      });
       // Refresh the list by filtering out the rejected organisation
      setOrganisations(prev => prev.filter(org => org.id !== orgId));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to reject organisation: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organisation Verification Queue</CardTitle>
        <CardDescription>
          Review and approve new organisations to grant them access to the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : organisations.length === 0 ? (
          <div className="text-center py-10">
            <Building className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">All Clear!</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              There are no new organisations awaiting verification.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organisation Name</TableHead>
                <TableHead>ABN</TableHead>
                <TableHead>Contact Email</TableHead>
                <TableHead>Registered On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organisations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>
                    <a 
                      href={`https://abr.business.gov.au/ABN/View?id=${org.abn}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:text-primary"
                    >
                      {org.abn || 'N/A'}
                    </a>
                  </TableCell>
                  <TableCell>{org.contact_email}</TableCell>
                  <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(org.id)}
                      disabled={processingId === org.id}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(org.id)}
                      disabled={processingId === org.id}
                    >
                      {processingId === org.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-2" /> Approve</>}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
