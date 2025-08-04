import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  category: z.string().optional(),
  domain: z.string().optional(),
  description: z.string().optional()
});

type SkillForm = z.infer<typeof skillSchema>;

interface Skill {
  id: string;
  name: string;
  category: string | null;
  domain: string | null;
  description: string | null;
  created_at: string;
}

type SortKey = 'name' | 'category' | 'created_at';
type SortDirection = 'asc' | 'desc';

export const SkillManagement = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'name', direction: 'asc' });
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<SkillForm>({
    resolver: zodResolver(skillSchema),
    defaultValues: { name: '', category: '', domain: '', description: '' }
  });

  const fetchSkills = async () => {
    try {
      const { data, error } = await supabase.from('skills').select('*');
      if (error) throw error;
      setSkills(data || []);
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to fetch skills', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleOpenDialog = (skill: Skill | null = null) => {
    setEditingSkill(skill);
    form.reset(skill || { name: '', category: '', domain: '', description: '' });
    setIsDialogOpen(true);
  };

  const handleCreateOrUpdateSkill = async (data: SkillForm) => {
    try {
      const payload = {
        name: data.name,
        category: data.category || null,
        domain: data.domain || null,
        description: data.description || null
      };
      const { error } = editingSkill
        ? await supabase.from('skills').update(payload).eq('id', editingSkill.id)
        : await supabase.from('skills').insert(payload);

      if (error) throw error;
      toast({ title: 'Success', description: `Skill ${editingSkill ? 'updated' : 'created'} successfully` });
      setIsDialogOpen(false);
      setEditingSkill(null);
      fetchSkills();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save skill', variant: 'destructive' });
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    try {
      const { error } = await supabase.from('skills').delete().eq('id', skillId);
      if (error) throw error;
      toast({ title: 'Success', description: 'Skill deleted successfully' });
      fetchSkills();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete skill', variant: 'destructive' });
    }
  };

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedAndFilteredSkills = useMemo(() => {
    let result = [...skills];
    // Filter by search term
    if (searchTerm) {
      result = result.filter(skill =>
        skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skill.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // Filter by category
    if (categoryFilter) {
      result = result.filter(skill => skill.category === categoryFilter);
    }
    // Sort
    result.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [skills, searchTerm, categoryFilter, sortConfig]);

  const categories = ['All', ...new Set(skills.map(skill => skill.category).filter(Boolean) as string[])];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Skill Management</CardTitle>
            <CardDescription>Manage skills that can be assigned to volunteers</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingSkill(null); }}>
            <DialogTrigger asChild><Button onClick={() => handleOpenDialog()}><Plus className="h-4 w-4 mr-2" />Add Skill</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSkill ? 'Edit Skill' : 'Create New Skill'}</DialogTitle>
                <DialogDescription>{editingSkill ? 'Update the skill information' : 'Add a new skill to the system'}</DialogDescription>
              </DialogHeader>
              <Form {...form}><form onSubmit={form.handleSubmit(handleCreateOrUpdateSkill)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Skill Name</FormLabel><FormControl><Input {...field} placeholder="e.g., React Development" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><FormControl><Input {...field} placeholder="e.g., Web & Application Development" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="domain" render={({ field }) => (<FormItem><FormLabel>Domain</FormLabel><FormControl><Input {...field} placeholder="e.g., Frontend Development" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} placeholder="Brief description of the skill..." /></FormControl><FormMessage /></FormItem>)} />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? (editingSkill ? 'Updating...' : 'Creating...') : (editingSkill ? 'Update Skill' : 'Create Skill')}</Button>
              </form></Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search skills..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((category) => (
            <Badge key={category} variant={categoryFilter === category || (category === 'All' && !categoryFilter) ? 'default' : 'secondary'} onClick={() => setCategoryFilter(category === 'All' ? null : category)} className="cursor-pointer">
              {category}
            </Badge>
          ))}
        </div>
        {loading ? <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Button variant="ghost" onClick={() => handleSort('name')}>Name <ArrowUpDown className="ml-2 h-4 w-4 inline" /></Button></TableHead>
                <TableHead><Button variant="ghost" onClick={() => handleSort('category')}>Category <ArrowUpDown className="ml-2 h-4 w-4 inline" /></Button></TableHead>
                <TableHead>Description</TableHead>
                <TableHead><Button variant="ghost" onClick={() => handleSort('created_at')}>Created <ArrowUpDown className="ml-2 h-4 w-4 inline" /></Button></TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredSkills.map((skill) => (
                <TableRow key={skill.id}>
                  <TableCell className="font-medium">{skill.name}</TableCell>
                  <TableCell>{skill.category ? <Badge variant="outline">{skill.category}</Badge> : '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{skill.description || '-'}</TableCell>
                  <TableCell>{new Date(skill.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(skill)}><Edit className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="outline" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Delete Skill</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete "{skill.name}"? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteSkill(skill.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
