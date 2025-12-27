import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Leaderboard = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<string>("all");

  useEffect(() => {
    checkAuth();
    fetchLeaderboard();
  }, [yearFilter]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchLeaderboard = async () => {
    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("total_score", { ascending: false })
      .limit(100); // Fetch more initially to filter

    console.log('📊 Fetched profiles:', profiles);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      setIsLoading(false);
      return;
    }

    // Fetch user roles to filter out admins
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("*");

    console.log('👥 Fetched roles:', roles);

    if (rolesError) {
      console.error('❌ Error fetching roles:', rolesError);
      // If roles fetch fails, just show all profiles
      setLeaderboard(profiles?.slice(0, 50) || []);
      setIsLoading(false);
      return;
    }

    // Identify admin user IDs
    const adminUserIds = new Set(
      roles?.filter(r => r.role === 'admin').map(r => r.user_id)
    );

    console.log('🚫 Admin User IDs:', [...adminUserIds]);

    // Filter out admin users - only show students who are NOT admins
    let studentProfiles = profiles?.filter(profile => {
      // If user is an admin, EXCLUDE them immediately
      if (adminUserIds.has(profile.id)) {
        return false;
      }

      // Must have a student role
      const hasStudentRole = roles?.some(r => r.user_id === profile.id && r.role === 'student');
      return hasStudentRole;
    });

    // Apply year filter
    if (yearFilter !== "all") {
      const selectedYear = parseInt(yearFilter);
      studentProfiles = studentProfiles?.filter(profile => profile.college_year === selectedYear);
      console.log(`🎓 Filtered to Year ${selectedYear}:`, studentProfiles);
    }

    // Take top 50 students
    const topStudents = studentProfiles?.slice(0, 50);

    console.log('🎓 Student profiles for leaderboard:', topStudents);

    setLeaderboard(topStudents || []);
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

        <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground">Filter by Year:</label>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[180px] bg-gradient-card border-border/50">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="1">1st Year</SelectItem>
                <SelectItem value="2">2nd Year</SelectItem>
                <SelectItem value="3">3rd Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="bg-gradient-card border-border/50 neon-border animate-slide-up" style={{ animationDelay: '0.1s' }}>
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
                      key={`${user.id}-${user.email}-${index}`}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer ${isTopThree
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
                          {user.college_year && (
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium border border-primary/30">
                              Year {user.college_year}
                            </span>
                          )}
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
