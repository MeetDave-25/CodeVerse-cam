import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Code2, LogOut, User, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

const Header = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  const NavLinks = () => (
    <>
      <Link to="/dashboard" onClick={() => setIsOpen(false)}>
        <Button variant="ghost" className="w-full md:w-auto justify-start hover:bg-primary/10 hover:text-primary transition-colors">
          Dashboard
        </Button>
      </Link>
      <Link to="/problems" onClick={() => setIsOpen(false)}>
        <Button variant="ghost" className="w-full md:w-auto justify-start hover:bg-secondary/10 hover:text-secondary transition-colors">
          Problems
        </Button>
      </Link>
      <Link to="/leaderboard" onClick={() => setIsOpen(false)}>
        <Button variant="ghost" className="w-full md:w-auto justify-start hover:bg-accent/10 hover:text-accent transition-colors">
          Leaderboard
        </Button>
      </Link>
      <Link to="/profile" onClick={() => setIsOpen(false)}>
        <Button variant="ghost" className="w-full md:w-auto justify-start hover:bg-success/10 hover:text-success transition-colors">
          Profile
        </Button>
      </Link>
    </>
  );

  return (
    <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/95">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                <div className="flex flex-col gap-4 mt-8">
                  <NavLinks />
                </div>
              </SheetContent>
            </Sheet>

            <Link to="/dashboard" className="flex items-center gap-2 group">
              <Code2 className="h-8 w-8 text-primary animate-neon-pulse" />
              <span className="text-2xl font-bold bg-gradient-neon bg-clip-text text-transparent group-hover:animate-glitch">
                CodeVerse
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <NavLinks />
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
