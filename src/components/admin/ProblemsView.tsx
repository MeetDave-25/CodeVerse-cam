import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProblemDialog } from "./ProblemDialog";

export function ProblemsView() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<any>(null);

  const { data: problems, isLoading } = useQuery({
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

  const saveProblem = useMutation({
    mutationFn: async (problemData: any) => {
      if (problemData.id) {
        // Update existing problem
        const { id, ...updateData } = problemData;
        const { error } = await supabase
          .from("problems")
          .update(updateData)
          .eq("id", id);
        if (error) throw error;
      } else {
        // Create new problem
        const { error } = await supabase.from("problems").insert([problemData]);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-problems"] });
      toast.success(variables.id ? "Problem updated successfully" : "Problem created successfully");
      setIsDialogOpen(false);
      setEditingProblem(null);
    },
    onError: () => {
      toast.error("Failed to save problem");
    },
  });

  const handleEdit = (problem: any) => {
    setEditingProblem(problem);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingProblem(null);
    setIsDialogOpen(true);
  };

  return (
    <>
      <Card className="neon-border bg-gradient-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Problems Management</CardTitle>
              <CardDescription>Create, edit, and manage coding problems</CardDescription>
            </div>
            <Button className="bg-gradient-hero" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Problem
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading problems...</p>
            </div>
          ) : problems && problems.length > 0 ? (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Year/Sem</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {problems.map((problem) => (
                    <TableRow key={problem.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{problem.title}</TableCell>
                      <TableCell>{problem.subject}</TableCell>
                      <TableCell className="text-muted-foreground">
                        Y{problem.year || "-"} / S{problem.semester || "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            problem.difficulty === "easy"
                              ? "bg-success/20 text-success"
                              : problem.difficulty === "medium"
                              ? "bg-accent/20 text-accent"
                              : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          {problem.difficulty}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{problem.points}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(problem)}
                            className="hover:bg-primary/10"
                          >
                            <Edit className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteProblem.mutate(problem.id)}
                            className="hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No problems yet</p>
              <Button onClick={handleCreate} variant="outline">
                Create your first problem
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ProblemDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingProblem(null);
        }}
        onSubmit={(data) => saveProblem.mutate(data)}
        problem={editingProblem}
        isLoading={saveProblem.isPending}
      />
    </>
  );
}
