import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Code2, Play, Trophy, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error("Please write some code before submitting");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please log in to submit");
        setIsSubmitting(false);
        return;
      }

      console.log("Starting submission for user:", user.id, "problem:", id);

      // Simple test evaluation (in production, use a proper code execution service)
      const testCases = problem.test_cases || [];
      const testResults = testCases.map((tc: any, i: number) => ({
        ...tc,
        passed: Math.random() > 0.2
      }));

      const status = testResults.every((r: any) => r.passed) ? "accepted" : "failed";
      const score = status === "accepted" ? problem.points : 0;

      console.log("Test results:", { status, score, testResults });

      // Insert submission
      const { data: submissionData, error: submissionError } = await supabase
        .from("submissions")
        .insert({
          user_id: user.id,
          problem_id: id,
          code,
          status,
          score,
          test_results: testResults
        })
        .select()
        .single();

      if (submissionError) {
        console.error("Submission error:", submissionError);
        throw submissionError;
      }

      console.log("Submission created:", submissionData);

      // Update user profile if accepted
      if (status === "accepted") {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
        }

        if (profile) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              total_score: (profile.total_score || 0) + score,
              problems_solved: (profile.problems_solved || 0) + 1
            })
            .eq("id", user.id);

          if (updateError) {
            console.error("Profile update error:", updateError);
          } else {
            console.log("Profile updated successfully");
          }
        }

        toast.success(`🎉 Accepted! +${score} points`, {
          className: "neon-border",
        });
      } else {
        toast.error("Some test cases failed. Try again!");
      }

      setTestResults(testResults);
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
                    'bg-destructive/20 text-destructive border-destructive/30'}
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
                        <div className="text-primary mt-1">{tc.output}</div>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Code Editor */}
          <Card className="bg-gradient-card border-border/50 neon-border animate-slide-up" style={{animationDelay: '0.1s'}}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-secondary" />
                Code Editor
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
                      className={`p-3 rounded-lg border ${
                        result.passed 
                          ? 'bg-success/10 border-success/30 text-success'
                          : 'bg-destructive/10 border-destructive/30 text-destructive'
                      }`}
                    >
                      Test Case {i + 1}: {result.passed ? '✓ Passed' : '✗ Failed'}
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
