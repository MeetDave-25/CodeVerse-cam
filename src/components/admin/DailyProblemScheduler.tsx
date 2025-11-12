import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar as CalendarIcon, RefreshCw, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export function DailyProblemScheduler() {
  const [problems, setProblems] = useState<any[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentDaily, setCurrentDaily] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProblems();
    fetchCurrentDaily();
  }, []);

  const fetchProblems = async () => {
    const { data } = await supabase
      .from("problems")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setProblems(data);
  };

  const fetchCurrentDaily = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const { data } = await supabase
      .from("problems")
      .select("*")
      .eq("is_daily", true)
      .eq("daily_date", today)
      .maybeSingle();
    
    if (data) setCurrentDaily(data);
  };

  const setDailyProblem = async () => {
    if (!selectedProblem) {
      toast.error("Please select a problem");
      return;
    }

    setIsLoading(true);
    try {
      // Clear any existing daily problem for this date
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      await supabase
        .from("problems")
        .update({ is_daily: false, daily_date: null })
        .eq("daily_date", dateStr);

      // Set the new daily problem
      const { error } = await supabase
        .from("problems")
        .update({ 
          is_daily: true, 
          daily_date: dateStr 
        })
        .eq("id", selectedProblem);

      if (error) throw error;

      toast.success("Daily problem set successfully!");
      fetchCurrentDaily();
      setSelectedProblem("");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to set daily problem");
    } finally {
      setIsLoading(false);
    }
  };

  const clearDailyProblem = async () => {
    if (!currentDaily) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("problems")
        .update({ is_daily: false, daily_date: null })
        .eq("id", currentDaily.id);

      if (error) throw error;

      toast.success("Daily problem cleared");
      setCurrentDaily(null);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to clear daily problem");
    } finally {
      setIsLoading(false);
    }
  };

  const autoRotateDaily = async () => {
    setIsLoading(true);
    try {
      // Get a random problem that hasn't been daily recently
      const { data: availableProblems } = await supabase
        .from("problems")
        .select("*")
        .or("is_daily.is.null,is_daily.eq.false")
        .limit(20);

      if (!availableProblems || availableProblems.length === 0) {
        toast.error("No available problems for rotation");
        return;
      }

      const randomProblem = availableProblems[Math.floor(Math.random() * availableProblems.length)];
      const today = format(new Date(), "yyyy-MM-dd");

      // Clear existing daily
      await supabase
        .from("problems")
        .update({ is_daily: false, daily_date: null })
        .eq("is_daily", true);

      // Set new daily
      const { error } = await supabase
        .from("problems")
        .update({ is_daily: true, daily_date: today })
        .eq("id", randomProblem.id);

      if (error) throw error;

      toast.success(`Auto-rotated to: ${randomProblem.title}`);
      fetchCurrentDaily();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Auto-rotation failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Daily Problem Scheduler
          </CardTitle>
          <CardDescription>
            Set and rotate daily coding challenges for students
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Daily Problem */}
          {currentDaily && (
            <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Today's Challenge</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{currentDaily.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Difficulty: {currentDaily.difficulty} • {currentDaily.points} points
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearDailyProblem}
                  disabled={isLoading}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Auto Rotate */}
          <div className="flex gap-2">
            <Button
              onClick={autoRotateDaily}
              disabled={isLoading}
              className="flex-1 bg-gradient-neon hover:shadow-glow-pink"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Auto-Rotate Daily Problem
            </Button>
          </div>

          <div className="border-t border-border/50 pt-6">
            <h3 className="font-semibold mb-4">Manual Schedule</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Picker */}
              <div>
                <label className="text-sm font-medium mb-2 block">Select Date</label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border border-border"
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </div>

              {/* Problem Selector */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Problem</label>
                  <Select value={selectedProblem} onValueChange={setSelectedProblem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a problem" />
                    </SelectTrigger>
                    <SelectContent>
                      {problems.map((problem) => (
                        <SelectItem key={problem.id} value={problem.id}>
                          {problem.title} ({problem.difficulty})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={setDailyProblem}
                  disabled={isLoading || !selectedProblem}
                  className="w-full"
                >
                  Schedule for {format(selectedDate, "MMM dd, yyyy")}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
