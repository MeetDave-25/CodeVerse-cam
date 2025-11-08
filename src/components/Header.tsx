import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Code2, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  return (
    <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/95">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <Code2 className="h-8 w-8 text-primary animate-neon-pulse" />
            <span className="text-2xl font-bold bg-gradient-neon bg-clip-text text-transparent group-hover:animate-glitch">
              CodeVerse
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link to="/dashboard">
              <Button variant="ghost" className="hover:bg-primary/10 hover:text-primary transition-colors">
                Dashboard
              </Button>
            </Link>
            <Link to="/problems">
              <Button variant="ghost" className="hover:bg-secondary/10 hover:text-secondary transition-colors">
                Problems
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button variant="ghost" className="hover:bg-accent/10 hover:text-accent transition-colors">
                Leaderboard
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="ghost" className="hover:bg-success/10 hover:text-success transition-colors">
                Profile
              </Button>
            </Link>
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="border-primary/30 hover:bg-primary/10 hover:shadow-glow-pink transition-all">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border/50">
              <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer hover:bg-primary/10">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer hover:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
