import { z } from "zod";

// Single answer question schema
export const singleAnswerQuestionSchema = z.object({
  id: z.number(),
  type: z.literal("single").default("single"),
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswer: z.number().min(0).max(3),
  explanation: z.string(),
  domain: z.string(),
});

// Multiple answer question schema
export const multipleAnswerQuestionSchema = z.object({
  id: z.number(),
  type: z.literal("multiple"),
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswers: z.array(z.number().min(0).max(3)).min(2),
  minSelections: z.number().min(2).optional(),
  maxSelections: z.number().min(2).max(4).optional(),
  explanation: z.string(),
  domain: z.string(),
});

// Question schema (discriminated union)
export const questionSchema = z.discriminatedUnion("type", [
  singleAnswerQuestionSchema,
  multipleAnswerQuestionSchema,
]);

// Exam schema
export const examSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  duration: z.number(), // in minutes
  questions: z.array(questionSchema),
});

// Single answer user answer schema
export const singleUserAnswerSchema = z.object({
  questionId: z.number(),
  type: z.literal("single").default("single"),
  selectedAnswer: z.number().min(0).max(3).nullable(),
  isMarked: z.boolean().default(false),
});

// Multiple answer user answer schema
export const multipleUserAnswerSchema = z.object({
  questionId: z.number(),
  type: z.literal("multiple"),
  selectedAnswers: z.array(z.number().min(0).max(3)),
  isMarked: z.boolean().default(false),
});

// User answer schema (discriminated union)
export const userAnswerSchema = z.discriminatedUnion("type", [
  singleUserAnswerSchema,
  multipleUserAnswerSchema,
]);

// Exam session schema
export const examSessionSchema = z.object({
  examId: z.string(),
  answers: z.array(userAnswerSchema),
  timeRemaining: z.number(), // in seconds
  isPaused: z.boolean().default(false),
  isSubmitted: z.boolean().default(false),
});

// Result schemas
export const domainResultSchema = z.object({
  domain: z.string(),
  correct: z.number(),
  total: z.number(),
  percentage: z.number(),
});

// Single answer question result schema
export const singleQuestionResultSchema = z.object({
  type: z.literal("single").default("single"),
  questionId: z.number(),
  question: z.string(),
  options: z.array(z.string()),
  userAnswer: z.number().nullable(),
  correctAnswer: z.number(),
  isCorrect: z.boolean(),
  explanation: z.string(),
  domain: z.string(),
});

// Multiple answer question result schema
export const multipleQuestionResultSchema = z.object({
  type: z.literal("multiple"),
  questionId: z.number(),
  question: z.string(),
  options: z.array(z.string()),
  userAnswers: z.array(z.number()),
  correctAnswers: z.array(z.number()),
  isCorrect: z.boolean(),
  explanation: z.string(),
  domain: z.string(),
});

// Question result schema (discriminated union)
export const questionResultSchema = z.discriminatedUnion("type", [
  singleQuestionResultSchema,
  multipleQuestionResultSchema,
]);

export const examResultSchema = z.object({
  examTitle: z.string(),
  totalQuestions: z.number(),
  correctAnswers: z.number(),
  percentage: z.number(),
  passed: z.boolean(),
  domainResults: z.array(domainResultSchema),
  questionResults: z.array(questionResultSchema),
});

// Type exports
export type SingleAnswerQuestion = z.infer<typeof singleAnswerQuestionSchema>;
export type MultipleAnswerQuestion = z.infer<typeof multipleAnswerQuestionSchema>;
export type Question = z.infer<typeof questionSchema>;
export type Exam = z.infer<typeof examSchema>;
export type SingleUserAnswer = z.infer<typeof singleUserAnswerSchema>;
export type MultipleUserAnswer = z.infer<typeof multipleUserAnswerSchema>;
export type UserAnswer = z.infer<typeof userAnswerSchema>;
export type ExamSession = z.infer<typeof examSessionSchema>;
export type DomainResult = z.infer<typeof domainResultSchema>;
export type SingleQuestionResult = z.infer<typeof singleQuestionResultSchema>;
export type MultipleQuestionResult = z.infer<typeof multipleQuestionResultSchema>;
export type QuestionResult = z.infer<typeof questionResultSchema>;
export type ExamResult = z.infer<typeof examResultSchema>;

// API response types
export type ExamListItem = {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  duration: number;
};
