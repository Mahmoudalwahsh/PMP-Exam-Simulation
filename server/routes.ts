import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { examSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all available exams
  app.get("/api/exams", async (req, res) => {
    try {
      const exams = await storage.getAllExams();
      res.json(exams);
    } catch (error) {
      console.error("Error fetching exams:", error);
      res.status(500).json({ error: "Failed to fetch exams" });
    }
  });

  // Get specific exam by ID
  app.get("/api/exams/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const exam = await storage.getExam(id);
      
      if (!exam) {
        return res.status(404).json({ error: "Exam not found" });
      }

      // Validate exam structure
      try {
        examSchema.parse(exam);
      } catch (validationError) {
        console.error("Invalid exam structure:", validationError);
        if (validationError instanceof ZodError) {
          return res.status(500).json({ 
            error: "Invalid exam data structure",
            details: validationError.errors 
          });
        }
      }

      res.json(exam);
    } catch (error) {
      console.error("Error fetching exam:", error);
      res.status(500).json({ error: "Failed to fetch exam" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
