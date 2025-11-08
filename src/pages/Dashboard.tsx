import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2, Trophy, Flame, Target, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [dailyProblem, setDailyProblem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchDashboardData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      // Fetch earned badges
      const { data: badgesData } = await supabase
        .from("user_badges")
        .select(`
          *,
          badges (*)
        `)
        .eq("user_id", user.id)
        .order("earned_at", { ascending: false })
        .limit(3);

      setBadges(badgesData || []);

      // Fetch today's daily problem
      const today = new Date().toISOString().split('T')[0];
      const { data: problemData } = await supabase
        .from("problems")
        .select("*")
        .eq("is_daily", true)
        .eq("daily_date", today)
        .single();

      setDailyProblem(problemData);

    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Code2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl font-bold mb-2 neon-text">
            Welcome back, {profile?.full_name || "Coder"}! 👋
          </h1>
          <p className="text-muted-foreground">Here's your coding progress</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-primary/30 bg-gradient-card neon-border hover:shadow-glow-pink transition-all animate-slide-up" style={{animationDelay: '0.1s'}}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Problems Solved
              </CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{profile?.problems_solved || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-accent/30 bg-gradient-card neon-border hover:shadow-glow-cyan transition-all animate-slide-up" style={{animationDelay: '0.2s'}}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Score
              </CardTitle>
              <Trophy className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{profile?.total_score || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-destructive/30 bg-gradient-card neon-border hover:shadow-glow-purple transition-all animate-slide-up" style={{animationDelay: '0.3s'}}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current Streak
              </CardTitle>
              <Flame className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{profile?.current_streak || 0} 🔥</div>
            </CardContent>
          </Card>

          <Card className="border-success/30 bg-gradient-card neon-border hover:shadow-glow-cyan transition-all animate-slide-up" style={{animationDelay: '0.4s'}}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Badges Earned
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{badges.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Daily Problem */}
          <Card className="border-primary/30 shadow-glow-pink neon-border bg-gradient-card animate-slide-up" style={{animationDelay: '0.5s'}}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 neon-text">
                <Code2 className="h-5 w-5 text-primary animate-neon-pulse" />
                Today's Challenge
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailyProblem ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{dailyProblem.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {dailyProblem.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${
                      dailyProblem.difficulty === 'easy' ? 'bg-success/20 text-success border-success/30' :
                      dailyProblem.difficulty === 'medium' ? 'bg-accent/20 text-accent border-accent/30' :
                      'bg-destructive/20 text-destructive border-destructive/30'
                    }`}>
                      {dailyProblem.difficulty}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {dailyProblem.points} points
                    </span>
                  </div>
                  <Button 
                    className="w-full bg-gradient-neon hover:shadow-glow-pink"
                    onClick={() => navigate(`/problems/${dailyProblem.id}`)}
                  >
                    Solve Now
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No daily problem available yet</p>
                  <Button variant="outline" onClick={() => navigate("/problems")} className="border-primary/30 hover:bg-primary/10">
                    Browse All Problems
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Badges */}
          <Card className="border-accent/30 neon-border bg-gradient-card animate-slide-up" style={{animationDelay: '0.6s'}}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 neon-text">
                <Trophy className="h-5 w-5 text-accent animate-float" />
                Recent Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              {badges.length > 0 ? (
                <div className="space-y-3">
                  {badges.map((userBadge) => (
                    <div key={userBadge.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-accent/30 transition-colors">
                      <span className="text-3xl">{userBadge.badges.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium">{userBadge.badges.name}</p>
                        <p className="text-xs text-muted-foreground">{userBadge.badges.description}</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full border-accent/30 hover:bg-accent/10" onClick={() => navigate("/profile")}>
                    View All Badges
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No badges earned yet</p>
                  <Button variant="outline" onClick={() => navigate("/problems")} className="border-primary/30 hover:bg-primary/10">
                    Start Solving
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-3 gap-4 animate-slide-up" style={{animationDelay: '0.7s'}}>
          <Button 
            variant="outline" 
            className="h-24 text-lg border-primary/30 hover:bg-primary/10 hover:shadow-glow-pink transition-all"
            onClick={() => navigate("/problems")}
          >
            <Target className="mr-2 h-5 w-5" />
            Browse Problems
          </Button>
          <Button 
            variant="outline" 
            className="h-24 text-lg border-secondary/30 hover:bg-secondary/10 hover:shadow-glow-cyan transition-all"
            onClick={() => navigate("/leaderboard")}
          >
            <Trophy className="mr-2 h-5 w-5" />
            Leaderboard
          </Button>
          <Button 
            variant="outline" 
            className="h-24 text-lg border-accent/30 hover:bg-accent/10 hover:shadow-glow-purple transition-all"
            onClick={() => navigate("/profile")}
          >
            <TrendingUp className="mr-2 h-5 w-5" />
            My Progress
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
