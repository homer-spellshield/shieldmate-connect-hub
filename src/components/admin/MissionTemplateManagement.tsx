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
import { Plus, Edit, Trash2, Search, Check, ChevronsUpDown, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const missionTemplateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  estimated_hours: z.coerce.number().min(1, 'Estimated hours are required'),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  required_skills: z.array(z.string()).min(1, 'At least one skill is required'),
});

type MissionTemplateForm = z.infer<typeof missionTemplateSchema>;

interface Skill {
  id: string;
  name: string;
}

interface MissionTemplate extends MissionTemplateForm {
  id: string;
  created_at: string;
  mission_template_skills: { skills: { name: string } | null }[];
}

export const MissionTemplateManagement = () => {
  const [templates, setTemplates] = useState<MissionTemplate[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MissionTemplate | null>(null);
  const { toast } = useToast();

  const form = useForm<MissionTemplateForm>({
    resolver: zodResolver(missionTemplateSchema),
    defaultValues: {
      title: '',
      description: '',
      estimated_hours: 0,
      difficulty_level: 'intermediate',
      required_skills: [],
    },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [templatesRes, skillsRes] = await Promise.all([
        supabase.from('mission_templates').select(`*, mission_template_skills ( skills ( name ) )`),
        supabase.from('skills').select('id, name').order('name'),
      ]);

      if (templatesRes.error) throw templatesRes.error;
      if (skillsRes.error) throw skillsRes.error;

      setTemplates(templatesRes.data as any || []);
      setAllSkills(skillsRes.data || []);
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to fetch data: ' + error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDialog = (template: MissionTemplate | null = null) => {
    setEditingTemplate(template);
    if (template) {
      form.reset({
        title: template.title,
        description: template.description,
        estimated_hours: template.estimated_hours,
        difficulty_level: template.difficulty_level,
        required_skills: template.mission_template_skills.map((mts: any) => mts.skills.id).filter(Boolean),
      });
    } else {
      form.reset({
        title: '',
        description: '',
        estimated_hours: 8,
        difficulty_level: 'intermediate',
        required_skills: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleCreateOrUpdateTemplate = async (data: MissionTemplateForm) => {
    try {
      if (editingTemplate) {
        // This requires an RPC function to handle the update transactionally
        const { error } = await supabase.rpc('update_mission_template_with_skills', {
          p_template_id: editingTemplate.id,
          p_title: data.title,
          p_description: data.description,
          p_estimated_hours: data.estimated_hours,
          p_difficulty_level: data.difficulty_level,
          p_skill_ids: data.required_skills,
        });
        if (error) throw error;
        toast({ title: 'Success', description: 'Mission template updated successfully' });
      } else {
        const { error } = await supabase.rpc('create_mission_template_with_skills', {
          p_title: data.title,
          p_description: data.description,
          p_estimated_hours: data.estimated_hours,
          p_difficulty_level: data.difficulty_level,
          p_skill_ids: data.required_skills,
        });
        if (error) throw error;
        toast({ title: 'Success', description: 'Mission template created successfully' });
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase.from('mission_templates').delete().eq('id', templateId);
      if (error) throw error;
      toast({ title: 'Success', description: 'Mission template deleted successfully' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // *** NEW: State for skill search input ***
  const [skillSearch, setSkillSearch] = useState('');

  // *** NEW: Filtered skills based on search input ***
  const filteredSkills = useMemo(() =>
    allSkills.filter(skill =>
      skill.name.toLowerCase().includes(skillSearch.toLowerCase())
    ), [allSkills, skillSearch]
  );


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Mission Template Management</CardTitle>
            <CardDescription>Create and manage reusable mission templates for organisations.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button onClick={() => handleOpenDialog()}><Plus className="h-4 w-4 mr-2" />Add Template</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? 'Edit Mission Template' : 'Create New Mission Template'}</DialogTitle>
                <DialogDescription>Fill in the details for the reusable mission template.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateOrUpdateTemplate)} className="space-y-4">
                  <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="estimated_hours" render={({ field }) => (<FormItem><FormLabel>Estimated Hours</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="difficulty_level" render={({ field }) => (<FormItem><FormLabel>Difficulty Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="beginner">Beginner</SelectItem><SelectItem value="intermediate">Intermediate</SelectItem><SelectItem value="advanced">Advanced</SelectItem></SelectContent>
                      </Select>
                      <FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="required_skills" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Skills</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <div className="relative">
                              <Button variant="outline" role="combobox" className="w-full justify-between h-auto min-h-10 flex-wrap">
                                <div className="flex gap-1 flex-wrap">
                                  {field.value.length > 0 ? (
                                    allSkills.filter(skill => field.value.includes(skill.id)).map(skill => (
                                      <Badge variant="secondary" key={skill.id} className="mr-1">
                                        {skill.name}
                                      </Badge>
                                    ))
                                  ) : "Select skills..."}
                                </div>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </div>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[600px] p-0">
                          <Command>
                            {/* *** UPDATED: CommandInput now updates our search state *** */}
                            <CommandInput
                              placeholder="Search skills..."
                              value={skillSearch}
                              onValueChange={setSkillSearch}
                            />
                            <CommandList>
                              <CommandEmpty>No skills found.</CommandEmpty>
                              <CommandGroup>
                                {/* *** UPDATED: We now map over the filtered list *** */}
                                {filteredSkills.map((skill) => (
                                  <CommandItem
                                    value={skill.name}
                                    key={skill.id}
                                    onSelect={() => {
                                      const currentSkills = field.value;
                                      const newSkills = currentSkills.includes(skill.id)
                                        ? currentSkills.filter(id => id !== skill.id)
                                        : [...currentSkills, skill.id];
                                      field.onChange(newSkills);
                                      setSkillSearch(''); // Clear search on select
                                    }}
                                  >
                                    <Check className={`mr-2 h-4 w-4 ${field.value.includes(skill.id) ? "opacity-100" : "opacity-0"}`} />
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
                  <Button type="submit" className="w-full">Save Template</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Difficulty</TableHead><TableHead>Skills</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.title}</TableCell>
                <TableCell><Badge variant="outline" className="capitalize">{template.difficulty_level}</Badge></TableCell>
                <TableCell className="max-w-xs"><div className="flex flex-wrap gap-1">{template.mission_template_skills.map((mts: any, i) => mts.skills ? <Badge key={i} variant="secondary">{mts.skills.name}</Badge> : null)}</div></TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(template)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="outline" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Delete Template</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete "{template.title}"? This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteTemplate(template.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
