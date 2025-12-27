import { useState, useEffect, MouseEventHandler } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Code2, Play, Trophy, Zap, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { runTests } from "../utils/codeRunner";

const ProblemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<any>(null);
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    fetchProblem();
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchProblem = async () => {
    const { data, error } = await supabase
      .from("problems")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      setProblem(data);
      setCode(data.starter_code || "");
    }
  };

  const checkAndAwardBadges = async (userId: string, updatedProfile: any) => {
    try {
      // Fetch all available badges
      const { data: allBadges, error: badgesError } = await supabase
        .from("badges")
        .select("*");

      if (badgesError) {
        console.error("Error fetching badges:", badgesError);
        return;
      }

      // Fetch user's already earned badges
      const { data: earnedBadges, error: earnedError } = await supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", userId);

      if (earnedError) {
        console.error("Error fetching earned badges:", earnedError);
        return;
      }

      const earnedBadgeIds = new Set(earnedBadges?.map(b => b.badge_id) || []);

      // Check each badge's criteria
      for (const badge of allBadges || []) {
        // Skip if already earned
        if (earnedBadgeIds.has(badge.id)) {
          continue;
        }

        const criteria = badge.criteria as any;
        let shouldAward = false;

        // Check different criteria types
        if (criteria.problems_solved !== undefined) {
          shouldAward = updatedProfile.problems_solved >= criteria.problems_solved;
        } else if (criteria.streak !== undefined) {
          shouldAward = updatedProfile.current_streak >= criteria.streak;
        }
        // Note: time_under criteria would need submission time_taken, which we don't track yet

        if (shouldAward) {
          // Award the badge
          const { error: insertError } = await supabase
            .from("user_badges")
            .insert({
              user_id: userId,
              badge_id: badge.id,
            });

          // Ignore duplicate errors (UNIQUE constraint)
          if (insertError && !insertError.message.includes("duplicate")) {
            console.error("Error awarding badge:", insertError);
          } else if (!insertError) {
            // Show success notification
            toast.success(`${badge.icon} Badge Earned: ${badge.name}!`, {
              description: badge.description || undefined,
            });
            console.log(`🏆 Awarded badge: ${badge.name}`);
          }
        }
      }
    } catch (error) {
      console.error("Error in checkAndAwardBadges:", error);
    }
  };

  const handleSubmit: MouseEventHandler<HTMLButtonElement> = async () => {
    if (!problem) return;

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please log in to submit");
        return;
      }

      // Check for previous submissions to determine scoring
      const { data: previousSubmissions } = await supabase
        .from("submissions")
        .select("status")
        .eq("user_id", user.id)
        .eq("problem_id", problem.id);

      const hasPassed = previousSubmissions?.some(s => s.status === 'accepted');
      const hasFailed = previousSubmissions?.some(s => s.status === 'failed');

      // Run tests
      const results = await runTests(code, problem.test_cases || [], problem.language || 'javascript');
      setTestResults(results);

      const allPassed = results.every((r: any) => r.passed);

      // Calculate score
      let score = 0;
      if (allPassed && !hasPassed) {
        // Half points if they failed before, otherwise full points
        score = hasFailed ? Math.floor(problem.points / 2) : problem.points;
      }

      // Save submission
      const { error: submissionError } = await supabase
        .from("submissions")
        .insert({
          user_id: user.id,
          problem_id: problem.id,
          code,
          status: allPassed ? 'accepted' : 'wrong_answer',
          score,
          test_results: results,
          language: problem.language || 'javascript'
        });

      if (submissionError) throw submissionError;

      if (allPassed) {
        const pointsMessage = score > 0 ? ` +${score} points` : '';
        toast.success(`Problem Solved!${pointsMessage}`);

        // Update user profile stats if they got points
        if (score > 0) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("total_score, problems_solved, current_streak")
            .eq("id", user.id)
            .single();

          if (profile) {
            const updatedProfile = {
              total_score: (profile.total_score || 0) + score,
              problems_solved: (profile.problems_solved || 0) + 1,
              current_streak: profile.current_streak || 0,
            };

            await supabase.from("profiles").update(updatedProfile).eq("id", user.id);

            // Check and award badges based on updated stats
            await checkAndAwardBadges(user.id, updatedProfile);
          }
        }
      } else {
        toast.error("Problem is wrong");
      }

    } catch (error: any) {
      console.error("Submission failed:", error);
      toast.error(error.message || "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!problem) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Code2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6 hover:bg-primary/10 hover:text-primary"
          onClick={() => navigate("/problems")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Problems
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Problem Description */}
          <Card className="bg-gradient-card border-border/50 neon-border animate-slide-up">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl neon-text flex items-center gap-2">
                  <Zap className="h-6 w-6 text-primary" />
                  {problem.title}
                </CardTitle>
                <Badge className={`
                  ${problem.difficulty === 'easy' ? 'bg-success/20 text-success border-success/30' :
                    problem.difficulty === 'medium' ? 'bg-accent/20 text-accent border-accent/30' :
                      'bg-destructive/20 text-destructive border-destructive/30'
                  }
                  border neon-border
          `}>
                  {problem.difficulty}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  {problem.points} points
                </span>
                <span>Year {problem.year} • Semester {problem.semester}</span>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="description">
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="examples">Examples</TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="mt-4">
                  <p className="text-foreground/90 leading-relaxed">{problem.description}</p>
                  <div className="mt-4 p-4 bg-muted/30 border border-border/50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-secondary">Subject</h4>
                    <p className="text-muted-foreground">{problem.subject}</p>
                  </div>
                </TabsContent>
                <TabsContent value="examples" className="mt-4 space-y-3">
                  {problem.test_cases?.map((tc: any, i: number) => (
                    <div key={i} className="p-4 bg-muted/30 border border-border/50 rounded-lg font-mono text-sm">
                      <div className="mb-2">
                        <span className="text-muted-foreground">Input:</span>
                        <div className="text-secondary mt-1">{tc.input}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Output:</span>
                        <div className="text-primary mt-1">{tc.output !== undefined ? tc.output : tc.expected}</div>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Code Editor */}
          <Card className="bg-gradient-card border-border/50 neon-border animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-secondary" />
                  Code Editor
                </div>
                <Badge variant="outline" className="font-mono bg-secondary/10 text-secondary border-secondary/30">
                  {problem.language || 'javascript'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono text-sm min-h-[400px] bg-input border-border/50 focus:border-primary/50 transition-colors"
                placeholder="Write your solution here..."
              />

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-gradient-neon hover:shadow-glow-pink transition-all"
                size="lg"
              >
                <Play className="mr-2 h-4 w-4" />
                {isSubmitting ? "Running..." : "Submit Solution"}
              </Button>

              {testResults && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-semibold text-foreground">Test Results</h4>
                  {testResults.map((result: any, i: number) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border ${result.passed
                        ? 'bg-success/10 border-success/30 text-success'
                        : 'bg-destructive/10 border-destructive/30 text-destructive'
                        }`}
                    >
                      Test Case {i + 1}: {result.passed ? '✓ Passed' : '✗ Failed'}
                      {!result.passed && (
                        <div className="mt-1 text-xs font-mono">
                          <div>Expected: {String(result.expected)}</div>
                          <div>Actual: {String(result.output)}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProblemDetail;
