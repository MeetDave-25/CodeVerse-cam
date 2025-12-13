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
import { problemSchema } from "@/schemas/problem";


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

export function ProblemsView() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<any>(null);
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
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

  // Derived state for filters
  const uniqueSubjects = Array.from(new Set(problems?.map((p) => p.subject).filter(Boolean) || [])).sort();

  const filteredProblems = problems?.filter(problem => {
    const matchesYear = filterYear === "all" || (problem.year?.toString() === filterYear);
    const matchesSubject = filterSubject === "all" || problem.subject === filterSubject;
    return matchesYear && matchesSubject;
  });

  const clearFilters = () => {
    setFilterYear("all");
    setFilterSubject("all");
  };

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
      console.log("Saving problem data:", problemData);

      if (problemData.id) {
        // Update existing problem
        const { id, ...updateData } = problemData;
        const { data, error } = await supabase
          .from("problems")
          .update(updateData)
          .eq("id", id)
          .select();

        if (error) {
          console.error("Update error:", error);
          throw error;
        }
        return data;
      } else {
        // Create new problem
        const { data, error } = await supabase
          .from("problems")
          .insert([problemData])
          .select();

        if (error) {
          console.error("Insert error:", error);
          throw error;
        }
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-problems"] });
      toast.success(variables.id ? "Problem updated successfully" : "Problem created successfully");
      setIsDialogOpen(false);
      setEditingProblem(null);
    },
    onError: (error: any) => {
      console.error("Save problem error:", error);
      toast.error(`Failed to save problem: ${error.message || "Unknown error"}`);
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
    if (checked && filteredProblems) {
      setSelectedProblems(filteredProblems.map((p) => p.id));
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

  /* Template with 30 Sample Problems (10 Easy, 10 Medium, 10 Hard) */
  const handleDownloadTemplate = () => {
    const difficulties = ["easy", "medium", "hard"] as const;
    const templateData = [];

    // Generate 10 problems for each difficulty
    difficulties.forEach((diff) => {
      for (let i = 1; i <= 10; i++) {
        templateData.push({
          title: `${diff.charAt(0).toUpperCase() + diff.slice(1)} Problem ${i}`,
          description: `This is a sample ${diff} problem description. Replace this with your actual problem text.`,
          difficulty: diff,
          subject: "Computer Science",
          points: diff === "easy" ? 10 : diff === "medium" ? 20 : 30,
          starter_code: "// Write your solution here\nfunction solution() {\n  \n}",
          year: 1,
          semester: 1,
          language: "javascript",
          test_cases: [
            { "input": "sample input", "output": "sample output" }
          ]
        });
      }
    });

    const dataStr = JSON.stringify(templateData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bulk-import-template-30-problems.json";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded with 30 sample problems!");
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let importedProblems;
      try {
        importedProblems = JSON.parse(text);
      } catch (e) {
        toast.error("Invalid JSON file format");
        return;
      }

      if (!Array.isArray(importedProblems)) {
        toast.error("File must contain an array of problems");
        return;
      }

      // Validate each problem against the schema
      const validProblems = [];
      const errors = [];

      for (const [index, problem] of importedProblems.entries()) {
        const result = problemSchema.safeParse(problem);
        if (result.success) {
          // Clean up test_cases if it's an array (stringify it for DB if column is text/jsonb depending on impl)
          // Assuming DB handles JSONB or we need to stringify. 
          // Looking at ProblemDialog, it parses/stringifies test_cases.
          // Let's assume the API expects the raw object if it's JSONB, or we check existing code.
          // Existing code: const problemsToInsert = importedProblems.map(({ id, ... }) => problem);
          // So it inserts directly.
          validProblems.push(result.data);
        } else {
          errors.push(`Row ${index + 1}: ${result.error.issues[0].message}`);
        }
      }

      if (errors.length > 0) {
        console.error("Validation errors:", errors);
        toast.error(`Found ${errors.length} validation errors. Check console for details.`);
        // Optional: Allow partial import or stop? Let's stop to be safe or ask user. 
        // For now, let's stop to prevent bad data.
        if (errors.length > 5) {
          toast.error(`First 5 errors: ${errors.slice(0, 5).join(", ")}`);
        }
        return;
      }

      if (validProblems.length === 0) {
        toast.error("No valid problems found to import");
        return;
      }

      // Remove id/timestamps to ensure fresh insertion
      const titleSet = new Set(problems?.map(p => p.title) || []);
      const uniqueProblems = validProblems.filter(p => !titleSet.has(p.title));

      if (uniqueProblems.length < validProblems.length) {
        const skipped = validProblems.length - uniqueProblems.length;
        toast.info(`Skipping ${skipped} duplicate problems (by title)`);
      }

      if (uniqueProblems.length === 0) {
        toast.warning("All problems are duplicates!");
        return;
      }

      const { error } = await supabase.from("problems").insert(uniqueProblems);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["admin-problems"] });
      toast.success(`${uniqueProblems.length} problems imported successfully!`);
    } catch (error) {
      console.error("Import error:", error);
      toast.error(`Failed to import problems: ${(error as Error).message}`);
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
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Template
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

          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/20 rounded-lg border border-border/50">
            <div className="w-[150px]">
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="1">Year 1</SelectItem>
                  <SelectItem value="2">Year 2</SelectItem>
                  <SelectItem value="3">Year 3</SelectItem>
                  <SelectItem value="4">Year 4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-[200px]">
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {uniqueSubjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            {(filterYear !== "all" || filterSubject !== "all") && (
              <Button variant="ghost" onClick={clearFilters} className="px-3">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading problems...</p>
            </div>
          ) : filteredProblems && filteredProblems.length > 0 ? (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={filteredProblems.length > 0 && selectedProblems.length === filteredProblems.length}
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
                  {filteredProblems.map((problem) => (
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
                          className={`px-2 py-1 rounded text-xs font-medium ${problem.difficulty === "easy"
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
              <p className="text-muted-foreground mb-4">
                {problems && problems.length > 0
                  ? "No problems match your filters"
                  : "No problems yet"}
              </p>
              <Button onClick={handleCreate} variant="outline">
                {problems && problems.length > 0 ? "Reset Filters" : "Create your first problem"}
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
