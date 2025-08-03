import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

// --- ZOD SCHEMAS ---
const profileSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  bio: z.string().optional()
});
type ProfileForm = z.infer<typeof profileSchema>;

// --- TYPE DEFINITIONS ---
interface Volunteer {
  id: string; // This is the user_id from the profiles table
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  created_at: string;
}

interface Skill {
  id: string;
  name: string;
  category: string | null;
  domain: string | null; // Assuming you add this to your skills table
}

interface GroupedSkills {
  [category: string]: {
    [domain: string]: Skill[];
  };
}

// --- MAIN COMPONENT ---
export const VolunteerManagement = () => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [groupedSkills, setGroupedSkills] = useState<GroupedSkills>({});
  const [volunteerSkills, setVolunteerSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [volunteerToDelete, setVolunteerToDelete] = useState<Volunteer | null>(null);
  const { toast } = useToast();

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { email: '', password: '', firstName: '', lastName: '', bio: '' }
  });

  // --- DATA FETCHING ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [volunteersRes, skillsRes] = await Promise.all([
        (supabase as any).rpc('get_all_volunteers_with_details'),
        supabase.from('skills').select('*').order('category').order('domain').order('name')
      ]);

      if (volunteersRes.error) throw volunteersRes.error;
      if (skillsRes.error) throw skillsRes.error;

      setVolunteers((volunteersRes.data as Volunteer[]) || []);
      const skillsData = (skillsRes.data as Skill[]) || [];
      setAllSkills(skillsData);

      // Group skills for the UI
      const grouped = skillsData.reduce((acc, skill) => {
        const category = skill.category || 'General';
        const domain = skill.domain || 'Miscellaneous';
        if (!acc[category]) acc[category] = {};
        if (!acc[category][domain]) acc[category][domain] = [];
        acc[category][domain].push(skill);
        return acc;
      }, {} as GroupedSkills);
      setGroupedSkills(grouped);

    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to fetch data: ' + error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- DIALOG AND FORM HANDLING ---
  const handleOpenDialog = async (volunteer: Volunteer | null) => {
    setEditingVolunteer(volunteer);
    if (volunteer) {
      form.reset({
        email: volunteer.email || '',
        password: '',
        firstName: volunteer.first_name || '',
        lastName: volunteer.last_name || '',
        bio: volunteer.bio || ''
      });
      // Fetch this specific volunteer's skills
      const { data, error } = await supabase.from('volunteer_skills').select('skill_id').eq('volunteer_id', volunteer.id);
      if (error) toast({ title: 'Error', description: "Could not fetch volunteer's skills.", variant: 'destructive' });
      setVolunteerSkills(data?.map(s => s.skill_id) || []);
    } else {
      form.reset({ email: '', password: '', firstName: '', lastName: '', bio: '' });
      setVolunteerSkills([]);
    }
    setIsDialogOpen(true);
  };

  const handleProfileSubmit = async (data: ProfileForm) => {
    // NOTE: This requires a secure Supabase Edge Function `admin-update-user`.
    toast({ title: "Placeholder", description: "Profile editing functionality to be implemented." });
  };

  const handleSkillsSubmit = async () => {
    if (!editingVolunteer) return;
    try {
      const { error } = await supabase.functions.invoke('set-volunteer-skills', {
        body: { volunteerId: editingVolunteer.id, skillIds: volunteerSkills }
      });
      if (error) throw error;
      toast({ title: 'Success', description: 'Volunteer skills have been updated.' });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // --- DELETE HANDLING ---
  const handleDeleteClick = (volunteer: Volunteer) => {
    setVolunteerToDelete(volunteer);
    setIsAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!volunteerToDelete) return;
    
    try {
      // NOTE: This requires a secure Supabase Edge Function `admin-delete-user`.
      toast({ 
        title: "Not Implemented", 
        description: "Volunteer deletion functionality requires an Edge Function to be created.", 
        variant: "destructive" 
      });
      setIsAlertOpen(false);
      setVolunteerToDelete(null);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to delete volunteer", 
        variant: "destructive" 
      });
    }
  };

  // --- UTILITY ---
  const filteredVolunteers = volunteers.filter(v =>
    `${v.first_name || ''} ${v.last_name || ''} ${v.email || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Volunteer Management</CardTitle>
              <CardDescription>Add and manage volunteer accounts in the system</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog(null)}>
              <Plus className="h-4 w-4 mr-2" /> Add Volunteer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search volunteers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
          </div>
          {loading ? <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVolunteers.map((volunteer) => (
                  <TableRow key={volunteer.id}>
                    <TableCell className="font-medium">{volunteer.first_name} {volunteer.last_name}</TableCell>
                    <TableCell>{volunteer.email}</TableCell>
                    <TableCell>{new Date(volunteer.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(volunteer)}>
                        <Edit className="h-4 w-4 mr-2" /> Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingVolunteer ? `Manage ${editingVolunteer.first_name}` : 'Create New Volunteer'}</DialogTitle>
            <DialogDescription>
              {editingVolunteer ? 'Update details and manage skills for this volunteer.' : 'Add a new volunteer to the system.'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile Details</TabsTrigger>
              <TabsTrigger value="skills" disabled={!editingVolunteer}>Manage Skills</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleProfileSubmit)} className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  </div>
                  <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="password" render={({ field }) => ( <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder={editingVolunteer ? 'Leave blank to keep unchanged' : ''} {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="bio" render={({ field }) => ( <FormItem><FormLabel>Bio (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  
                  <div className="flex justify-between items-center pt-4">
                    <div>
                      {editingVolunteer && (
                        <Button type="button" variant="destructive" onClick={() => handleDeleteClick(editingVolunteer)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete Volunteer
                        </Button>
                      )}
                    </div>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills">
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">Select the skills you have verified for this volunteer.</p>
                <div className="max-h-[400px] overflow-y-auto pr-4">
                  <Accordion type="multiple" className="w-full">
                    {Object.entries(groupedSkills).map(([category, domains]) => (
                      <AccordionItem value={category} key={category}>
                        <AccordionTrigger className="font-semibold">{category}</AccordionTrigger>
                        <AccordionContent>
                          {Object.entries(domains).map(([domain, skillsInDomain]) => (
                            <div key={domain} className="mb-4">
                              <h4 className="font-medium text-sm mb-2">{domain}</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {skillsInDomain.map(skill => (
                                  <div key={skill.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={skill.id}
                                      checked={volunteerSkills.includes(skill.id)}
                                      onCheckedChange={(checked) => {
                                        setVolunteerSkills(prev => 
                                          checked ? [...prev, skill.id] : prev.filter(id => id !== skill.id)
                                        );
                                      }}
                                    />
                                    <label htmlFor={skill.id} className="text-sm font-normal">{skill.name}</label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
                <Separator />
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSkillsSubmit}>Save Skills</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog for Delete Confirmation */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the volunteer's account and remove all of their associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
