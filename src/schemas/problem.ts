import { z } from "zod";

export const problemSchema = z.object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(200, "Title too long"),
    description: z.string().trim().min(10, "Description must be at least 10 characters").max(5000, "Description too long"),
    difficulty: z.enum(["easy", "medium", "hard"], { required_error: "Please select a difficulty" }),
    subject: z.string().trim().min(2, "Subject must be at least 2 characters").max(100, "Subject too long"),
    points: z.number().int().min(1, "Points must be at least 1").max(1000, "Points too high"),
    starter_code: z.string().max(5000, "Starter code too long").optional(),
    year: z.number().int().min(1).max(4).optional(),
    semester: z.number().int().min(1).max(2).optional(),
    test_cases: z.union([z.string(), z.array(z.any())]).optional(), // Allow string or array for flexible import
    language: z.enum([
        "javascript", "python", "c", "cpp", "java",
        "jquery", "json", "typescript", "sql", "html", "css", "bash"
    ]).default("javascript"),
});

export type ProblemFormData = z.infer<typeof problemSchema>;
