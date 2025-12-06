import type { Express } from "express";
import { createServer, type Server } from "http";
import { promises as fs } from "fs";
import path from "path";
import { storage } from "./storage";
import { adminStorage } from "./admin-storage";
import { resultsStorage } from "./results-storage";
import { getAccessCode, setAccessCode, verifyAccessCode } from "./site-access";
import { examSchema, examTestRecordSchema } from "@shared/schema";
import { adminLoginSchema } from "@shared/admin-schema";
import { csvToExam, parseCSV } from "./csv-parser";
import { isAdminAuthenticated } from "./auth-middleware";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve template files for download
  app.get("/exams/templates/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      const allowedFiles = ["exam-template.csv", "_template.json"];
      
      if (!allowedFiles.includes(filename)) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      const filePath = path.join(process.cwd(), "exams", "templates", filename);
      const content = await fs.readFile(filePath, "utf-8");
      
      if (filename.endsWith(".csv")) {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      } else {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      }
      
      res.send(content);
    } catch (error) {
      console.error("Error serving template:", error);
      res.status(500).json({ error: "Failed to serve template" });
    }
  });

  // Get all visible exams (for public users)
  app.get("/api/exams", async (req, res) => {
    try {
      const exams = await storage.getVisibleExams();
      res.json(exams);
    } catch (error) {
      console.error("Error fetching exams:", error);
      res.status(500).json({ error: "Failed to fetch exams" });
    }
  });

  // Get all exams including hidden (for admin)
  app.get("/api/admin/exams", isAdminAuthenticated, async (req, res) => {
    try {
      const exams = await storage.getAllExams();
      res.json(exams);
    } catch (error) {
      console.error("Error fetching all exams:", error);
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

  // Delete exam
  app.delete("/api/admin/exams/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteExam(id);

      if (!success) {
        return res.status(404).json({ error: "Exam not found" });
      }

      res.json({ success: true, message: "Exam deleted successfully" });
    } catch (error) {
      console.error("Delete exam error:", error);
      res.status(500).json({ error: "Failed to delete exam" });
    }
  });

  // Toggle exam visibility (hide/show)
  app.patch("/api/admin/exams/:id/visibility", isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await storage.toggleExamVisibility(id);

      if (!result) {
        return res.status(404).json({ error: "Exam not found" });
      }

      res.json({ 
        success: true, 
        hidden: result.hidden,
        message: result.hidden ? "Exam is now hidden" : "Exam is now visible"
      });
    } catch (error) {
      console.error("Toggle visibility error:", error);
      res.status(500).json({ error: "Failed to toggle exam visibility" });
    }
  });

  // Update exam metadata
  app.put("/api/admin/exams/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, duration } = req.body;

      // Only allow updating specific fields
      const allowedUpdates: any = {};
      
      if (title) {
        // Validate bilingual structure
        if (typeof title === 'object' && title.en && title.ar) {
          allowedUpdates.title = { en: String(title.en), ar: String(title.ar) };
        } else {
          return res.status(400).json({ error: "Title must have 'en' and 'ar' fields" });
        }
      }
      
      if (description) {
        if (typeof description === 'object' && description.en && description.ar) {
          allowedUpdates.description = { en: String(description.en), ar: String(description.ar) };
        } else {
          return res.status(400).json({ error: "Description must have 'en' and 'ar' fields" });
        }
      }
      
      if (duration !== undefined) {
        const durationNum = parseInt(duration);
        if (isNaN(durationNum) || durationNum <= 0) {
          return res.status(400).json({ error: "Duration must be a positive number" });
        }
        allowedUpdates.duration = durationNum;
      }

      if (Object.keys(allowedUpdates).length === 0) {
        return res.status(400).json({ error: "No valid updates provided" });
      }

      const updatedExam = await storage.updateExam(id, allowedUpdates);

      if (!updatedExam) {
        return res.status(404).json({ error: "Exam not found" });
      }

      res.json({ success: true, exam: updatedExam });
    } catch (error) {
      console.error("Update exam error:", error);
      res.status(500).json({ error: "Failed to update exam" });
    }
  });

  // Update a specific question in an exam
  app.put("/api/admin/exams/:examId/questions/:questionId", isAdminAuthenticated, async (req, res) => {
    try {
      const { examId, questionId } = req.params;
      const body = req.body;

      // Validate and sanitize question updates
      const sanitizedUpdate: any = {};

      // Validate type
      if (body.type) {
        if (body.type !== 'single' && body.type !== 'multiple') {
          return res.status(400).json({ error: "Type must be 'single' or 'multiple'" });
        }
        sanitizedUpdate.type = body.type;
      }

      // Validate bilingual fields
      const bilingualFields = ['question', 'explanation', 'domain'];
      for (const field of bilingualFields) {
        if (body[field]) {
          if (typeof body[field] !== 'object' || !body[field].en || !body[field].ar) {
            return res.status(400).json({ error: `${field} must have 'en' and 'ar' fields` });
          }
          sanitizedUpdate[field] = { en: String(body[field].en), ar: String(body[field].ar) };
        }
      }

      // Validate options array
      if (body.options) {
        if (!Array.isArray(body.options) || body.options.length !== 4) {
          return res.status(400).json({ error: "Options must be an array of 4 items" });
        }
        sanitizedUpdate.options = body.options.map((opt: any) => {
          if (typeof opt !== 'object' || !opt.en || !opt.ar) {
            throw new Error("Each option must have 'en' and 'ar' fields");
          }
          return { en: String(opt.en), ar: String(opt.ar) };
        });
      }

      // Validate correctAnswer for single type
      if (body.correctAnswer !== undefined) {
        const ans = parseInt(body.correctAnswer);
        if (isNaN(ans) || ans < 0 || ans > 3) {
          return res.status(400).json({ error: "correctAnswer must be 0-3" });
        }
        sanitizedUpdate.correctAnswer = ans;
      }

      // Validate correctAnswers for multiple type
      if (body.correctAnswers !== undefined) {
        if (!Array.isArray(body.correctAnswers)) {
          return res.status(400).json({ error: "correctAnswers must be an array" });
        }
        const validAnswers = body.correctAnswers.every((a: any) => {
          const num = parseInt(a);
          return !isNaN(num) && num >= 0 && num <= 3;
        });
        if (!validAnswers) {
          return res.status(400).json({ error: "correctAnswers must contain values 0-3" });
        }
        sanitizedUpdate.correctAnswers = body.correctAnswers.map((a: any) => parseInt(a));
      }

      // Validate min/max selections
      if (body.minSelections !== undefined) {
        sanitizedUpdate.minSelections = parseInt(body.minSelections) || 2;
      }
      if (body.maxSelections !== undefined) {
        sanitizedUpdate.maxSelections = parseInt(body.maxSelections) || 4;
      }

      if (Object.keys(sanitizedUpdate).length === 0) {
        return res.status(400).json({ error: "No valid updates provided" });
      }

      const updatedExam = await storage.updateQuestion(examId, parseInt(questionId), sanitizedUpdate);

      if (!updatedExam) {
        return res.status(404).json({ error: "Exam or question not found" });
      }

      res.json({ success: true, exam: updatedExam });
    } catch (error) {
      console.error("Update question error:", error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to update question" });
    }
  });

  // Site Access Code - Verify (public endpoint)
  app.post("/api/site-access/verify", async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "Access code is required" });
      }
      
      const isValid = await verifyAccessCode(code.trim());
      res.json({ valid: isValid });
    } catch (error) {
      console.error("Error verifying access code:", error);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  // Site Access Code - Get current code (admin only)
  app.get("/api/admin/site-access", isAdminAuthenticated, async (req, res) => {
    try {
      const code = await getAccessCode();
      res.json({ accessCode: code });
    } catch (error) {
      console.error("Error getting access code:", error);
      res.status(500).json({ error: "Failed to get access code" });
    }
  });

  // Site Access Code - Update code (admin only)
  app.put("/api/admin/site-access", isAdminAuthenticated, async (req, res) => {
    try {
      const { accessCode } = req.body;
      
      if (!accessCode || typeof accessCode !== "string" || accessCode.trim().length < 4) {
        return res.status(400).json({ error: "Access code must be at least 4 characters" });
      }
      
      const success = await setAccessCode(accessCode.trim());
      
      if (success) {
        res.json({ success: true, message: "Access code updated successfully" });
      } else {
        res.status(500).json({ error: "Failed to update access code" });
      }
    } catch (error) {
      console.error("Error updating access code:", error);
      res.status(500).json({ error: "Failed to update access code" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
