import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

// Schema for creating a volunteer
const createVolunteerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  bio: z.string().optional()
});

// Schema for editing a volunteer (password is optional)
const editVolunteerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  bio: z.string().optional()
});

type VolunteerForm = z.infer<typeof createVolunteerSchema>;

interface Volunteer {
  id: string; // This is the user_id from the profiles table
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  created_at: string;
}

export const VolunteerManagement = () => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [volunteerToDelete, setVolunteerToDelete] = useState<Volunteer | null>(null);
  const { toast } = useToast();

  const form = useForm<VolunteerForm>({
    resolver: zodResolver(editingVolunteer ? editVolunteerSchema : createVolunteerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      bio: ''
    }
  });
  
  // Fetch volunteers from the database
  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any).rpc('get_all_volunteers_with_details');
      if (error) throw error;
      setVolunteers((data as Volunteer[]) || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch volunteers: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  // Open dialog for creating or editing
  const handleOpenDialog = (volunteer: Volunteer | null) => {
    setEditingVolunteer(volunteer);
    form.reset(volunteer ? {
      email: volunteer.email || '',
      password: '',
      firstName: volunteer.first_name || '',
      lastName: volunteer.last_name || '',
      bio: volunteer.bio || ''
    } : {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      bio: ''
    });
    setIsDialogOpen(true);
  };

  // Handle form submission for both create and edit
  const handleSubmitVolunteer = async (data: VolunteerForm) => {
    if (editingVolunteer) {
      // --- UPDATE VOLUNTEER ---
      // NOTE: This requires a secure Supabase Edge Function `admin-update-user`.
      // The function should accept a `userId` and the fields to update.
      console.log("Updating volunteer:", editingVolunteer.id, data);
      toast({
        title: "Edit Functionality Placeholder",
        description: "Please create an 'admin-update-user' Edge Function to enable editing.",
      });
      // Example of how you would call the function:
      /*
      try {
        const { error } = await supabase.functions.invoke('admin-update-user', {
          body: { userId: editingVolunteer.id, ...data }
        });
        if (error) throw error;
        toast({ title: 'Success', description: 'Volunteer updated successfully' });
        setIsDialogOpen(false);
        fetchVolunteers();
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
      */
    } else {
      // --- CREATE VOLUNTEER ---
      try {
        const { error } = await supabase.functions.invoke('admin-create-user', {
          body: { ...data, role: 'volunteer' }
        });
        if (error) throw error;
        toast({ title: 'Success', description: 'Volunteer created successfully' });
        setIsDialogOpen(false);
        fetchVolunteers();
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    }
  };

  // Set the volunteer to be deleted and open the confirmation dialog
  const handleDeleteClick = (volunteer: Volunteer) => {
    setVolunteerToDelete(volunteer);
    setIsAlertOpen(true);
  };

  // Confirm and execute deletion
  const handleDeleteConfirm = async () => {
    if (!volunteerToDelete) return;
    
    // --- DELETE VOLUNTEER ---
    // NOTE: This requires a secure Supabase Edge Function `admin-delete-user`.
    // The function should accept a `userId` and use the admin client to delete the user.
    console.log("Deleting volunteer:", volunteerToDelete.id);
    toast({
      title: "Delete Functionality Placeholder",
      description: "Please create an 'admin-delete-user' Edge Function to enable deletion.",
    });
    // Example of how you would call the function:
    /*
    try {
      const { error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId: volunteerToDelete.id }
      });
      if (error) throw error;
      toast({ title: 'Success', description: 'Volunteer deleted successfully' });
      fetchVolunteers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsAlertOpen(false);
      setVolunteerToDelete(null);
    }
    */
    setIsAlertOpen(false); // Remove this line when implementing the actual function
    setVolunteerToDelete(null); // Remove this line when implementing the actual function
  };

  const filteredVolunteers = volunteers.filter(volunteer =>
    `${volunteer.first_name || ''} ${volunteer.last_name || ''} ${volunteer.email || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
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
              <Plus className="h-4 w-4 mr-2" />
              Add Volunteer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search volunteers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVolunteers.map((volunteer) => (
                  <TableRow key={volunteer.id}>
                    <TableCell className="font-medium">{volunteer.first_name} {volunteer.last_name}</TableCell>
                    <TableCell>{volunteer.email}</TableCell>
                    <TableCell>{new Date(volunteer.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(volunteer)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteClick(volunteer)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVolunteer ? 'Edit' : 'Create New'} Volunteer</DialogTitle>
            <DialogDescription>
              {editingVolunteer ? 'Update the details for this volunteer.' : 'Add a new volunteer to the system.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitVolunteer)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="password" render={({ field }) => ( <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder={editingVolunteer ? 'Leave blank to keep unchanged' : ''} {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="bio" render={({ field }) => ( <FormItem><FormLabel>Bio (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Form>
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
            <AlertDialogAction onClick={handleDeleteConfirm}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
