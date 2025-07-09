import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const templateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  estimated_hours: z.number().min(1, 'Estimated hours must be at least 1'),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  required_skills: z.array(z.string()).min(1, 'At least one skill is required'),
});

type TemplateForm = z.infer<typeof templateSchema>;

interface MissionTemplate {
  id: string;
  title: string;
  description: string;
  estimated_hours: number;
  difficulty_level: string;
  created_at: string;
  updated_at: string;
}

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface TemplateSkill {
  skill_id: string;
  skills: Skill;
}

export const MissionTemplateManagement = () => {
  const [templates, setTemplates] = useState<MissionTemplate[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [templateSkills, setTemplateSkills] = useState<Record<string, TemplateSkill[]>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MissionTemplate | null>(null);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      title: '',
      description: '',
      estimated_hours: 1,
      difficulty_level: 'beginner',
      required_skills: [],
    },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('mission_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;

      // Fetch skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('*')
        .order('name');

      if (skillsError) throw skillsError;

      // Fetch template skills relationships
      const { data: templateSkillsData, error: templateSkillsError } = await supabase
        .from('mission_template_skills')
        .select(`
          template_id,
          skill_id,
          skills (id, name, category)
        `);

      if (templateSkillsError) throw templateSkillsError;

      setTemplates(templatesData || []);
      setSkills(skillsData || []);

      // Group template skills by template_id
      const groupedSkills: Record<string, TemplateSkill[]> = {};
      templateSkillsData?.forEach((ts: any) => {
        if (!groupedSkills[ts.template_id]) {
          groupedSkills[ts.template_id] = [];
        }
        groupedSkills[ts.template_id].push({
          skill_id: ts.skill_id,
          skills: ts.skills
        });
      });
      setTemplateSkills(groupedSkills);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load mission templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (template: MissionTemplate) => {
    setEditingTemplate(template);
    const templateSkillIds = templateSkills[template.id]?.map(ts => ts.skill_id) || [];
    
    form.reset({
      title: template.title,
      description: template.description,
      estimated_hours: template.estimated_hours,
      difficulty_level: template.difficulty_level as 'beginner' | 'intermediate' | 'advanced',
      required_skills: templateSkillIds,
    });
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingTemplate(null);
    form.reset({
      title: '',
      description: '',
      estimated_hours: 1,
      difficulty_level: 'beginner',
      required_skills: [],
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: TemplateForm) => {
    try {
      let templateId: string;

      if (editingTemplate) {
        // Update existing template
        const { error: updateError } = await supabase
          .from('mission_templates')
          .update({
            title: data.title,
            description: data.description,
            estimated_hours: data.estimated_hours,
            difficulty_level: data.difficulty_level,
          })
          .eq('id', editingTemplate.id);

        if (updateError) throw updateError;
        templateId = editingTemplate.id;

        // Remove existing skill relationships
        const { error: deleteError } = await supabase
          .from('mission_template_skills')
          .delete()
          .eq('template_id', templateId);

        if (deleteError) throw deleteError;
      } else {
        // Create new template
        const { data: newTemplate, error: createError } = await supabase
          .from('mission_templates')
          .insert({
            title: data.title,
            description: data.description,
            estimated_hours: data.estimated_hours,
            difficulty_level: data.difficulty_level,
          })
          .select()
          .single();

        if (createError) throw createError;
        templateId = newTemplate.id;
      }

      // Insert new skill relationships
      if (data.required_skills.length > 0) {
        const skillRelationships = data.required_skills.map(skillId => ({
          template_id: templateId,
          skill_id: skillId,
        }));

        const { error: skillsError } = await supabase
          .from('mission_template_skills')
          .insert(skillRelationships);

        if (skillsError) throw skillsError;
      }

      toast({
        title: "Success",
        description: `Mission template ${editingTemplate ? 'updated' : 'created'} successfully`,
      });

      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingTemplate ? 'update' : 'create'} mission template`,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('mission_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Mission template deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete mission template",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mission Template Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mission Template Management</CardTitle>
        <CardDescription>
          Manage mission templates and their required skills
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-6">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Edit Template' : 'Add New Template'}
                </DialogTitle>
                <DialogDescription>
                  {editingTemplate ? 'Update the mission template details' : 'Create a new mission template'}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter template title" {...field} />
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter template description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimated_hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Hours</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            placeholder="Enter estimated hours"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="difficulty_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="required_skills"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Required Skills</FormLabel>
                        <Popover open={skillsOpen} onOpenChange={setSkillsOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "justify-between",
                                  !field.value?.length && "text-muted-foreground"
                                )}
                              >
                                {field.value?.length
                                  ? `${field.value.length} skill(s) selected`
                                  : "Select skills"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search skills..." />
                              <CommandList>
                                <CommandEmpty>No skills found.</CommandEmpty>
                                <CommandGroup>
                                  {skills.map((skill) => (
                                    <CommandItem
                                      key={skill.id}
                                      onSelect={() => {
                                        const currentSkills = field.value || [];
                                        const updatedSkills = currentSkills.includes(skill.id)
                                          ? currentSkills.filter((id) => id !== skill.id)
                                          : [...currentSkills, skill.id];
                                        field.onChange(updatedSkills);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value?.includes(skill.id)
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
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
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingTemplate ? 'Update' : 'Create'} Template
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Required Skills</TableHead>
              <TableHead>Estimated Hours</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.title}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {templateSkills[template.id]?.map((ts) => (
                      <Badge key={ts.skill_id} variant="secondary">
                        {ts.skills.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{template.estimated_hours}h</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {template.difficulty_level}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            mission template "{template.title}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(template.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
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