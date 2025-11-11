import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Target, Award, Activity } from "lucide-react";

export function AnalyticsView() {
  const { data: submissions } = useQuery({
    queryKey: ["admin-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: problems } = useQuery({
    queryKey: ["admin-problems-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("problems").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ["admin-users-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const stats = {
    totalSubmissions: submissions?.length || 0,
    successfulSubmissions: submissions?.filter(s => s.status === 'accepted').length || 0,
    averageScore: users?.length 
      ? Math.round(users.reduce((sum, u) => sum + (u.total_score || 0), 0) / users.length)
      : 0,
    activeProblemSolvers: users?.filter(u => (u.problems_solved || 0) > 0).length || 0,
  };

  const successRate = stats.totalSubmissions > 0
    ? Math.round((stats.successfulSubmissions / stats.totalSubmissions) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="neon-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.successfulSubmissions} accepted
            </p>
          </CardContent>
        </Card>

        <Card className="neon-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{successRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Of all submissions
            </p>
          </CardContent>
        </Card>

        <Card className="neon-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Award className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.averageScore}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Per user
            </p>
          </CardContent>
        </Card>

        <Card className="neon-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Solvers</CardTitle>
            <Target className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.activeProblemSolvers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Users with solutions
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="neon-border bg-gradient-card">
        <CardHeader>
          <CardTitle>Platform Overview</CardTitle>
          <CardDescription>Key metrics and performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div>
                <p className="text-sm font-medium">Total Problems</p>
                <p className="text-2xl font-bold text-primary">{problems?.length || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {problems?.filter(p => p.difficulty === 'easy').length || 0} Easy
                </p>
                <p className="text-sm text-muted-foreground">
                  {problems?.filter(p => p.difficulty === 'medium').length || 0} Medium
                </p>
                <p className="text-sm text-muted-foreground">
                  {problems?.filter(p => p.difficulty === 'hard').length || 0} Hard
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div>
                <p className="text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold text-accent">{users?.length || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Avg streak: {users?.length
                    ? Math.round(users.reduce((sum, u) => sum + (u.current_streak || 0), 0) / users.length)
                    : 0} days
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-sm font-medium mb-2">Recent Activity</p>
              <p className="text-sm text-muted-foreground">
                {stats.totalSubmissions > 0 
                  ? `Latest submission: ${new Date(submissions?.[0]?.created_at || '').toLocaleString()}`
                  : 'No submissions yet'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
