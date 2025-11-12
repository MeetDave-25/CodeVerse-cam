import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProblemDialog } from "./ProblemDialog";
import { Checkbox } from "@/components/ui/checkbox";

export function ProblemsView() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<any>(null);
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSelectAll = (checked: boolean) => {
    if (checked && problems) {
      setSelectedProblems(problems.map((p) => p.id));
    } else {
      setSelectedProblems([]);
    }
  };

  const handleSelectProblem = (problemId: string, checked: boolean) => {
    if (checked) {
      setSelectedProblems([...selectedProblems, problemId]);
    } else {
      setSelectedProblems(selectedProblems.filter((id) => id !== problemId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProblems.length === 0) {
      toast.error("No problems selected");
      return;
    }

    if (!confirm(`Delete ${selectedProblems.length} problem(s)?`)) return;

    try {
      const { error } = await supabase
        .from("problems")
        .delete()
        .in("id", selectedProblems);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["admin-problems"] });
      setSelectedProblems([]);
      toast.success(`${selectedProblems.length} problem(s) deleted successfully`);
    } catch (error) {
      toast.error("Failed to delete problems");
    }
  };

  const handleExport = () => {
    if (!problems || problems.length === 0) {
      toast.error("No problems to export");
      return;
    }

    const dataStr = JSON.stringify(problems, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `problems-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Problems exported successfully");
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedProblems = JSON.parse(text);

      if (!Array.isArray(importedProblems)) {
        toast.error("Invalid file format");
        return;
      }

      // Remove id fields to let Supabase generate new ones
      const problemsToInsert = importedProblems.map(({ id, created_at, updated_at, ...problem }) => problem);

      const { error } = await supabase.from("problems").insert(problemsToInsert);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["admin-problems"] });
      toast.success(`${problemsToInsert.length} problem(s) imported successfully`);
    } catch (error) {
      toast.error("Failed to import problems");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
      
      <Card className="neon-border bg-gradient-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Problems Management</CardTitle>
              <CardDescription>Create, edit, and manage coding problems</CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedProblems.length > 0 && (
                <Button variant="destructive" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedProblems.length})
                </Button>
              )}
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button className="bg-gradient-hero" onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add Problem
              </Button>
            </div>
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
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedProblems.length === problems.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
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
                      <TableCell>
                        <Checkbox
                          checked={selectedProblems.includes(problem.id)}
                          onCheckedChange={(checked) =>
                            handleSelectProblem(problem.id, checked as boolean)
                          }
                        />
                      </TableCell>
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
