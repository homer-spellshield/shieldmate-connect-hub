import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


// Schema for the invitation form
const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  role: z.enum(['member', 'owner'], { required_error: "Please select a role." }),
});
type InviteForm = z.infer<typeof inviteSchema>;

// **MODIFICATION 1: Updated TeamMember type to match the RPC function's return value**
type TeamMember = {
  id: string;
  role: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email: string | null;
};

const TeamManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<{ id: string, name: string } | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const form = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'member',
    },
  });

  // **MODIFICATION 2: Replaced the entire fetch function to use the new Supabase RPC**
  const fetchTeamMembers = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // First, get the user's organization ID and name
      const { data: orgMemberData, error: orgMemberError } = await supabase
        .from('organization_members')
        .select('organizations(id, name)')
        .eq('user_id', user.id)
        .single();
  
      if (orgMemberError || !orgMemberData?.organizations) {
        throw orgMemberError || new Error("Organization not found.");
      }
      
      const org = orgMemberData.organizations as { id: string, name: string };
      setOrganization(org);
  
      // Now, make a single, secure call to our new RPC function
      const { data: membersData, error: rpcError } = await supabase
        .rpc('get_team_members', { org_id: org.id });
  
      if (rpcError) throw rpcError;
  
      setTeamMembers(membersData as TeamMember[]);
  
    } catch (error: any) {
      toast({
        title: "Error fetching team members",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchTeamMembers();
  }, [user]);

  const handleInviteMember = async (values: InviteForm) => {
    if (!organization) return;
  
    const { error } = await supabase.functions.invoke('invite-team-member', {
      body: {
        orgId: organization.id,
        orgName: organization.name,
        inviteeEmail: values.email,
        inviteeRole: values.role,
      },
    });
  
    if (error) {
      toast({
        title: "Failed to send invitation",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Invitation Sent!",
        description: `${values.email} has been invited to join your organization.`,
      });
      setIsInviteDialogOpen(false);
      form.reset();
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    if (!organization) return;
    
    try {
      const { error } = await supabase.rpc('update_team_member_role', {
        p_org_id: organization.id,
        p_member_id: memberId,
        p_new_role: newRole
      });

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: `Team member role has been updated to ${newRole}.`,
      });
      
      // Refresh the team members list
      fetchTeamMembers();
    } catch (error: any) {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!organization) return;
    
    if (!confirm('Are you sure you want to remove this team member? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await supabase.rpc('remove_team_member', {
        p_org_id: organization.id,
        p_member_id: memberId
      });

      if (error) throw error;

      toast({
        title: "Member Removed",
        description: "Team member has been successfully removed from the organization.",
      });
      
      // Refresh the team members list
      fetchTeamMembers();
    } catch (error: any) {
      toast({
        title: "Failed to remove member",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const currentUserRole = teamMembers.find(m => m.user_id === user?.id)?.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
        <p className="text-muted-foreground">
          Invite and manage members of your organization, <span className="font-semibold text-primary">{organization?.name}</span>.
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
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={currentUserRole !== 'owner'}>
                    <Plus className="h-4 w-4 mr-2" />
                    Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite a new team member</DialogTitle>
                  <DialogDescription>
                    Enter the email address and select a role for the new member. They will receive an email to accept the invitation.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleInviteMember)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="new.member@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="owner">Owner</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="ghost">Cancel</Button>
                      </DialogClose>
                      <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Sending..." : "Send Invitation"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading team members...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.length > 0 ? (
                  teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      {/* **MODIFICATION 3: Updated JSX to use flattened data** */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {getInitials(member.first_name, member.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {member.first_name} {member.last_name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="capitalize">
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                         {currentUserRole === 'owner' && user?.id !== member.user_id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                 <DropdownMenuItem 
                                   onClick={() => handleChangeRole(member.id, member.role === 'owner' ? 'member' : 'owner')}
                                   disabled={form.formState.isSubmitting}
                                 >
                                   {member.role === 'owner' ? 'Change to Member' : 'Change to Owner'}
                                 </DropdownMenuItem>
                                 <DropdownMenuItem 
                                   className="text-destructive"
                                   onClick={() => handleRemoveMember(member.id)}
                                   disabled={form.formState.isSubmitting}
                                 >
                                   Remove Member
                                 </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                         )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No team members found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamManagement;
