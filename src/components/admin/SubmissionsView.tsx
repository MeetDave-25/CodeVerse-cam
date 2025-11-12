import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileCode, Filter, Search, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CodeHighlighter } from "@/components/ui/code-highlighter";

export function SubmissionsView() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<any[]>([]);
  const [problems, setProblems] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [problemFilter, setProblemFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [submissions, searchQuery, statusFilter, userFilter, problemFilter, dateFrom, dateTo]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [{ data: submissionsData }, { data: problemsData }, { data: usersData }] = await Promise.all([
        supabase
          .from("submissions")
          .select(`
            *,
            profiles:user_id (email, full_name),
            problems:problem_id (title, difficulty)
          `)
          .order("created_at", { ascending: false }),
        supabase.from("problems").select("id, title"),
        supabase.from("profiles").select("id, email, full_name")
      ]);

      if (submissionsData) setSubmissions(submissionsData);
      if (problemsData) setProblems(problemsData);
      if (usersData) setUsers(usersData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load submissions");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...submissions];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(sub => 
        sub.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.problems?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.code?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }

    // User filter
    if (userFilter !== "all") {
      filtered = filtered.filter(sub => sub.user_id === userFilter);
    }

    // Problem filter
    if (problemFilter !== "all") {
      filtered = filtered.filter(sub => sub.problem_id === problemFilter);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(sub => new Date(sub.created_at) >= dateFrom);
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter(sub => new Date(sub.created_at) <= endOfDay);
    }

    setFilteredSubmissions(filtered);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setUserFilter("all");
    setProblemFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FileCode className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary" />
            Submission History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, problem, or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            {/* User Filter */}
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Problem Filter */}
            <Select value={problemFilter} onValueChange={setProblemFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by problem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Problems</SelectItem>
                {problems.map((problem) => (
                  <SelectItem key={problem.id} value={problem.id}>
                    {problem.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date From */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : "From date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Date To */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : "To date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredSubmissions.length} of {submissions.length} submissions
            </p>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <Filter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>

          {/* Submissions Table */}
          <div className="border border-border/50 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>User</TableHead>
                  <TableHead>Problem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No submissions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        {submission.profiles?.full_name || submission.profiles?.email || "Unknown"}
                      </TableCell>
                      <TableCell>
                        {submission.problems?.title || "Deleted Problem"}
                        <Badge variant="outline" className="ml-2">
                          {submission.problems?.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            submission.status === "accepted"
                              ? "bg-success/20 text-success border-success/30"
                              : "bg-destructive/20 text-destructive border-destructive/30"
                          }
                        >
                          {submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{submission.score} pts</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(submission.created_at), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              View Code
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle>Submission Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 overflow-y-auto">
                              <div>
                                <h4 className="font-semibold mb-2">Problem</h4>
                                <p className="text-sm text-muted-foreground">
                                  {submission.problems?.title}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Code</h4>
                                <CodeHighlighter 
                                  code={submission.code} 
                                  language={submission.language || "javascript"}
                                  showLineNumbers={true}
                                />
                              </div>
                              {submission.test_results && (
                                <div>
                                  <h4 className="font-semibold mb-2">Test Results</h4>
                                  <div className="space-y-2">
                                    {submission.test_results.map((result: any, i: number) => (
                                      <div
                                        key={i}
                                        className={`p-2 rounded border text-sm ${
                                          result.passed
                                            ? "bg-success/10 border-success/30 text-success"
                                            : "bg-destructive/10 border-destructive/30 text-destructive"
                                        }`}
                                      >
                                        Test {i + 1}: {result.passed ? "✓ Passed" : "✗ Failed"}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
