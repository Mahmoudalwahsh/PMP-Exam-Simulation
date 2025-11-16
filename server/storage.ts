import { promises as fs } from "fs";
import path from "path";
import type { Exam, ExamListItem, BilingualText } from "@shared/schema";

export interface IStorage {
  getAllExams(): Promise<ExamListItem[]>;
  getExam(id: string): Promise<Exam | null>;
}

// Helper function to convert old string format to bilingual format
function toBilingualText(value: string | BilingualText): BilingualText {
  if (typeof value === 'string') {
    // Old format: fallback to English text for both languages
    // This allows legacy exams to work in both language modes
    // Properly translated exams will have native Arabic content
    return {
      en: value,
      ar: value // Fallback: use English text for Arabic mode too
    };
  }
  return value;
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
          const examData: any = JSON.parse(content);

          exams.push({
            id: examData.id,
            title: toBilingualText(examData.title),
            description: toBilingualText(examData.description),
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
            // Convert title and description to bilingual format
            examData.title = toBilingualText(examData.title);
            examData.description = toBilingualText(examData.description);
            
            // Normalize questions to ensure they have type field and bilingual content
            examData.questions = examData.questions.map((q: any) => {
              const question: any = { ...q };
              
              // Add type if missing (backward compatibility)
              if (!question.type) {
                question.type = q.correctAnswers !== undefined ? "multiple" : "single";
              }
              
              // Convert text fields to bilingual format
              question.question = toBilingualText(q.question);
              question.explanation = toBilingualText(q.explanation);
              question.domain = toBilingualText(q.domain);
              
              // Convert options array to bilingual format
              question.options = q.options.map((opt: any) => toBilingualText(opt));
              
              return question;
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
