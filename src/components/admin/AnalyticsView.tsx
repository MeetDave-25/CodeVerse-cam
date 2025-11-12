import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Target, Award, Activity, Users, Clock, BarChart3, Eye, Flame } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export function AnalyticsView() {
  const { data: submissions } = useQuery({
    queryKey: ["admin-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select(`
          *,
          profiles:user_id (id, full_name, email),
          problems:problem_id (title, difficulty)
        `)
        .order("created_at", { ascending: false });
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

  const { data: detailedSubmissions } = useQuery({
    queryKey: ["admin-detailed-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select(`
          *,
          profiles:user_id (id, full_name, email, total_score, problems_solved, current_streak),
          problems:problem_id (title, difficulty, points)
        `)
        .order("created_at", { ascending: false });
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

  // Prepare chart data
  const submissionsByDay = submissions?.reduce((acc: any, sub) => {
    const date = new Date(sub.created_at).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(submissionsByDay || {})
    .slice(-7)
    .map(([date, count]) => ({ date, submissions: count }));

  const difficultyData = problems?.reduce((acc: any, problem) => {
    acc[problem.difficulty] = (acc[problem.difficulty] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(difficultyData || {}).map(([difficulty, count]) => ({
    name: difficulty,
    value: count,
  }));

  // Top performing students
  const topStudents = users
    ?.sort((a, b) => (b.total_score || 0) - (a.total_score || 0))
    .slice(0, 10) || [];

  // Student performance analysis
  const getStudentAnalysis = (userId: string) => {
    const userSubmissions = detailedSubmissions?.filter(s => s.user_id === userId) || [];
    const acceptedSubmissions = userSubmissions.filter(s => s.status === 'accepted');
    const totalAttempts = userSubmissions.length;
    const successRate = totalAttempts > 0 ? Math.round((acceptedSubmissions.length / totalAttempts) * 100) : 0;
    
    // Calculate average time (mock data for now)
    const avgTime = Math.floor(Math.random() * 30) + 5; // 5-35 minutes
    
    // Analyze strengths and weaknesses
    const difficultyStats = acceptedSubmissions.reduce((acc: any, sub) => {
      const difficulty = sub.problems?.difficulty || 'unknown';
      acc[difficulty] = (acc[difficulty] || 0) + 1;
      return acc;
    }, {});
    
    const strongAreas = Object.entries(difficultyStats)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 2)
      .map(([difficulty]) => difficulty);
    
    const weakAreas = Object.entries(difficultyStats)
      .sort(([,a], [,b]) => (a as number) - (b as number))
      .slice(0, 2)
      .map(([difficulty]) => difficulty);

    return {
      totalAttempts,
      successRate,
      avgTime,
      strongAreas,
      weakAreas,
      recentSubmissions: userSubmissions.slice(0, 5)
    };
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submissions Over Time */}
        <Card className="neon-border bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Submissions Over Time
            </CardTitle>
            <CardDescription>Daily submission activity (Last 7 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="submissions" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Problem Difficulty Distribution */}
        <Card className="neon-border bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-accent" />
              Problem Difficulty Distribution
            </CardTitle>
            <CardDescription>Breakdown of problems by difficulty level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Students Table */}
      <Card className="neon-border bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-success" />
            Top Performing Students
          </CardTitle>
          <CardDescription>Students ranked by total score and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border border-border/50 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Rank</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Total Score</TableHead>
                  <TableHead>Problems Solved</TableHead>
                  <TableHead>Current Streak</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topStudents.map((student, index) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      <Badge variant={index < 3 ? "default" : "outline"}>
                        #{index + 1}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{student.full_name || "Anonymous"}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-lg font-bold text-primary">{student.total_score || 0}</span>
                    </TableCell>
                    <TableCell>{student.problems_solved || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Flame className="h-4 w-4 text-destructive" />
                        {student.current_streak || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View Analysis
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Student Analysis: {student.full_name || student.email}</DialogTitle>
                          </DialogHeader>
                          <StudentAnalysisModal 
                            student={student} 
                            analysis={getStudentAnalysis(student.id)} 
                          />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Student Analysis Modal Component
function StudentAnalysisModal({ student, analysis }: { student: any, analysis: any }) {
  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold text-success">{analysis.successRate}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Attempts</p>
              <p className="text-2xl font-bold text-primary">{analysis.totalAttempts}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Avg. Time</p>
              <p className="text-2xl font-bold text-accent">{analysis.avgTime}m</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <p className="text-2xl font-bold text-destructive">{student.current_streak || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strengths and Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-success/10 border-success/30">
          <CardHeader>
            <CardTitle className="text-success flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Strong Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.strongAreas.length > 0 ? (
              <div className="space-y-2">
                {analysis.strongAreas.map((area: string) => (
                  <Badge key={area} className="bg-success/20 text-success border-success/30">
                    {area} problems
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No strong areas identified yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-destructive/10 border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Target className="h-4 w-4" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.weakAreas.length > 0 ? (
              <div className="space-y-2">
                {analysis.weakAreas.map((area: string) => (
                  <Badge key={area} className="bg-destructive/20 text-destructive border-destructive/30">
                    {area} problems
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No weak areas identified</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.recentSubmissions.map((submission: any) => (
              <div key={submission.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <div>
                  <p className="font-medium">{submission.problems?.title || "Unknown Problem"}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(submission.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      submission.status === "accepted"
                        ? "bg-success/20 text-success border-success/30"
                        : "bg-destructive/20 text-destructive border-destructive/30"
                    }
                  >
                    {submission.status}
                  </Badge>
                  <span className="text-sm font-medium">{submission.score} pts</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
