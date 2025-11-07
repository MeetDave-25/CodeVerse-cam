import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Code2, Trophy, TrendingUp, Zap, Award, Target } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/95">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Code2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              CodeVerse
            </span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild className="bg-gradient-hero shadow-glow">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-block">
            <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
              🎓 Built for College Students
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Level Up Your
            <span className="bg-gradient-hero bg-clip-text text-transparent"> Coding Skills</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Practice problems organized by year and semester. Earn badges, climb leaderboards, 
            and get AI-powered insights to strengthen your weak areas.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" asChild className="bg-gradient-hero shadow-glow text-lg px-8">
              <Link to="/auth">Start Practicing</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link to="/problems">Browse Problems</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Why CodeVerse?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Target,
              title: "Structured Learning",
              description: "Problems organized by year, semester, and subject to match your curriculum"
            },
            {
              icon: Trophy,
              title: "Gamification",
              description: "Earn badges, maintain streaks, and compete on leaderboards"
            },
            {
              icon: TrendingUp,
              title: "Track Progress",
              description: "Detailed analytics show your strengths and areas for improvement"
            },
            {
              icon: Zap,
              title: "Daily Challenges",
              description: "New problems every day to keep your skills sharp"
            },
            {
              icon: Award,
              title: "Achievement System",
              description: "Unlock badges and rewards as you solve more problems"
            },
            {
              icon: Code2,
              title: "Real-time Feedback",
              description: "Instant code execution and feedback on your submissions"
            }
          ].map((feature, idx) => (
            <div 
              key={idx}
              className="p-6 rounded-xl bg-gradient-card border border-border/50 hover:border-primary/30 transition-all hover:shadow-md group"
            >
              <feature.icon className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-hero rounded-2xl p-12 text-center text-white shadow-glow">
          <h2 className="text-4xl font-bold mb-4">Ready to Begin?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of students mastering their coding skills
          </p>
          <Button size="lg" variant="secondary" asChild className="text-lg px-8">
            <Link to="/auth">Create Free Account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 CodeVerse Campus. Built for students, by students.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
