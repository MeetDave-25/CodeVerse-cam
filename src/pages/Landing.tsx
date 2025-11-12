import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, Trophy, Zap, Target, Users, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Landing = () => {
  const navigate = useNavigate();

  const handleStartCoding = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Check user role and redirect accordingly
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (roleData?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } else {
      navigate("/auth");
    }
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 cyber-grid opacity-20 pointer-events-none" />
      
      {/* Header */}
      <header className="relative border-b border-border/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Code2 className="h-8 w-8 text-primary animate-neon-pulse" />
              <span className="text-2xl font-bold bg-gradient-neon bg-clip-text text-transparent">
                CodeVerse
              </span>
            </div>
            <div className="flex gap-3">
              <Link to="/auth">
                <Button variant="outline" className="border-primary/30 hover:bg-primary/10">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-gradient-neon hover:shadow-glow-pink">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto animate-slide-up">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 neon-text">
              Level Up Your
              <span className="block bg-gradient-neon bg-clip-text text-transparent animate-float">
                Coding Skills
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Master algorithms, compete with peers, and build your programming expertise
              in a gamified cyberpunk universe
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-neon hover:shadow-glow-pink text-lg px-8"
                onClick={handleStartCoding}
              >
                <Zap className="mr-2 h-5 w-5" />
                Start Coding
              </Button>
              <Link to="/leaderboard">
                <Button size="lg" variant="outline" className="border-primary/30 hover:bg-primary/10 text-lg px-8">
                  <Trophy className="mr-2 h-5 w-5" />
                  View Leaderboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 neon-text">
            Why CodeVerse?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                title: "Structured Learning",
                description: "Problems organized by year, semester, and subject for systematic skill development",
                color: "text-primary"
              },
              {
                icon: Trophy,
                title: "Gamification",
                description: "Earn badges, maintain streaks, and climb the leaderboard as you solve problems",
                color: "text-secondary"
              },
              {
                icon: Brain,
                title: "AI Recommendations",
                description: "Get personalized suggestions and insights on areas to improve",
                color: "text-accent"
              },
              {
                icon: Code2,
                title: "Real Problems",
                description: "Industry-relevant coding challenges to prepare you for the market",
                color: "text-success"
              },
              {
                icon: Users,
                title: "Community",
                description: "Compete with classmates and learn from the best performers",
                color: "text-neon-cyan"
              },
              {
                icon: Zap,
                title: "Daily Challenges",
                description: "Fresh problems every day to keep your skills sharp",
                color: "text-neon-purple"
              }
            ].map((feature, i) => (
              <Card 
                key={i} 
                className="bg-gradient-card border-border/50 hover:border-primary/50 transition-all hover:shadow-glow-pink animate-slide-up"
                style={{animationDelay: `${i * 0.1}s`}}
              >
                <CardHeader>
                  <feature.icon className={`h-10 w-10 ${feature.color} mb-2 animate-float`} style={{animationDelay: `${i * 0.5}s`}} />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-card border-primary/30 neon-border max-w-3xl mx-auto animate-slide-up">
            <CardContent className="p-12 text-center">
              <h2 className="text-4xl font-bold mb-4 neon-text">
                Ready to Begin?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join hundreds of students mastering their coding skills
              </p>
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-neon hover:shadow-glow-cyan text-lg px-12">
                  Create Account
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 CodeVerse. Made by Meet G. Dave with Help/Guidance of Parth D. Joshi</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
