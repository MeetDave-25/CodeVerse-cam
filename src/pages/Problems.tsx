import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Code2 } from "lucide-react";

const Problems = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState(1);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchProblems();
  }, [selectedYear, selectedSemester]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchProblems = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("problems")
      .select("*")
      .eq("year", selectedYear)
      .eq("semester", selectedSemester)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProblems(data);
    }
    setIsLoading(false);
  };

  const groupBySubject = (problems: any[]) => {
    return problems.reduce((acc, problem) => {
      if (!acc[problem.subject]) {
        acc[problem.subject] = [];
      }
      acc[problem.subject].push(problem);
      return acc;
    }, {} as Record<string, any[]>);
  };

  const groupedProblems = groupBySubject(problems);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl font-bold mb-2 neon-text">Problems</h1>
          <p className="text-muted-foreground">
            Choose your year and semester to see problems
          </p>
        </div>

        {/* Year Selection */}
        <Tabs value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
          <TabsList className="mb-6">
            <TabsTrigger value="1">Year 1</TabsTrigger>
            <TabsTrigger value="2">Year 2</TabsTrigger>
            <TabsTrigger value="3">Year 3</TabsTrigger>
          </TabsList>

          {[1, 2, 3].map((year) => (
            <TabsContent key={year} value={String(year)}>
              {/* Semester Selection */}
              <Tabs 
                value={String(selectedSemester)} 
                onValueChange={(v) => setSelectedSemester(Number(v))}
              >
                <TabsList className="mb-6">
                  <TabsTrigger value="1">Semester 1</TabsTrigger>
                  <TabsTrigger value="2">Semester 2</TabsTrigger>
                </TabsList>

                <TabsContent value="1">
                  <ProblemsList 
                    groupedProblems={groupedProblems} 
                    isLoading={isLoading}
                    navigate={navigate}
                  />
                </TabsContent>
                <TabsContent value="2">
                  <ProblemsList 
                    groupedProblems={groupedProblems} 
                    isLoading={isLoading}
                    navigate={navigate}
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

const ProblemsList = ({ 
  groupedProblems, 
  isLoading,
  navigate
}: { 
  groupedProblems: Record<string, any[]>; 
  isLoading: boolean;
  navigate: any;
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Code2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading problems...</p>
      </div>
    );
  }

  if (Object.keys(groupedProblems).length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-muted-foreground">No problems available for this selection</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {Object.entries(groupedProblems).map(([subject, subjectProblems]) => (
        <Card key={subject} className="bg-gradient-card border-border/50 neon-border hover:shadow-glow-cyan transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {subject}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subjectProblems.map((problem) => (
                  <div
                    key={problem.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/30 hover:shadow-glow-pink transition-all cursor-pointer neon-border"
                    onClick={() => navigate(`/problems/${problem.id}`)}
                  >
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{problem.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {problem.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      problem.difficulty === 'easy' ? 'bg-success/20 text-success' :
                      problem.difficulty === 'medium' ? 'bg-accent/20 text-accent' :
                      'bg-destructive/20 text-destructive'
                    }`}>
                      {problem.difficulty}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">
                      {problem.points} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Problems;
