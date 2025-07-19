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

// Updated type to fetch email from profiles table
type TeamMember = {
  id: string;
  role: string;
  user_id: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    email: string | null; // Added email here
  } | null;
};

const TeamManagement = () => {
  const { user, profile } = useAuth();
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

  const fetchTeamMembers = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data: orgMemberData, error: orgMemberError } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(id, name)')
        .eq('user_id', user.id)
        .single();

      if (orgMemberError || !orgMemberData) throw orgMemberError || new Error("Organization not found.");
      
      const org = orgMemberData.organizations as { id: string, name: string };
      setOrganization(org);

      // First get organization members
      const { data: membersData, error: membersError } = await supabase
        .from('organization_members')
        .select('id, role, user_id')
        .eq('organization_id', org.id);

      if (membersError) throw membersError;

      // Then get profiles for each member
      const userIds = membersData?.map(m => m.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Get user emails from auth metadata (since we can't directly query auth.users)
      // We'll need to fetch this differently - for now, let's use a workaround
      const membersWithProfiles = membersData?.map(member => {
        const profile = profilesData?.find(p => p.user_id === member.user_id);
        return {
          ...member,
          profiles: profile ? {
            first_name: profile.first_name,
            last_name: profile.last_name,
            avatar_url: profile.avatar_url,
            email: null // We'll need to get this from somewhere else
          } : null
        };
      }) || [];

      setTeamMembers(membersWithProfiles as TeamMember[]);
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
  
    // This will call a Supabase Edge Function we will create in the next step.
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
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {getInitials(member.profiles?.first_name, member.profiles?.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {member.profiles?.first_name} {member.profiles?.last_name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.profiles?.email}
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
                                <DropdownMenuItem>Change Role</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
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
