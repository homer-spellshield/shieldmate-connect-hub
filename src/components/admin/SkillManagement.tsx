import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  category: z.string().optional(),
  description: z.string().optional()
});

type SkillForm = z.infer<typeof skillSchema>;

interface Skill {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  created_at: string;
}

export const SkillManagement = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<SkillForm>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      name: '',
      category: '',
      description: ''
    }
  });

  const fetchSkills = async () => {
    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('name');

      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error('Error fetching skills:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch skills',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleCreateSkill = async (data: SkillForm) => {
    try {
      const { error } = await supabase
        .from('skills')
        .insert({
          name: data.name,
          category: data.category || null,
          description: data.description || null
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Skill created successfully'
      });

      setIsDialogOpen(false);
      form.reset();
      fetchSkills();
    } catch (error: any) {
      console.error('Error creating skill:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create skill',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    try {
      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', skillId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Skill deleted successfully'
      });

      fetchSkills();
    } catch (error: any) {
      console.error('Error deleting skill:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete skill',
        variant: 'destructive'
      });
    }
  };

  const filteredSkills = skills.filter(skill =>
    skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    skill.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(skills.map(skill => skill.category).filter(Boolean))];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Skill Management</CardTitle>
              <CardDescription>
                Manage skills that can be assigned to volunteers
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Skill
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Skill</DialogTitle>
                  <DialogDescription>
                    Add a new skill to the system
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateSkill)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Skill Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., React Development" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Frontend Development" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Brief description of the skill..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? 'Creating...' : 'Create Skill'}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {categories.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Categories:</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge key={category} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading skills...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSkills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">No skills found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSkills.map((skill) => (
                    <TableRow key={skill.id}>
                      <TableCell className="font-medium">{skill.name}</TableCell>
                      <TableCell>
                        {skill.category ? (
                          <Badge variant="outline">{skill.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {skill.description ? (
                          <span className="text-sm">{skill.description}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">No description</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(skill.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteSkill(skill.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};