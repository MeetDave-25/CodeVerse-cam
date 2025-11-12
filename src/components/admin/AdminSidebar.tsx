import { FileCode, Users, BarChart3, Settings as SettingsIcon, LogOut, Calendar as CalendarIcon } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Problems", icon: FileCode, section: "problems" },
  { title: "Users", icon: Users, section: "users" },
  { title: "Submissions", icon: FileCode, section: "submissions" },
  { title: "Daily Scheduler", icon: CalendarIcon, section: "scheduler" },
  { title: "Analytics", icon: BarChart3, section: "analytics" },
  { title: "Settings", icon: SettingsIcon, section: "settings" },
];

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  const navigate = useNavigate();
  const { state } = useSidebar();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <Sidebar
      className={state === "collapsed" ? "w-14" : "w-60"}
      collapsible="icon"
    >
      <SidebarContent className="border-r border-border/50">
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold neon-text">
            {state === "expanded" && "Admin Panel"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.section}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.section)}
                    isActive={activeSection === item.section}
                    className={`${
                      activeSection === item.section
                        ? "bg-primary/20 text-primary font-medium border-l-2 border-primary"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {state === "expanded" && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 border-t border-border/50">
          <Button
            onClick={handleLogout}
            variant="outline"
            className={`w-full ${state === "collapsed" ? "px-2" : ""}`}
          >
            <LogOut className="h-4 w-4" />
            {state === "expanded" && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
