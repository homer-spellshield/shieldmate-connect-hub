
import { useState } from "react";
import { 
  Shield, 
  Search, 
  User, 
  Settings, 
  HelpCircle,
  Building,
  Target,
  Users,
  Award,
  FileText
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
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

const adminMenuItems = [
  { title: "System Overview", url: "/admin", icon: Target },
  { title: "Manage Volunteers", url: "/admin", icon: Users },
  { title: "Manage Skills", url: "/admin", icon: Award },
  { title: "Mission Templates", url: "/admin", icon: FileText },
];

const volunteerMenuItems = [
  { title: "Dashboard", url: "/", icon: Target },
  { title: "Discover Missions", url: "/missions", icon: Search },
  { title: "My Applications", url: "/applications", icon: FileText },
  { title: "Profile", url: "/profile", icon: User },
];

const organisationMenuItems = [
  { title: "Dashboard", url: "/org-dashboard", icon: Building },
  { title: "My Missions", url: "/org-missions", icon: Target },
  { title: "Team Management", url: "/team", icon: Users },
  { title: "Organization Profile", url: "/org-profile", icon: Building },
];

const commonMenuItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Help & Support", url: "/help", icon: HelpCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { userRoles, profile } = useAuth();
  const collapsed = state === "collapsed";

  const isVolunteer = userRoles.includes('volunteer');
  const isOrganizationUser = userRoles.includes('organization_owner') || userRoles.includes('team_member');
  const isSuperAdmin = userRoles.includes('super_admin');

  // Determine which menu items to show based on user role
  let menuItems;
  if (isSuperAdmin) {
    menuItems = adminMenuItems;
  } else if (isVolunteer) {
    menuItems = volunteerMenuItems;
  } else {
    menuItems = organisationMenuItems;
  }
  
  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname === path;
  };
  
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
                {isSuperAdmin ? "Admin Portal" : isVolunteer ? "Volunteer Portal" : "Organization Portal"}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Main Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
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

        {/* Gamification Section for Volunteers */}
        {isVolunteer && !collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>Your Progress</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-3 py-2 space-y-3">
                <div className="text-center p-2 bg-accent rounded-lg">
                  <Award className="w-4 h-4 inline mr-1" />
                  <span className="text-sm font-medium">ShieldMate Specialist</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Level {(profile as any)?.level || 1}</span>
                    <span>{(profile as any)?.xp_points || 0} / 2,000 XP</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min((((profile as any)?.xp_points || 0) / 2000) * 100, 100)}%` }} 
                    />
                  </div>
                </div>
                <div className="flex justify-center">
                  <Badge variant="secondary" className="text-xs">
                    🏆 0 Missions Completed
                  </Badge>
                </div>
              </div>
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
