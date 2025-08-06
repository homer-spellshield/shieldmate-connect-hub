// src/components/admin/MissionTemplateManagement.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Schema for the mission template form
const templateSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  estimated_hours: z.coerce.number().positive().optional().nullable(),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).optional().nullable(),
  required_skills: z.array(z.string()).min(1, 'At least one skill is required'),
});

type TemplateForm = z.infer<typeof templateSchema>;

// Types for data fetched from Supabase
interface Skill {
  id: string;
  name: string;
}

interface MissionTemplate {
  id: string;
  title: string;
  description: string;
  estimated_hours: number | null;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null;
  created_at: string;
  mission_template_skills: { skills: { id: string, name: string } }[];
}

export const MissionTemplateManagement = () => {
  const [templates, setTemplates] = useState<MissionTemplate[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MissionTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<MissionTemplate | null>(null);
  const { toast } = useToast();

  const form = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      title: '',
      description: '',
      estimated_hours: null,
      difficulty_level: null,
      required_skills: [],
    },
  });

  const fetchTemplatesAndSkills = async () => {
    setLoading(true);
    try {
      const [templatesRes, skillsRes] = await Promise.all([
        supabase.from('mission_templates').select(`
          id,
          title,
          description,
          estimated_hours,
          difficulty_level,
          created_at,
          mission_template_skills (
            skills ( id, name )
          )
        `),
        supabase.from('skills').select('id, name').order('name'),
      ]);

      if (templatesRes.error) throw templatesRes.error;
      if (skillsRes.error) throw skillsRes.error;

      setTemplates((templatesRes.data as any) || []);
      setAllSkills(skillsRes.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplatesAndSkills();
  }, []);

  const handleOpenDialog = (template: MissionTemplate | null = null) => {
    setEditingTemplate(template);
    if (template) {
      form.reset({
        id: template.id,
        title: template.title,
        description: template.description,
        estimated_hours: template.estimated_hours,
        difficulty_level: template.difficulty_level,
        required_skills: template.mission_template_skills.map(s => s.skills.id),
      });
    } else {
      form.reset({
        title: '',
        description: '',
        estimated_hours: null,
        difficulty_level: null,
        required_skills: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    try {
      const { error } = await supabase.from('mission_templates').delete().eq('id', templateToDelete.id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Mission template deleted.' });
      fetchTemplatesAndSkills();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const onSubmit = async (values: TemplateForm) => {
    try {
      const { required_skills, ...templateData } = values;
      
      const { data: savedTemplate, error: templateError } = await supabase
        .from('mission_templates')
        .upsert({
          id: templateData.id,
          title: templateData.title,
          description: templateData.description,
          estimated_hours: templateData.estimated_hours,
          difficulty_level: templateData.difficulty_level,
        })
        .select()
        .single();
      
      if (templateError) throw templateError;
      if (!savedTemplate) throw new Error("Failed to save template.");

      const { error: deleteError } = await supabase
        .from('mission_template_skills')
        .delete()
        .eq('template_id', savedTemplate.id);
      if (deleteError) throw deleteError;

      const skillsToInsert = required_skills.map(skillId => ({
        template_id: savedTemplate.id,
        skill_id: skillId,
      }));
      const { error: insertError } = await supabase
        .from('mission_template_skills')
        .insert(skillsToInsert);
      if (insertError) throw insertError;

      toast({ title: 'Success', description: `Template ${values.id ? 'updated' : 'created'} successfully.` });
      setIsDialogOpen(false);
      fetchTemplatesAndSkills();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mission Template Management</CardTitle>
              <CardDescription>Create and manage reusable mission templates.</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <p>Loading...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Required Skills</TableHead>
                  <TableHead>Est. Hours</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map(template => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.title}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {template.mission_template_skills.map(s => (
                          <Badge key={s.skills.id} variant="secondary">{s.skills.name}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{template.estimated_hours || 'N/A'}</TableCell>
                    <TableCell>
                      {template.difficulty_level ? (
                        <Badge variant="outline" className="capitalize">{template.difficulty_level}</Badge>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(template)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => {
                            setTemplateToDelete(template);
                            setIsDeleteDialogOpen(true);
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit' : 'Create'} Mission Template</DialogTitle>
            <DialogDescription>Fill in the details for the reusable mission template.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="estimated_hours" render={({ field }) => (
                  <FormItem><FormLabel>Estimated Hours</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="difficulty_level" render={({ field }) => (
                  <FormItem><FormLabel>Difficulty Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  <FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="required_skills" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Required Skills</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value?.length && "text-muted-foreground")}>
                          {field.value?.length > 0 ? `${field.value.length} skill(s) selected` : "Select skills"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Search skills..." />
                        <CommandList>
                          <CommandEmpty>No skills found.</CommandEmpty>
                          <CommandGroup>
                            {allSkills.map((skill) => (
                              <CommandItem
                                value={skill.name}
                                key={skill.id}
                                onSelect={() => {
                                  const currentSkills = field.value || [];
                                  const newSkills = currentSkills.includes(skill.id)
                                    ? currentSkills.filter((s) => s !== skill.id)
                                    : [...currentSkills, skill.id];
                                  field.onChange(newSkills);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", field.value?.includes(skill.id) ? "opacity-100" : "opacity-0")} />
                                {skill.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Template'}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the template "{templateToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTemplateToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
