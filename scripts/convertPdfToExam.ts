import fs from 'fs';
import OpenAI from 'openai';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY2,
});

interface ParsedQuestion {
  questionNumber: number;
  questionText: string;
  options: string[];
  correctAnswers: number[];
  explanation: string;
  isMultipleAnswer: boolean;
}

interface BilingualQuestion {
  id: number;
  type: 'single' | 'multiple';
  question: { en: string; ar: string };
  options: Array<{ en: string; ar: string }>;
  correctAnswer?: number;
  correctAnswers?: number[];
  minSelections?: number;
  maxSelections?: number;
  explanation: { en: string; ar: string };
  domain: { en: string; ar: string };
}

async function parsePdfText(filePath: string): Promise<ParsedQuestion[]> {
  // Read and parse PDF using PDFParse class
  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: dataBuffer });
  const result = await parser.getText();
  const content = result.text;
  await parser.destroy();
  
  const questions: ParsedQuestion[] = [];
  
  // Split by "Question [number]" or "Question number"
  const questionBlocks = content.split(/(?=Question \[?\d+\]?)/);
  
  for (const block of questionBlocks) {
    if (block.trim().length < 50) continue; // Skip tiny fragments
    
    // Extract question number
    const questionMatch = block.match(/Question \[?(\d+)\]?/);
    if (!questionMatch) continue;
    
    const questionNumber = parseInt(questionMatch[1]);
    
    // Check if it's a multiple-answer question
    const isMultipleAnswer = /\(Choose two\)/i.test(block) || /\(Select.*two\)/i.test(block);
    
    // Extract question text (everything before the options)
    const optionsStart = block.search(/^\s*a\)/m);
    if (optionsStart === -1) continue;
    
    const questionText = block
      .substring(questionMatch.index! + questionMatch[0].length, optionsStart)
      .trim()
      .replace(/\s+/g, ' ');
    
    // Find where explanation starts (before extracting options)
    const explanationMatch = block.match(/Explanation[^\n]*/i);
    const explanationStart = explanationMatch ? block.indexOf(explanationMatch[0]) : block.length;
    
    // Extract only the options section (between first option and explanation)
    const optionsSection = block.substring(optionsStart, explanationStart);
    const options: string[] = [];
    
    // Match options a) through e) - now limited to options section only
    const optionMatches = optionsSection.matchAll(/([a-e])\)\s*([^\n]+(?:\n(?!\s*[a-e]\)|Explanation)[^\n]+)*)/gi);
    for (const match of optionMatches) {
      let optionText = match[2].trim().replace(/\s+/g, ' ');
      
      // Remove any explanation text that might have leaked in
      optionText = optionText.split(/\s+Explanation/i)[0];
      optionText = optionText.split(/\s+The Correct Answer/i)[0];
      optionText = optionText.trim();
      
      if (optionText.length > 0) {
        options.push(optionText);
      }
    }
    
    if (options.length < 2) continue; // Need at least 2 options
    
    // Extract explanation and correct answers
    let explanation = '';
    const correctAnswers: number[] = [];
    
    if (explanationMatch) {
      // Get everything after "Explanation"
      explanation = block.substring(explanationStart + explanationMatch[0].length).trim();
      
      // Try to extract answer text that appears after "The correct answer is:"
      const answerTextMatch = explanation.match(/correct answer[s]?\s*(?:is|are)[:\s]*\n*([^\n]+)/i);
      if (answerTextMatch) {
        const answerText = answerTextMatch[1].trim().toLowerCase();
        
        // Try to match this text with options
        let bestMatch = -1;
        let bestMatchScore = 0;
        
        options.forEach((opt, idx) => {
          const optLower = opt.toLowerCase().trim();
          // Check if option text is contained in answer text or vice versa
          if (answerText.includes(optLower.substring(0, Math.min(50, optLower.length)))) {
            const score = optLower.length;
            if (score > bestMatchScore) {
              bestMatch = idx;
              bestMatchScore = score;
            }
          } else if (optLower.includes(answerText.substring(0, Math.min(50, answerText.length)))) {
            const score = answerText.length;
            if (score > bestMatchScore) {
              bestMatch = idx;
              bestMatchScore = score;
            }
          }
        });
        
        if (bestMatch >= 0) {
          correctAnswers.push(bestMatch);
        }
      }
      
      // Also try letter-based patterns as fallback
      if (correctAnswers.length === 0) {
        const answerPatterns = [
          /correct answer[s]?\s*(?:is|are)[:\s]*([a-e])/gi,
          /^([a-e])\)/gm,
          /option[s]?\s*([a-e])/gi,
          /([a-e])\s*[-–—]/g,
        ];
        
        const foundAnswers = new Set<number>();
        for (const pattern of answerPatterns) {
          const matches = explanation.matchAll(pattern);
          for (const match of matches) {
            const letter = match[1].toLowerCase();
            const index = letter.charCodeAt(0) - 'a'.charCodeAt(0);
            if (index >= 0 && index < options.length) {
              foundAnswers.add(index);
            }
          }
        }
        
        correctAnswers.push(...Array.from(foundAnswers).sort());
      }
    }
    
    // If we couldn't find correct answers, try to infer from the explanation text (for multiple-answer questions)
    if (correctAnswers.length === 0 && isMultipleAnswer) {
      // For multiple answer questions, try to find numbered answers
      const numberedAnswers = explanation.matchAll(/[12][-.)]\s*([^\n]+)/g);
      for (const match of numberedAnswers) {
        const answerText = match[1].toLowerCase().trim();
        // Try to match with options
        options.forEach((opt, idx) => {
          const optLower = opt.toLowerCase().trim();
          if (answerText.includes(optLower.substring(0, Math.min(30, optLower.length))) ||
              optLower.includes(answerText.substring(0, Math.min(30, answerText.length)))) {
            if (!correctAnswers.includes(idx)) {
              correctAnswers.push(idx);
            }
          }
        });
      }
    }
    
    // If still no answer found, use a more aggressive text matching approach
    if (correctAnswers.length === 0) {
      console.log(`   Question ${questionNumber}: Using aggressive text matching for answer extraction`);
      
      // Get first 100 chars of explanation (likely contains the answer)
      const explStart = explanation.substring(0, 200).toLowerCase();
      
      // Try to find which option text appears earliest/most in the explanation
      let bestMatch = -1;
      let bestScore = 0;
      
      options.forEach((opt, idx) => {
        const optWords = opt.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        let score = 0;
        
        // Count how many significant words from this option appear in explanation start
        optWords.forEach(word => {
          if (explStart.includes(word)) {
            score += word.length; // Longer words = better match
          }
        });
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = idx;
        }
      });
      
      if (bestMatch >= 0 && bestScore >= 10) { // Need reasonable confidence
        correctAnswers.push(bestMatch);
        console.log(`   → Matched option ${bestMatch} with confidence score ${bestScore}`);
      }
    }
    
    // Last resort: if still no answer and single-choice, default to first option
    if (correctAnswers.length === 0 && !isMultipleAnswer) {
      console.warn(`⚠️  Question ${questionNumber}: Using fallback (option A). Please review manually.`);
      correctAnswers.push(0);
    }
    
    // Skip only if multiple-answer and we couldn't find at least 2 answers
    if (isMultipleAnswer && correctAnswers.length < 2) {
      console.log(`   Skipping question ${questionNumber} - multiple-answer but found < 2 answers`);
      continue;
    }
    
    // Limit to 4 options max (trim extras)
    const limitedOptions = options.slice(0, 4);
    const validCorrectAnswers = correctAnswers.filter(idx => idx < 4);
    
    if (validCorrectAnswers.length === 0) {
      console.log(`   Skipping question ${questionNumber} - correct answer outside of first 4 options`);
      continue;
    }
    
    questions.push({
      questionNumber,
      questionText,
      options: limitedOptions,
      correctAnswers: validCorrectAnswers,
      explanation,
      isMultipleAnswer: isMultipleAnswer || validCorrectAnswers.length > 1,
    });
  }
  
  return questions;
}

