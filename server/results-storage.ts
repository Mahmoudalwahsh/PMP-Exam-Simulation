import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { ExamTestRecord } from "@shared/schema";

export interface IResultsStorage {
  saveResult(record: Omit<ExamTestRecord, "id">): Promise<ExamTestRecord>;
  getResults(page: number, pageSize: number): Promise<{ records: ExamTestRecord[]; total: number }>;
}

export class FileResultsStorage implements IResultsStorage {
  private resultsDirectory: string;

  constructor() {
    this.resultsDirectory = path.join(process.cwd(), "exams", "results");
    this.ensureResultsDirectory();
  }

  private async ensureResultsDirectory() {
    try {
      await fs.access(this.resultsDirectory);
    } catch {
      await fs.mkdir(this.resultsDirectory, { recursive: true });
      console.log(`Created results directory at: ${this.resultsDirectory}`);
    }
  }

  async saveResult(record: Omit<ExamTestRecord, "id">): Promise<ExamTestRecord> {
    const id = randomUUID();
    const testRecord: ExamTestRecord = { ...record, id };

    try {
      const filePath = path.join(this.resultsDirectory, `${id}.json`);
      await fs.writeFile(filePath, JSON.stringify(testRecord, null, 2), 'utf-8');
      return testRecord;
    } catch (error) {
      console.error("Error saving result:", error);
      throw error;
    }
  }

  async getResults(page: number = 1, pageSize: number = 10): Promise<{ records: ExamTestRecord[]; total: number }> {
    try {
      const files = await fs.readdir(this.resultsDirectory);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      // Sort by timestamp descending (newest first)
      const records: ExamTestRecord[] = [];

      for (const file of jsonFiles) {
        try {
          const filePath = path.join(this.resultsDirectory, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const record = JSON.parse(content) as ExamTestRecord;
          records.push(record);
        } catch (error) {
          console.error(`Error reading result file ${file}:`, error);
        }
      }

      // Sort by timestamp descending
      records.sort((a, b) => b.timestamp - a.timestamp);

      // Paginate
      const total = records.length;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedRecords = records.slice(start, end);

      return { records: paginatedRecords, total };
    } catch (error) {
      console.error("Error reading results directory:", error);
      return { records: [], total: 0 };
    }
  }
}

export const resultsStorage = new FileResultsStorage();
