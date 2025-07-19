
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { 
  HelpCircle, 
  MessageSquare, 
  Mail, 
  Book, 
  Users, 
  Shield,
  Target,
  Search
} from 'lucide-react';

const contactSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactForm = z.infer<typeof contactSchema>;

const Help = () => {
  const { toast } = useToast();

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data: ContactForm) => {
    // For now, just show a success message
    // In the future, this could send an email or create a support ticket
    toast({
      title: "Message Sent",
      description: "We've received your message and will get back to you soon!",
    });
    form.reset();
  };

  const faqItems = [
    {
      question: "How do I apply for a mission?",
      answer: "Browse available missions in the 'Discover Missions' section, click on a mission that interests you, and submit your application with a message explaining why you'd be a good fit."
    },
    {
      question: "How do organizations post missions?",
      answer: "Organizations can create missions by going to their dashboard and clicking 'Create Mission'. You'll need to select a mission template and provide specific details about your needs."
    },
    {
      question: "What happens after I apply for a mission?",
      answer: "Organization members will review your application and either approve or reject it. You'll receive notifications about status changes and can track your applications in the 'My Applications' section."
    },
    {
      question: "How do I join an organization as a team member?",
      answer: "Organization owners can invite team members through the Team Management section. You'll receive an invitation email to join the organization."
    },
    {
      question: "What are mission templates?",
      answer: "Mission templates are pre-defined mission types created by administrators. They include standard requirements, skills needed, and estimated time commitments to help organizations create consistent missions."
    },
    {
      question: "How do I track my volunteer progress?",
      answer: "Your volunteer progress, including XP points, completed missions, and skill badges, is tracked automatically and displayed in your profile and sidebar."
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
        <p className="text-muted-foreground">
          Find answers to common questions or get in touch with our support team
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Getting Started
            </CardTitle>
            <CardDescription>
              Quick guides for new users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="font-medium">For Volunteers</h4>
                  <p className="text-sm text-muted-foreground">
                    Browse missions, apply for opportunities, and track your impact
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="font-medium">For Organizations</h4>
                  <p className="text-sm text-muted-foreground">
                    Post missions, manage your team, and find skilled volunteers
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="font-medium">Mission Lifecycle</h4>
                  <p className="text-sm text-muted-foreground">
                    Understand how missions work from creation to completion
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Contact Support
            </CardTitle>
            <CardDescription>
              Send us a message and we'll help you out
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="What can we help you with?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your question or issue in detail..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription>
            Find quick answers to common questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b border-border last:border-0 pb-4 last:pb-0">
                <h4 className="font-medium mb-2">{item.question}</h4>
                <p className="text-sm text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Help;
