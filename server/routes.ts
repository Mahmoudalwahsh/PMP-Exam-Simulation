import type { Express } from "express";
import { createServer, type Server } from "http";
import { promises as fs } from "fs";
import path from "path";
import { storage } from "./storage";
import { adminStorage } from "./admin-storage";
import { resultsStorage } from "./results-storage";
import { examSchema, examTestRecordSchema } from "@shared/schema";
import { adminLoginSchema } from "@shared/admin-schema";
import { csvToExam, parseCSV } from "./csv-parser";
import { isAdminAuthenticated } from "./auth-middleware";
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

  // Admin Login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = adminLoginSchema.parse(req.body);
      const isValid = await adminStorage.verifyPassword(username, password);

      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const admin = await adminStorage.getAdmin(username);
      if (!admin) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (req.session) {
        req.session.adminId = admin.id;
        req.session.username = admin.username;
      }

      res.json({ success: true, username: admin.username });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: "Invalid request" });
    }
  });

  // Admin Logout
  app.post("/api/admin/logout", (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  // Save exam result
  app.post("/api/results", async (req, res) => {
    try {
      const recordData = req.body;
      const record = examTestRecordSchema.omit({ id: true }).parse(recordData);
      const savedRecord = await resultsStorage.saveResult(record);
      res.json({ success: true, recordId: savedRecord.id });
    } catch (error) {
      console.error("Error saving result:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid result data" });
      }
      res.status(500).json({ error: "Failed to save result" });
    }
  });

  // Get exam results with pagination
  app.get("/api/results", isAdminAuthenticated, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const { records, total } = await resultsStorage.getResults(page, pageSize);
      res.json({ records, total, page, pageSize });
    } catch (error) {
      console.error("Error fetching results:", error);
      res.status(500).json({ error: "Failed to fetch results" });
    }
  });

  // Check admin status
  app.get("/api/admin/status", (req, res) => {
    const isAuthenticated = !!req.session?.adminId;
    res.json({ isAuthenticated, username: req.session?.username });
  });

  // Upload exam (CSV or JSON)
  app.post("/api/admin/upload", isAdminAuthenticated, async (req, res) => {
    try {
      const { fileName, content, examData } = req.body;

      if (!fileName || !content) {
        return res.status(400).json({ error: "Missing fileName or content" });
      }

      let exam;

      if (fileName.endsWith(".csv")) {
        // Parse CSV and convert to exam
        const csvRows = parseCSV(content);
        const examId = `exam-${Date.now()}`;
        const title = examData?.title || "Uploaded Exam";
        exam = csvToExam(csvRows, examId, title, examData?.description);
      } else if (fileName.endsWith(".json")) {
        // Validate JSON structure
        exam = examSchema.parse(JSON.parse(content));
      } else {
        return res
          .status(400)
          .json({ error: "Only CSV and JSON files are supported" });
      }

      // Save exam file
      const examsDir = path.join(process.cwd(), "exams");
      await fs.mkdir(examsDir, { recursive: true });

      const examFileName = `${exam.id}.json`;
      const filePath = path.join(examsDir, examFileName);

      await fs.writeFile(filePath, JSON.stringify(exam, null, 2));

      res.json({
        success: true,
        examId: exam.id,
        fileName: examFileName,
        questionCount: exam.questions.length,
      });
    } catch (error) {
      console.error("Upload error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid exam structure" });
      }
      res.status(500).json({ error: "Upload failed" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
