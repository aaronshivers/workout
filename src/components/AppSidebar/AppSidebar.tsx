import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Dumbbell,
  Calendar,
  FileText,
  Edit,
  User,
  LogOut,
} from "lucide-react";
import { NavLink } from "react-router";
import { useAuth } from "../../hooks/useAuth";

const navItems = [
  {
    title: "Current Workout",
    url: "/log-workout",
    icon: Dumbbell,
    ariaLabel: "Navigate to Current Workout",
  },
  {
    title: "Mesocycles",
    url: "/history",
    icon: Calendar,
    ariaLabel: "Navigate to Mesocycles",
  },
  {
    title: "Templates",
    url: "/templates",
    icon: FileText,
    ariaLabel: "Navigate to Templates",
  },
  {
    title: "Custom Exercises",
    url: "/custom-exercises",
    icon: Edit,
    ariaLabel: "Navigate to Custom Exercises",
  },
  {
    title: "Plan a New Mesocycle",
    url: "/create-workout",
    icon: Calendar,
    ariaLabel: "Navigate to Plan a New Mesocycle",
  },
];

const userItems = [
  {
    title: "Profile",
    url: "/dashboard/profile",
    icon: User,
    ariaLabel: "Navigate to Profile",
  },
];

export function AppSidebar() {
  const { logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Sidebar collapsible="icon" className="bg-sidebar-background">
      <SidebarHeader>
        <SidebarGroup>
          <SidebarGroupLabel className="text-2xl font-bold text-sidebar-foreground">
            Workout
          </SidebarGroupLabel>
        </SidebarGroup>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-2 ${
                          isActive
                            ? "text-sidebar-primary-foreground bg-sidebar-primary"
                            : "text-sidebar-foreground"
                        } hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`
                      }
                      aria-label={item.ariaLabel}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>User</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-2 ${
                          isActive
                            ? "text-sidebar-primary-foreground bg-sidebar-primary"
                            : "text-sidebar-foreground"
                        } hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`
                      }
                      aria-label={item.ariaLabel}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  aria-label="Log out of your account"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
