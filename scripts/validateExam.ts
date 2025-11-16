import fs from 'fs';

const examData = JSON.parse(fs.readFileSync('exams/pmp-test-bank-180.json', 'utf-8'));

console.log('=== EXAM VALIDATION REPORT ===\n');
console.log(`Total Questions: ${examData.questions.length}\n`);

let singleAnswerA = 0;
let multiAnswerStandard = 0;
let artifactCount = 0;
const suspiciousQuestions: number[] = [];

examData.questions.forEach((q: any, idx: number) => {
  // Check for PDF artifacts in options
  q.options.forEach((opt: any) => {
    if (opt.en && (opt.en.includes('--') || opt.en.match(/\d+ of \d+/))) {
      artifactCount++;
      if (!suspiciousQuestions.includes(idx + 1)) {
        suspiciousQuestions.push(idx + 1);
      }
    }
  });
  
  // Count questions with default answers
  if (q.type === 'single' && q.correctAnswer === 0) {
    singleAnswerA++;
  }
  
  if (q.type === 'multiple' && q.correctAnswers && 
      q.correctAnswers.length === 2 && 
      q.correctAnswers[0] === 0 && q.correctAnswers[1] === 1) {
    multiAnswerStandard++;
  }
});

console.log(`Single-answer questions with answer = A: ${singleAnswerA} / ${examData.questions.filter((q: any) => q.type === 'single').length}`);
console.log(`  (Note: Some may be legitimately A, but high count suggests fallback was used)\n`);

console.log(`Multiple-answer questions with answers = [0,1]: ${multiAnswerStandard} / ${examData.questions.filter((q: any) => q.type === 'multiple').length}`);
console.log(`  (Note: Default pattern suggests extraction failure)\n`);

console.log(`Options with PDF artifacts (page numbers, etc.): ${artifactCount}`);
if (suspiciousQuestions.length > 0) {
  console.log(`Questions with artifacts: ${suspiciousQuestions.slice(0, 10).join(', ')}${suspiciousQuestions.length > 10 ? '...' : ''}\n`);
}

console.log(`\n⚠️  RECOMMENDATION:`);
console.log(`The high number of answer=A questions (${singleAnswerA}) suggests many used the fallback.`);
console.log(`You should manually review questions 1-163 (from PDF) to verify answer correctness.`);
console.log(`Questions 164-180 (manually added) should be reliable.`);
