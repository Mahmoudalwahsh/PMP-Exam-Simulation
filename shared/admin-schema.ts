import { z } from "zod";

export const adminLoginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const adminSessionSchema = z.object({
  userId: z.string(),
  username: z.string(),
  loggedInAt: z.number(),
});

export const csvQuestionSchema = z.object({
  id: z.string().or(z.number()),
  type: z.enum(["single", "multiple"]).default("single"),
  question: z.string(),
  optionA: z.string(),
  optionB: z.string(),
  optionC: z.string(),
  optionD: z.string().optional(),
  correctAnswer: z.string().optional(),
  correctAnswers: z.string().optional(),
  minSelections: z.string().or(z.number()).optional(),
  maxSelections: z.string().or(z.number()).optional(),
  explanation: z.string().optional(),
  domain: z.string().default("General"),
});

export type AdminLogin = z.infer<typeof adminLoginSchema>;
export type AdminSession = z.infer<typeof adminSessionSchema>;
export type CSVQuestion = z.infer<typeof csvQuestionSchema>;