async function translateToArabic(text: string): Promise<string> {
  // Placeholder translation - will be added later when OpenAI credits are available
  return `[AR] ${text}`;
}

async function classifyDomain(questionText: string): Promise<{ en: string; ar: string }> {
  // Use keyword-based classification (free, no API needed)
  const text = questionText.toLowerCase();
  
  // People domain keywords
  const peopleKeywords = [
    'team', 'stakeholder', 'leadership', 'conflict', 'communication',
    'motivation', 'engagement', 'relationship', 'collaboration', 'culture',
    'emotional intelligence', 'coaching', 'mentoring', 'trust', 'influence',
    'negotiation', 'servant leader', 'team member', 'sponsor', 'customer'
  ];
  
  // Business Environment keywords
  const businessKeywords = [
    'business', 'strategy', 'benefit', 'value', 'roi', 'compliance',
    'regulatory', 'governance', 'portfolio', 'program', 'strategic',
    'business case', 'organizational', 'change management', 'transformation'
  ];
  
  // Process domain keywords
  const processKeywords = [
    'schedule', 'budget', 'scope', 'quality', 'risk', 'procurement',
    'integration', 'planning', 'execution', 'monitoring', 'controlling',
    'deliverable', 'milestone', 'baseline', 'change control', 'wbs',
    'critical path', 'earned value', 'variance', 'requirements'
  ];
  
  // Count keyword matches
  let peopleScore = 0;
  let businessScore = 0;
  let processScore = 0;
  
  peopleKeywords.forEach(keyword => {
    if (text.includes(keyword)) peopleScore++;
  });
  
  businessKeywords.forEach(keyword => {
    if (text.includes(keyword)) businessScore++;
  });
  
  processKeywords.forEach(keyword => {
    if (text.includes(keyword)) processScore++;
  });
  
  // Determine domain based on highest score
  if (peopleScore > businessScore && peopleScore > processScore) {
    return { en: 'People', ar: 'الأفراد' };
  } else if (businessScore > peopleScore && businessScore > processScore) {
    return { en: 'Business Environment', ar: 'بيئة الأعمال' };
  } else {
    return { en: 'Process', ar: 'العمليات' };
  }
}

