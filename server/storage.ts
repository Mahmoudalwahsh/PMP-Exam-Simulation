import { promises as fs } from "fs";
import path from "path";
import type { Exam, ExamListItem } from "@shared/schema";

export interface IStorage {
  getAllExams(): Promise<ExamListItem[]>;
  getExam(id: string): Promise<Exam | null>;
}

export class FileStorage implements IStorage {
  private examsDirectory: string;

  constructor() {
    // Path to exams directory in the project root
    this.examsDirectory = path.join(process.cwd(), "exams");
    this.ensureExamsDirectory();
  }

  private async ensureExamsDirectory() {
    try {
      await fs.access(this.examsDirectory);
    } catch {
      // Create the directory if it doesn't exist
      await fs.mkdir(this.examsDirectory, { recursive: true });
      console.log(`Created exams directory at: ${this.examsDirectory}`);
    }
  }

  async getAllExams(): Promise<ExamListItem[]> {
    try {
      const files = await fs.readdir(this.examsDirectory);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      const exams: ExamListItem[] = [];

      for (const file of jsonFiles) {
        try {
          const filePath = path.join(this.examsDirectory, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const examData: Exam = JSON.parse(content);

          exams.push({
            id: examData.id,
            title: examData.title,
            description: examData.description,
            questionCount: examData.questions.length,
            duration: examData.duration,
          });
        } catch (error) {
          console.error(`Error parsing exam file ${file}:`, error);
        }
      }

      return exams;
    } catch (error) {
      console.error("Error reading exams directory:", error);
      return [];
    }
  }

  async getExam(id: string): Promise<Exam | null> {
    try {
      const files = await fs.readdir(this.examsDirectory);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.examsDirectory, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const examData: any = JSON.parse(content);

          if (examData.id === id) {
            // Normalize questions to ensure they have type field (backward compatibility)
            examData.questions = examData.questions.map((q: any) => {
              // If question already has type, return as-is
              if (q.type) {
                return q;
              }
              
              // Legacy format: add type based on presence of correctAnswer vs correctAnswers
              if (q.correctAnswers !== undefined) {
                return { ...q, type: "multiple" };
              } else {
                return { ...q, type: "single" };
              }
            });
            
            return examData as Exam;
          }
        }
      }

      return null;
    } catch (error) {
      console.error(`Error fetching exam ${id}:`, error);
      return null;
    }
  }
}

export const storage = new FileStorage();
