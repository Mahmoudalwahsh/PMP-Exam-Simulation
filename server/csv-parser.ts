import { Question, BilingualText, Exam } from "@shared/schema";
import { CSVQuestion } from "@shared/admin-schema";

function toBilingual(text: string, ar?: string): BilingualText {
  return {
    en: text,
    ar: ar || `[AR] ${text}`,
  };
}

function parseCorrectAnswer(answer: string | undefined): number | null {
  if (!answer) return null;
  const normalized = answer.toUpperCase().trim();
  if (normalized === "A") return 0;
  if (normalized === "B") return 1;
  if (normalized === "C") return 2;
  if (normalized === "D") return 3;
  return null;
}

function parseAnswerList(answers: string | undefined): number[] {
  if (!answers) return [];
  const normalized = answers
    .toUpperCase()
    .trim()
    .split(/[\s,;|]+/)
    .filter((x) => x);
  const parsed: number[] = [];
  for (const ans of normalized) {
    if (ans === "A") parsed.push(0);
    else if (ans === "B") parsed.push(1);
    else if (ans === "C") parsed.push(2);
    else if (ans === "D") parsed.push(3);
  }
  return parsed;
}

export function csvToQuestion(
  row: Record<string, string>,
  questionId: number
): Question | null {
  try {
    const type = (
      (row.type as string) || "single"
    ).toLowerCase() as "single" | "multiple";

    // Support both bilingual (question_en/question_ar) and single language (question) formats
    const question = row.question_en
      ? toBilingual(row.question_en, row.question_ar)
      : toBilingual(row.question);
    
    const options = [
      row.optiona_en ? toBilingual(row.optiona_en, row.optiona_ar) : toBilingual(row.optiona || "Option A"),
      row.optionb_en ? toBilingual(row.optionb_en, row.optionb_ar) : toBilingual(row.optionb || "Option B"),
      row.optionc_en ? toBilingual(row.optionc_en, row.optionc_ar) : toBilingual(row.optionc || "Option C"),
      row.optiond_en ? toBilingual(row.optiond_en, row.optiond_ar) : toBilingual(row.optiond || "Option D"),
    ];
    
    const explanation = row.explanation_en
      ? toBilingual(row.explanation_en, row.explanation_ar)
      : toBilingual(row.explanation || "See explanation");
    
    const domain = row.domain_en
      ? toBilingual(row.domain_en, row.domain_ar)
      : toBilingual(row.domain || "General");

    if (type === "single") {
      const correctAnswer = parseCorrectAnswer(row.correctanswer);
      if (correctAnswer === null) {
        console.warn(
          `Question ${questionId}: Invalid single answer, defaulting to A`
        );
        return {
          id: questionId,
          type: "single",
          question,
          options,
          correctAnswer: 0,
          explanation,
          domain,
        };
      }

      return {
        id: questionId,
        type: "single",
        question,
        options,
        correctAnswer,
        explanation,
        domain,
      };
    } else {
      const correctAnswers = parseAnswerList(row.correctanswers);
      if (correctAnswers.length < 2) {
        console.warn(
          `Question ${questionId}: Multiple-answer needs at least 2 answers`
        );
        return null;
      }

      return {
        id: questionId,
        type: "multiple",
        question,
        options,
        correctAnswers,
        minSelections: parseInt(String(row.minselections || 2)),
        maxSelections: parseInt(String(row.maxselections || 4)),
        explanation,
        domain,
      };
    }
  } catch (error) {
    console.error(`Error parsing question ${questionId}:`, error);
    return null;
  }
}

export function csvToExam(
  csvRows: Record<string, string>[],
  examId: string,
  title: string,
  description?: string
): Exam {
  const questions: Question[] = [];

  for (let i = 0; i < csvRows.length; i++) {
    const row = csvRows[i];
    // Skip rows that have neither question nor question_en
    if (!row.question && !row.question_en) continue;

    const question = csvToQuestion(row, i + 1);
    if (question) {
      questions.push(question);
    }
  }

  return {
    id: examId,
    title: toBilingual(title),
    description: toBilingual(description || `Exam with ${questions.length} questions`),
    duration: 230, // Default PMP exam duration
    questions,
  };
}

export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  // Parse CSV properly handling quoted values with commas
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    rows.push(row);
  }

  return rows;
}
