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
} from '@/components/ui/sidebar';
import { NavLink } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { navItems, userItems } from '../../config/navItems';
import { useLogout } from '@/hooks/useLogout';
import React from 'react';

interface NavGroupProps {
  title: string;
  items: typeof navItems | typeof userItems;
  isAuthenticated: boolean;
  onLogout?: () => void;
}

const NavGroup: React.FC<NavGroupProps> = React.memo(
  ({ title, items, isAuthenticated, onLogout }) => (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items
            .filter((item) =>
              isAuthenticated ? item.authRequired : !item.authRequired,
            )
            .map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  {item.url ? (
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-2 ${
                          isActive
                            ? 'text-sidebar-primary-foreground bg-sidebar-primary'
                            : 'text-sidebar-foreground'
                        } hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`
                      }
                      aria-label={item.ariaLabel}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  ) : (
                    <button
                      onClick={onLogout}
                      className="flex items-center gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full text-left"
                      aria-label={item.ariaLabel}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </button>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ),
);

const UnauthenticatedNav: React.FC = React.memo(() => {
  const unauthenticatedLinks = navItems.filter((item) => !item.authRequired);

  return (
    <nav className="flex flex-wrap justify-center gap-2 p-4 bg-gray-100 w-full">
      {unauthenticatedLinks.map((item) => (
        <NavLink
          key={item.title}
          to={item.url}
          className={({ isActive }) =>
            `px-3 py-1 rounded-md flex items-center gap-2 ${
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-foreground hover:bg-muted'
            }`
          }
          aria-label={item.ariaLabel}
        >
          <item.icon className="h-5 w-5" />
          <span>{item.title}</span>
        </NavLink>
      ))}
    </nav>
  );
});

export function AppSidebar() {
  const { isAuthenticated } = useAuth();
  const handleLogout = useLogout();

  if (!isAuthenticated) {
    return <UnauthenticatedNav />;
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
        <NavGroup
          title="Navigation"
          items={navItems}
          isAuthenticated={isAuthenticated}
        />
        <NavGroup
          title="User"
          items={userItems}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
        />
      </SidebarContent>
    </Sidebar>
  );
}
