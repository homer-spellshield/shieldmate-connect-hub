import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { FloatingChatLauncher } from "@/components/FloatingChatLauncher";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Moon, Sun, LogOut, User, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  message: string;
  created_at: string;
  link_url: string | null;
  is_read: boolean;
}

export const Layout = ({ children }: { children: ReactNode }) => {
  const { profile, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching notifications:", error);
    } else {
      setNotifications(data || []);
      const unread = data?.filter(n => !n.is_read).length || 0;
      setUnreadCount(unread);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      const channel = supabase
        .channel(`notifications:${user.id}`)
        .on<Notification>(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          () => fetchNotifications()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);


  const handleNotificationClick = async (notification: Notification) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification.id);
    
    if (notification.link_url) {
      navigate(notification.link_url);
    }
  };
  
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
              <div className="flex items-center justify-between px-6 h-full">
                <div className="flex items-center space-x-4">
                  <SidebarTrigger className="p-2 hover:bg-accent rounded-md" />
                  <div className="hidden md:block">
                    <h2 className="text-sm font-medium text-muted-foreground">
                      Welcome back! Ready to make an impact?
                    </h2>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleDarkMode}
                    className="dark-mode-toggle h-8 w-8"
                  >
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative h-8 w-8">
                        <Bell className="h-4 w-4" />
                        {unreadCount > 0 && (
                          <span className="absolute top-0 right-0 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                      <div className="p-4 border-b">
                        <h4 className="font-medium text-sm">Notifications</h4>
                      </div>
                      <div className="p-2 max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-center text-sm text-muted-foreground py-4">No new notifications</p>
                        ) : (
                          notifications.map(notif => (
                            <div key={notif.id} onClick={() => handleNotificationClick(notif)} className={`p-2 rounded-md hover:bg-accent cursor-pointer ${!notif.is_read ? 'font-semibold' : 'font-normal'}`}>
                              <p className="text-sm">{notif.message}</p>
                              <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center space-x-2 h-8">
                        <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground text-xs font-medium">
                            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                          </span>
                        </div>
                        <span className="hidden md:block text-sm font-medium">
                          {profile?.first_name} {profile?.last_name}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
        </div>
        
        <FloatingChatLauncher />
      </SidebarProvider>
    </div>
  );
};
