import { 
  Shield, 
  Settings, 
  HelpCircle,
  BarChart3,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const commonMenuItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Help & Support", url: "/help", icon: HelpCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { userRoles } = useAuth();
  const collapsed = state === "collapsed";

  const isVolunteer = userRoles.includes('volunteer');
  const isOrganizationUser = userRoles.includes('organization_owner') || userRoles.includes('team_member');
  const isSuperAdmin = userRoles.includes('super_admin');
  
  const isActive = (path: string) => location.pathname === path;
  
  const getNavClass = (isActive: boolean) => 
    isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-foreground">ShieldMate</h1>
              <p className="text-xs text-muted-foreground">
                {isSuperAdmin ? "Admin Portal" : isVolunteer ? "Volunteer Portal" : "Organisation Portal"}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Admin-specific Sidebar content */}
        {isSuperAdmin && !collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>System Status</SidebarGroupLabel>
            <SidebarGroupContent className="px-2">
                <Card className="border-none shadow-none bg-transparent">
                  <CardHeader className="p-2 pt-0">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="w-4 h-4" />
                      System Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 pt-0 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Database</span>
                      <span className="font-medium text-green-500">Connected</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Authentication</span>
                      <span className="font-medium text-green-500">Active</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Row Level Security</span>
                      <span className="font-medium text-green-500">Enabled</span>
                    </div>
                  </CardContent>
                </Card>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Support Section */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Support
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {commonMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.url}
                      className={`nav-item ${getNavClass(isActive(item.url))}`}
                    >
                      <item.icon className="w-5 h-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
