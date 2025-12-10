import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { z } from "zod";

const problemSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200, "Title too long"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(5000, "Description too long"),
  difficulty: z.enum(["easy", "medium", "hard"], { required_error: "Please select a difficulty" }),
  subject: z.string().trim().min(2, "Subject must be at least 2 characters").max(100, "Subject too long"),
  points: z.number().int().min(1, "Points must be at least 1").max(1000, "Points too high"),
  starter_code: z.string().max(5000, "Starter code too long").optional(),
  year: z.number().int().min(1).max(4).optional(),
  semester: z.number().int().min(1).max(2).optional(),
  test_cases: z.string().optional(),
  language: z.enum([
    "javascript", "python", "c", "cpp", "java",
    "jquery", "json", "typescript", "sql", "html", "css", "bash"
  ]).default("javascript"),
});

type ProblemFormData = z.infer<typeof problemSchema>;

interface ProblemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  problem?: any;
  isLoading?: boolean;
}

export function ProblemDialog({
  open,
  onOpenChange,
  onSubmit,
  problem,
  isLoading = false,
}: ProblemDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "easy",
    subject: "",
    points: 10,
    starter_code: "",
    year: 1,
    semester: 1,
    test_cases: "",
    language: "javascript",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (problem) {
      setFormData({
        title: problem.title || "",
        description: problem.description || "",
        difficulty: problem.difficulty || "easy",
        subject: problem.subject || "",
        points: problem.points || 10,
        starter_code: problem.starter_code || "",
        year: problem.year || 1,
        semester: problem.semester || 1,
        test_cases: problem.test_cases ? JSON.stringify(problem.test_cases, null, 2) : "",
        language: problem.language || "javascript",
      });
    } else {
      // Reset form for new problem
      setFormData({
        title: "",
        description: "",
        difficulty: "easy",
        subject: "",
        points: 10,
        starter_code: "",
        year: 1,
        semester: 1,
        test_cases: "",
        language: "javascript",
      });
    }
    setErrors({});
  }, [problem, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Parse test cases if provided
      let testCases = null;
      if (formData.test_cases.trim()) {
        try {
          testCases = JSON.parse(formData.test_cases);
        } catch {
          setErrors({ test_cases: "Invalid JSON format for test cases" });
          return;
        }
      }

      const validatedData = problemSchema.parse({
        ...formData,
        points: Number(formData.points),
        year: Number(formData.year),
        semester: Number(formData.semester),
      });

      onSubmit({
        ...validatedData,
        test_cases: testCases,
        ...(problem && { id: problem.id }),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMap: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errorMap[err.path[0] as string] = err.message;
          }
        });
        setErrors(errorMap);
        toast.error("Please fix the validation errors");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="neon-text">
            {problem ? "Edit Problem" : "Create New Problem"}
          </DialogTitle>
          <DialogDescription>
            {problem ? "Update the problem details" : "Add a new coding challenge"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty *</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
              >
                <SelectTrigger className={errors.difficulty ? "border-destructive" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              {errors.difficulty && (
                <p className="text-xs text-destructive">{errors.difficulty}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Points *</Label>
              <Input
                id="points"
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                className={errors.points ? "border-destructive" : ""}
              />
              {errors.points && <p className="text-xs text-destructive">{errors.points}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className={errors.subject ? "border-destructive" : ""}
            />
            {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select
                value={String(formData.year)}
                onValueChange={(value) => setFormData({ ...formData, year: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Year 1</SelectItem>
                  <SelectItem value="2">Year 2</SelectItem>
                  <SelectItem value="3">Year 3</SelectItem>
                  <SelectItem value="4">Year 4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Select
                value={String(formData.semester)}
                onValueChange={(value) => setFormData({ ...formData, semester: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Semester 1</SelectItem>
                  <SelectItem value="2">Semester 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Programming Language *</Label>
            <Select
              value={formData.language}
              onValueChange={(value) => setFormData({ ...formData, language: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                <SelectItem value="javascript">JavaScript (Node.js)</SelectItem>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="c">C</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="css">CSS</SelectItem>
                <SelectItem value="sql">SQL</SelectItem>
                <SelectItem value="bash">Bash</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="jquery">jQuery</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="starter_code">Starter Code</Label>
            <Textarea
              id="starter_code"
              value={formData.starter_code}
              onChange={(e) => setFormData({ ...formData, starter_code: e.target.value })}
              rows={6}
              placeholder="function solution() {&#10;  // Your code here&#10;}"
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test_cases">Test Cases (JSON format)</Label>
            <Textarea
              id="test_cases"
              value={formData.test_cases}
              onChange={(e) => setFormData({ ...formData, test_cases: e.target.value })}
              rows={6}
              placeholder='[{"input": "example", "expected": "result"}]'
              className={`font-mono text-sm ${errors.test_cases ? "border-destructive" : ""}`}
            />
            {errors.test_cases && (
              <p className="text-xs text-destructive">{errors.test_cases}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Optional: Provide test cases in JSON array format
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 bg-gradient-hero" disabled={isLoading}>
              {isLoading ? "Saving..." : problem ? "Update Problem" : "Create Problem"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
