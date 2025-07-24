import { 
  Shield, 
  Settings, 
  HelpCircle,
  BarChart3,
  LayoutDashboard,
  Briefcase,
  FileText,
  Users,
  Award,
  User,
  Building
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

// Define navigation items for each role
const volunteerNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Discover Missions", url: "/missions", icon: Briefcase },
  { title: "My Applications", url: "/applications", icon: FileText },
  { title: "My Profile", url: "/profile", icon: User },
];

const organisationNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "My Missions", url: "/org-missions", icon: Briefcase },
  { title: "Team Management", url: "/team", icon: Users },
  { title: "Organisation Profile", url: "/org-profile", icon: Building },
];

const adminNavItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Verification", url: "/admin", value: "verification", icon: Shield },
  { title: "Volunteers", url: "/admin", value: "volunteers", icon: Users },
  { title: "Skills", url: "/admin", value: "skills", icon: Award },
  { title: "Templates", url: "/admin", value: "mission_templates", icon: Briefcase },
];

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
  const isOrganisationUser = userRoles.includes('organization_owner') || userRoles.includes('team_member');
  const isSuperAdmin = userRoles.includes('super_admin');
  
  const isActive = (path: string) => location.pathname === path;
  
  const getNavClass = (isActive: boolean) => 
    isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground";

  let navItems = [];
  let portalTitle = "Portal";
  if (isSuperAdmin) {
    navItems = adminNavItems;
    portalTitle = "Admin Portal";
  } else if (isOrganisationUser) {
    navItems = organisationNavItems;
    portalTitle = "Organisation Portal";
  } else if (isVolunteer) {
    navItems = volunteerNavItems;
    portalTitle = "Volunteer Portal";
  }

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
                {portalTitle}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 flex flex-col justify-between">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
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
