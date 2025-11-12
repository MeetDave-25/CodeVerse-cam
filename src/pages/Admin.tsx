import { useState } from "react";
import { Code2 } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ProblemsView } from "@/components/admin/ProblemsView";
import { UsersView } from "@/components/admin/UsersView";
import { AnalyticsView } from "@/components/admin/AnalyticsView";
import { SettingsView } from "@/components/admin/SettingsView";
import { SubmissionsView } from "@/components/admin/SubmissionsView";
import { DailyProblemScheduler } from "@/components/admin/DailyProblemScheduler";

const Admin = () => {
  const [activeSection, setActiveSection] = useState("problems");

  const renderContent = () => {
    switch (activeSection) {
      case "problems":
        return <ProblemsView />;
      case "users":
        return <UsersView />;
      case "submissions":
        return <SubmissionsView />;
      case "scheduler":
        return <DailyProblemScheduler />;
      case "analytics":
        return <AnalyticsView />;
      case "settings":
        return <SettingsView />;
      default:
        return <ProblemsView />;
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case "problems":
        return "Problems Management";
      case "users":
        return "Users Management";
      case "submissions":
        return "Submission History";
      case "scheduler":
        return "Daily Problem Scheduler";
      case "analytics":
        return "Analytics Dashboard";
      case "settings":
        return "Platform Settings";
      default:
        return "Admin Panel";
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-40 bg-background/95">
            <div className="flex items-center gap-4 px-6 h-16">
              <SidebarTrigger className="hover:bg-muted" />
              <div className="flex items-center gap-2">
                <Code2 className="h-6 w-6 text-primary animate-neon-pulse" />
                <span className="text-xl font-bold neon-text">CodeVerse Admin</span>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-6 py-8">
              <div className="mb-8 animate-slide-up">
                <h1 className="text-4xl font-bold mb-2 neon-text">{getSectionTitle()}</h1>
                <p className="text-muted-foreground">
                  {activeSection === "problems" && "Create, edit, and manage coding problems"}
                  {activeSection === "users" && "View and manage registered users"}
                  {activeSection === "submissions" && "View all code submissions with advanced filtering"}
                  {activeSection === "scheduler" && "Set and rotate daily coding challenges"}
                  {activeSection === "analytics" && "Monitor platform performance and metrics"}
                  {activeSection === "settings" && "Configure platform preferences"}
                </p>
              </div>

              <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
                {renderContent()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
