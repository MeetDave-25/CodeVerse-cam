-- Add language column to problems table
ALTER TABLE public.problems ADD COLUMN language TEXT DEFAULT 'javascript';
ALTER TABLE public.problems ADD CONSTRAINT problems_language_check CHECK (language IN ('javascript', 'python', 'c', 'cpp', 'java'));
