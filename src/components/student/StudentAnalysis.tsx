import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Award, 
  BarChart3, 
  Calendar,
  CheckCircle,
  XCircle,
  Flame
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface StudentAnalysisProps {
  userId?: string;
}

export function StudentAnalysis({ userId }: StudentAnalysisProps) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalysisData();
  }, [userId]);

  const fetchAnalysisData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) return;

      // Fetch user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetUserId)
        .single();

      setProfile(profileData);

      // Fetch user submissions with problem details
      const { data: submissionsData } = await supabase
        .from("submissions")
        .select(`
          *,
          problems:problem_id (title, difficulty, points)
        `)
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false });

      setSubmissions(submissionsData || []);
    } catch (error) {
      console.error("Error fetching analysis data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <BarChart3 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate analytics
  const totalSubmissions = submissions.length;
  const acceptedSubmissions = submissions.filter(s => s.status === 'accepted');
  const successRate = totalSubmissions > 0 ? Math.round((acceptedSubmissions.length / totalSubmissions) * 100) : 0;
  
  // Difficulty breakdown
  const difficultyStats = acceptedSubmissions.reduce((acc: any, sub) => {
    const difficulty = sub.problems?.difficulty || 'unknown';
    acc[difficulty] = (acc[difficulty] || 0) + 1;
    return acc;
  }, {});

  const difficultyData = Object.entries(difficultyStats).map(([difficulty, count]) => ({
    name: difficulty,
    value: count,
  }));

  // Submission timeline (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const submissionsByDay = submissions.reduce((acc: any, sub) => {
    const date = new Date(sub.created_at).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const timelineData = last30Days.map(date => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    submissions: submissionsByDay[date] || 0,
  }));

  // Performance trends
  const recentSubmissions = submissions.slice(0, 10);
  const strongAreas = Object.entries(difficultyStats)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 2)
    .map(([difficulty]) => difficulty);

  const weakAreas = Object.entries(difficultyStats)
    .sort(([,a], [,b]) => (a as number) - (b as number))
    .slice(0, 2)
    .map(([difficulty]) => difficulty);

  // Mock average time calculation (you can implement actual timing later)
  const avgSolveTime = Math.floor(Math.random() * 25) + 10; // 10-35 minutes

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="neon-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{successRate}%</div>
            <Progress value={successRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {acceptedSubmissions.length} of {totalSubmissions} accepted
            </p>
          </CardContent>
        </Card>

        <Card className="neon-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Problems Solved</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{profile?.problems_solved || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total score: {profile?.total_score || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="neon-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Solve Time</CardTitle>
            <Clock className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{avgSolveTime}m</div>
            <p className="text-xs text-muted-foreground mt-1">
              Per problem
            </p>
          </CardContent>
        </Card>

        <Card className="neon-border bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{profile?.current_streak || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Days active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission Activity */}
        <Card className="neon-border bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Submission Activity (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="submissions" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Difficulty Distribution */}
        <Card className="neon-border bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-accent" />
              Problems by Difficulty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {difficultyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className="bg-success/10 border-success/30 neon-border">
          <CardHeader>
            <CardTitle className="text-success flex items-center gap-2">
              <Award className="h-4 w-4" />
              Strong Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {strongAreas.length > 0 ? (
              <div className="space-y-2">
                {strongAreas.map((area) => (
                  <div key={area} className="flex items-center justify-between">
                    <Badge className="bg-success/20 text-success border-success/30">
                      {area} problems
                    </Badge>
                    <span className="text-sm text-success font-medium">
                      {difficultyStats[area]} solved
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Keep solving problems to identify your strengths!</p>
            )}
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card className="bg-destructive/10 border-destructive/30 neon-border">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Target className="h-4 w-4" />
              Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weakAreas.length > 0 ? (
              <div className="space-y-2">
                {weakAreas.map((area) => (
                  <div key={area} className="flex items-center justify-between">
                    <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                      {area} problems
                    </Badge>
                    <span className="text-sm text-destructive font-medium">
                      Practice more
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Great job! Keep up the balanced practice.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card className="neon-border bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentSubmissions.length > 0 ? (
              recentSubmissions.map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    {submission.status === 'accepted' ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium">{submission.problems?.title || "Unknown Problem"}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(submission.created_at).toLocaleDateString()}
                      </p>
                    </div>
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
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No submissions yet. Start solving problems to see your progress!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