async function convertToExam(pdfPath: string, outputPath: string) {
  console.log('Step 1: Parsing PDF...');
  const parsedQuestions = await parsePdfText(pdfPath);
  console.log(`Found ${parsedQuestions.length} questions`);
  
  console.log('\nStep 2: Translating and classifying questions...');
  const bilingualQuestions: BilingualQuestion[] = [];
  
  for (let i = 0; i < parsedQuestions.length; i++) {
    const q = parsedQuestions[i];
    console.log(`Processing question ${i + 1}/${parsedQuestions.length}...`);
    
    // Translate question, options, and explanation
    const [questionAr, explanationAr, ...optionsAr] = await Promise.all([
      translateToArabic(q.questionText),
      translateToArabic(q.explanation),
      ...q.options.map(opt => translateToArabic(opt)),
    ]);
    
    // Classify domain
    const domain = await classifyDomain(q.questionText);
    
    const bilingualQ: BilingualQuestion = {
      id: i + 1,
      type: q.isMultipleAnswer ? 'multiple' : 'single',
      question: {
        en: q.questionText,
        ar: questionAr,
      },
      options: q.options.map((opt, idx) => ({
        en: opt,
        ar: optionsAr[idx],
      })),
      explanation: {
        en: q.explanation,
        ar: explanationAr,
      },
      domain,
    };
    
    if (q.isMultipleAnswer) {
      bilingualQ.correctAnswers = q.correctAnswers.length >= 2 ? q.correctAnswers : [0, 1];
      bilingualQ.minSelections = 2;
      bilingualQ.maxSelections = q.options.length;
    } else {
      bilingualQ.correctAnswer = q.correctAnswers[0] || 0;
    }
    
    bilingualQuestions.push(bilingualQ);
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\nStep 3: Generating exam JSON...');
  const exam = {
    id: 'pmp-test-bank-180',
    title: {
      en: 'PMP Test Bank - 180 Questions',
      ar: 'بنك أسئلة PMP - 180 سؤالاً',
    },
    description: {
      en: 'Comprehensive PMP practice exam with 180 questions covering People, Process, and Business Environment domains.',
      ar: 'امتحان تدريبي شامل لـ PMP مع 180 سؤالاً يغطي مجالات الأفراد والعمليات وبيئة الأعمال.',
    },
    duration: 230,
    totalQuestions: bilingualQuestions.length,
    questions: bilingualQuestions,
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(exam, null, 2), 'utf-8');
  console.log(`\n✅ Exam saved to: ${outputPath}`);
  console.log(`Total questions: ${bilingualQuestions.length}`);
  
  // Summary
  const singleCount = bilingualQuestions.filter(q => q.type === 'single').length;
  const multipleCount = bilingualQuestions.filter(q => q.type === 'multiple').length;
  const domainCounts = bilingualQuestions.reduce((acc, q) => {
    acc[q.domain.en] = (acc[q.domain.en] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log(`\nSummary:`);
  console.log(`  Single-answer: ${singleCount}`);
  console.log(`  Multiple-answer: ${multipleCount}`);
  console.log(`\nDomain distribution:`);
  Object.entries(domainCounts).forEach(([domain, count]) => {
    const pct = ((count / bilingualQuestions.length) * 100).toFixed(1);
    console.log(`  ${domain}: ${count} (${pct}%)`);
  });
}

// Run the conversion
const pdfPath = 'attached_assets/PMP Questions-2_1763276583279.pdf';
const outputPath = 'exams/pmp-test-bank-180.json';

convertToExam(pdfPath, outputPath).catch(console.error);
