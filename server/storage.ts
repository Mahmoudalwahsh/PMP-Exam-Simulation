import { promises as fs } from "fs";
import path from "path";
import type { Exam, ExamListItem, BilingualText } from "@shared/schema";

export interface IStorage {
  getAllExams(): Promise<ExamListItem[]>;
  getVisibleExams(): Promise<ExamListItem[]>;
  getExam(id: string): Promise<Exam | null>;
  deleteExam(id: string): Promise<boolean>;
  updateExam(id: string, updates: Partial<Exam>): Promise<Exam | null>;
  updateQuestion(examId: string, questionId: number | string, updates: any): Promise<Exam | null>;
  toggleExamVisibility(id: string): Promise<{ hidden: boolean } | null>;
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
            hidden: examData.hidden === true,
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

  async getVisibleExams(): Promise<ExamListItem[]> {
    const allExams = await this.getAllExams();
    return allExams.filter(exam => !exam.hidden);
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

  async deleteExam(id: string): Promise<boolean> {
    try {
      const files = await fs.readdir(this.examsDirectory);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.examsDirectory, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const examData = JSON.parse(content);

          if (examData.id === id) {
            await fs.unlink(filePath);
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error(`Error deleting exam ${id}:`, error);
      return false;
    }
  }

  async updateExam(id: string, updates: Partial<Exam>): Promise<Exam | null> {
    try {
      const files = await fs.readdir(this.examsDirectory);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.examsDirectory, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const examData = JSON.parse(content);

          if (examData.id === id) {
            // Merge updates with existing data
            const updatedExam = {
              ...examData,
              ...updates,
              // Keep the original ID
              id: examData.id,
            };

            await fs.writeFile(filePath, JSON.stringify(updatedExam, null, 2));
            return updatedExam as Exam;
          }
        }
      }

      return null;
    } catch (error) {
      console.error(`Error updating exam ${id}:`, error);
      return null;
    }
  }

  async updateQuestion(examId: string, questionId: number | string, updates: any): Promise<Exam | null> {
    try {
      const files = await fs.readdir(this.examsDirectory);
      const searchId = String(questionId);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.examsDirectory, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const examData = JSON.parse(content);

          if (examData.id === examId) {
            // Find question by ID using string comparison for compatibility
            const questionIndex = examData.questions.findIndex((q: any) => 
              String(q.id) === searchId
            );
            
            if (questionIndex === -1) {
              return null;
            }

            // Get the original question's ID (preserve its type)
            const originalId = examData.questions[questionIndex].id;
            const existingQuestion = examData.questions[questionIndex];

            // Normalize bilingual fields in updates to ensure complete data
            const normalizedUpdates = { ...updates };
            
            // Ensure bilingual fields have both languages
            const bilingualFields = ['question', 'explanation', 'domain'];
            for (const field of bilingualFields) {
              if (normalizedUpdates[field]) {
                normalizedUpdates[field] = {
                  en: normalizedUpdates[field].en || existingQuestion[field]?.en || '',
                  ar: normalizedUpdates[field].ar || existingQuestion[field]?.ar || '',
                };
              }
            }

            // Normalize options if provided
            if (normalizedUpdates.options) {
              normalizedUpdates.options = normalizedUpdates.options.map((opt: any, index: number) => ({
                en: opt.en || existingQuestion.options?.[index]?.en || '',
                ar: opt.ar || existingQuestion.options?.[index]?.ar || '',
              }));
            }

            // Merge updates with existing question
            examData.questions[questionIndex] = {
              ...existingQuestion,
              ...normalizedUpdates,
              // Keep the original ID in its original format
              id: originalId,
            };

            await fs.writeFile(filePath, JSON.stringify(examData, null, 2));
            
            // Return normalized exam data
            return this.getExam(examId);
          }
        }
      }

      return null;
    } catch (error) {
      console.error(`Error updating question ${questionId} in exam ${examId}:`, error);
      return null;
    }
  }

  async toggleExamVisibility(id: string): Promise<{ hidden: boolean } | null> {
    try {
      const files = await fs.readdir(this.examsDirectory);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.examsDirectory, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const examData = JSON.parse(content);

          if (examData.id === id) {
            // Toggle the hidden field
            const newHiddenState = !examData.hidden;
            examData.hidden = newHiddenState;

            await fs.writeFile(filePath, JSON.stringify(examData, null, 2));
            return { hidden: newHiddenState };
          }
        }
      }

      return null;
    } catch (error) {
      console.error(`Error toggling visibility for exam ${id}:`, error);
      return null;
    }
  }
}

export const storage = new FileStorage();
