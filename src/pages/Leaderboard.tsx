import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";

const Leaderboard = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchLeaderboard();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("total_score", { ascending: false })
      .limit(50);

    if (!error && data) {
      setLeaderboard(data);
    }
    setIsLoading(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-accent" />;
      case 2:
        return <Medal className="h-6 w-6 text-muted-foreground" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3 neon-text">
            <Trophy className="h-10 w-10 text-accent animate-float" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Top performers across all students
          </p>
        </div>

        <Card className="bg-gradient-card border-border/50 neon-border animate-slide-up" style={{animationDelay: '0.1s'}}>
          <CardHeader>
            <CardTitle>Global Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading leaderboard...</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No data available yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((user, index) => {
                  const rank = index + 1;
                  const isTopThree = rank <= 3;
                  
                  return (
                    <div
                      key={user.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer ${
                    isTopThree 
                      ? 'bg-gradient-card border-primary/30 shadow-glow-pink neon-border' 
                      : 'bg-muted/30 hover:bg-muted/50 border-border/50 hover:border-primary/20'
                  }`}
                    >
                      <div className="w-12 flex items-center justify-center">
                        {getRankIcon(rank)}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className={`font-semibold ${isTopThree ? 'text-lg' : ''}`}>
                          {user.full_name || "Anonymous Coder"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {user.problems_solved} problems solved
                        </p>
                      </div>

                      <div className="text-right">
                        <div className={`font-bold ${isTopThree ? 'text-2xl' : 'text-xl'} text-primary`}>
                          {user.total_score}
                        </div>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>

                      {user.current_streak > 0 && (
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            🔥 {user.current_streak}
                          </div>
                          <p className="text-xs text-muted-foreground">streak</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Leaderboard;
