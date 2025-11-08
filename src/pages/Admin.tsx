import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Code2, LogOut, Plus, Trash2, Users, FileCode, Trophy, Settings } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const Admin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Fetch problems
  const { data: problems } = useQuery({
    queryKey: ["admin-problems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("problems")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch users
  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Delete problem mutation
  const deleteProblem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("problems").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-problems"] });
      toast.success("Problem deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete problem");
    },
  });

  // Create problem mutation
  const createProblem = useMutation({
    mutationFn: async (formData: FormData) => {
      const problem = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        difficulty: formData.get("difficulty") as string,
        subject: formData.get("subject") as string,
        points: parseInt(formData.get("points") as string),
        starter_code: formData.get("starter_code") as string,
      };

      const { error } = await supabase.from("problems").insert([problem]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-problems"] });
      toast.success("Problem created successfully");
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error("Failed to create problem");
    },
  });

  const handleCreateProblem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createProblem.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-neon-pink/20 bg-cyber-dark/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="h-6 w-6 text-neon-pink animate-neon-pulse" />
            <span className="text-xl font-bold neon-text">Admin Panel</span>
          </div>
          <Button onClick={handleLogout} variant="outline" className="neon-border">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl font-bold mb-2 neon-text">Dashboard</h1>
          <p className="text-muted-foreground">Manage your platform</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-up">
          <Card className="neon-border bg-cyber-dark/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Problems</CardTitle>
              <FileCode className="h-4 w-4 text-neon-cyan" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-neon-cyan">{problems?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="neon-border bg-cyber-dark/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-neon-pink" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-neon-pink">{users?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="neon-border bg-cyber-dark/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Today</CardTitle>
              <Trophy className="h-4 w-4 text-neon-yellow" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-neon-yellow">
                {users?.filter((u) => {
                  const today = new Date().toDateString();
                  return new Date(u.created_at).toDateString() === today;
                }).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="problems" className="animate-slide-up">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="problems">Problems</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="problems">
            <Card className="neon-border bg-cyber-dark/50 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Problems Management</CardTitle>
                    <CardDescription>Create and manage coding problems</CardDescription>
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-hero">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Problem
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto neon-border bg-cyber-dark">
                      <DialogHeader>
                        <DialogTitle className="neon-text">Create New Problem</DialogTitle>
                        <DialogDescription>Add a new coding challenge</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateProblem} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Title</Label>
                          <Input id="title" name="title" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea id="description" name="description" rows={4} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="difficulty">Difficulty</Label>
                            <Select name="difficulty" required>
                              <SelectTrigger>
                                <SelectValue placeholder="Select difficulty" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="points">Points</Label>
                            <Input id="points" name="points" type="number" defaultValue="10" required />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subject">Subject</Label>
                          <Input id="subject" name="subject" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="starter_code">Starter Code</Label>
                          <Textarea id="starter_code" name="starter_code" rows={6} />
                        </div>
                        <Button type="submit" className="w-full bg-gradient-hero">
                          Create Problem
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {problems?.map((problem) => (
                      <TableRow key={problem.id}>
                        <TableCell className="font-medium">{problem.title}</TableCell>
                        <TableCell>{problem.subject}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              problem.difficulty === "easy"
                                ? "bg-green-500/20 text-green-400"
                                : problem.difficulty === "medium"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {problem.difficulty}
                          </span>
                        </TableCell>
                        <TableCell>{problem.points}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteProblem.mutate(problem.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="neon-border bg-cyber-dark/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Users Management</CardTitle>
                <CardDescription>View and manage registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Total Score</TableHead>
                      <TableHead>Problems Solved</TableHead>
                      <TableHead>Current Streak</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name || "N/A"}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="text-neon-cyan">{user.total_score}</TableCell>
                        <TableCell>{user.problems_solved}</TableCell>
                        <TableCell className="text-neon-pink">{user.current_streak} 🔥</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
