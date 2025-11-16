import { useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import type { Question, UserAnswer, DomainResult, QuestionResult } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

interface ResultsState {
  examId: string;
  examTitle: string;
  answers: UserAnswer[];
  questions: Question[];
}

export default function ResultsPage() {
  const [location, setLocation] = useLocation();
  const { language, t } = useLanguage();

  // Helper to extract text from bilingual objects or return string as-is
  const getText = (value: any): string => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && (value.en || value.ar)) {
      return value[language] || value.en || '';
    }
    return String(value || '');
  };

  const getDomainTranslation = (domain: any): string => {
    const domainText = getText(domain);
    const domainKey = domainText.toLowerCase();
    if (domainKey.includes('people')) return t('domain.people');
    if (domainKey.includes('process')) return t('domain.process');
    if (domainKey.includes('business')) return t('domain.business');
    return domainText;
  };
  
  const resultsData = useMemo(() => {
    const stored = sessionStorage.getItem('examResults');
    if (!stored) return null;
    
    try {
      const data = JSON.parse(stored) as any;
      
      // Normalize answers to handle legacy format (no 'type' field)
      if (data.answers && data.questions) {
        data.answers = data.answers.map((answer: any, index: number) => {
          const question = data.questions[index];
          
          // If answer already has type, use it
          if (answer.type) {
            return answer;
          }
          
          // Legacy format: convert based on question type
          if (question.type === "multiple" || question.correctAnswers !== undefined) {
            return {
              questionId: answer.questionId,
              type: "multiple" as const,
              selectedAnswers: answer.selectedAnswers || [],
              isMarked: answer.isMarked || false,
            };
          } else {
            return {
              questionId: answer.questionId,
              type: "single" as const,
              selectedAnswer: answer.selectedAnswer ?? null,
              isMarked: answer.isMarked || false,
            };
          }
        });
        
        // Normalize questions to ensure they have type field
        data.questions = data.questions.map((q: any) => {
          if (q.type) {
            return q;
          }
          
          if (q.correctAnswers !== undefined) {
            return { ...q, type: "multiple" };
          } else {
            return { ...q, type: "single" };
          }
        });
      }
      
      return data as ResultsState;
    } catch {
      return null;
    }
  }, [location]);

  const results = useMemo(() => {
    if (!resultsData) return null;

    const { examTitle, answers, questions } = resultsData;
    const examTitleText = getText(examTitle);
    
    let correctCount = 0;
    const domainStats = new Map<string, { correct: number; total: number }>();
    const questionResults: QuestionResult[] = [];

    questions.forEach((question, index) => {
      const userAnswer = answers[index];
      let isCorrect = false;
      
      // Check correctness based on question type
      if (question.type === "single" && userAnswer.type === "single") {
        isCorrect = userAnswer.selectedAnswer === question.correctAnswer;
      } else if (question.type === "multiple" && userAnswer.type === "multiple") {
        // All-or-nothing scoring: arrays must match exactly
        const sortedUserAnswers = [...userAnswer.selectedAnswers].sort();
        const sortedCorrectAnswers = [...question.correctAnswers].sort();
        isCorrect = 
          sortedUserAnswers.length === sortedCorrectAnswers.length &&
          sortedUserAnswers.every((val, idx) => val === sortedCorrectAnswers[idx]);
      }
      
      if (isCorrect) correctCount++;

      const domain = getText(question.domain);
      const stats = domainStats.get(domain) || { correct: 0, total: 0 };
      stats.total++;
      if (isCorrect) stats.correct++;
      domainStats.set(domain, stats);

      // Build question result based on type
      if (question.type === "single" && userAnswer.type === "single") {
        questionResults.push({
          type: "single" as const,
          questionId: question.id,
          question: getText(question.question),
          options: question.options.map(opt => getText(opt)),
          userAnswer: userAnswer.selectedAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          explanation: getText(question.explanation),
          domain: getText(question.domain),
        });
      } else if (question.type === "multiple" && userAnswer.type === "multiple") {
        questionResults.push({
          type: "multiple" as const,
          questionId: question.id,
          question: getText(question.question),
          options: question.options.map(opt => getText(opt)),
          userAnswers: userAnswer.selectedAnswers,
          correctAnswers: question.correctAnswers,
          isCorrect,
          explanation: getText(question.explanation),
          domain: getText(question.domain),
        });
      }
    });

    const domainResults: DomainResult[] = Array.from(domainStats.entries()).map(
      ([domain, stats]) => ({
        domain,
        correct: stats.correct,
        total: stats.total,
        percentage: Math.round((stats.correct / stats.total) * 100),
      })
    );

    const percentage = Math.round((correctCount / questions.length) * 100);
    const passed = percentage >= 61;

    return {
      examTitle: examTitleText,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      percentage,
      passed,
      domainResults,
      questionResults,
    };
  }, [resultsData, language, getText]);

  if (!results) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 sm:p-8 max-w-md w-full">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-10 sm:h-12 w-10 sm:w-12 mx-auto text-warning" />
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-semibold">{t('error.noResults')}</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                {t('error.completeExam')}
              </p>
            </div>
            <Button onClick={() => setLocation("/")} data-testid="button-back-home" className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('button.backHome')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
        <div className="mb-6 sm:mb-8 flex items-center justify-between gap-4" dir="ltr">
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('button.backHome')}
          </Button>
          <LanguageToggle />
        </div>

        <div className="space-y-6 sm:space-y-8">
          <Card className="overflow-hidden">
            <div className={`p-6 sm:p-8 md:p-12 text-center ${
              results.passed ? "bg-success/10" : "bg-destructive/10"
            }`}>
              <div className="space-y-3 sm:space-y-4">
                {results.passed ? (
                  <CheckCircle2 className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 mx-auto text-success" data-testid="icon-passed" />
                ) : (
                  <XCircle className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 mx-auto text-destructive" data-testid="icon-failed" />
                )}
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold px-4 sm:px-0" data-testid="text-exam-title">
                    {results.examTitle}
                  </h1>
                  <p className="text-4xl sm:text-5xl md:text-6xl font-bold" data-testid="text-score">
                    {results.percentage}%
                  </p>
                  <p className={`text-lg sm:text-xl font-semibold ${
                    results.passed ? "text-success" : "text-destructive"
                  }`} data-testid="text-status">
                    {results.passed ? t('results.passed') : t('results.failed')}
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground px-4 sm:px-0" data-testid="text-correct-count">
                    {results.correctAnswers} {t('results.outOf')} {results.totalQuestions} {t('results.questionsCorrect')}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">{t('results.performance')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {results.domainResults.map((domain) => (
                <Card key={domain.domain} data-testid={`card-domain-${domain.domain}`}>
                  <CardHeader>
                    <CardTitle className="text-lg">{getDomainTranslation(domain.domain)}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('results.score')}</span>
                        <span className="font-semibold" data-testid={`text-domain-score-${domain.domain}`}>
                          {domain.correct} / {domain.total}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            domain.percentage >= 61 ? "bg-success" : "bg-destructive"
                          }`}
                          style={{ width: `${domain.percentage}%` }}
                        />
                      </div>
                      <div className="text-right">
                        <span className={`text-xl sm:text-2xl font-bold ${
                          domain.percentage >= 61 ? "text-success" : "text-destructive"
                        }`} data-testid={`text-domain-percentage-${domain.domain}`}>
                          {domain.percentage}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">{t('results.review')}</h2>
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 sm:w-16">Q#</TableHead>
                      <TableHead className="min-w-[200px] sm:min-w-[300px]">{t('results.question')}</TableHead>
                      <TableHead className="w-24 sm:w-32">{t('results.yourAnswer')}</TableHead>
                      <TableHead className="w-24 sm:w-32">{t('results.correctAnswer')}</TableHead>
                      <TableHead className="w-16 sm:w-24">{t('results.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {results.questionResults.map((result, index) => (
                    <TableRow key={result.questionId} data-testid={`row-question-${result.questionId}`}>
                      <TableCell className="font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-3">
                          <p className="text-sm leading-relaxed">{result.question}</p>
                          {result.type === "multiple" && (
                            <Badge variant="outline" className="text-xs">{t('exam.multipleAnswer')}</Badge>
                          )}
                          <div className="space-y-1.5 text-xs">
                            {result.options.map((option, optIndex) => {
                              let isCorrect = false;
                              let isUserAnswer = false;
                              
                              if (result.type === "single") {
                                isCorrect = optIndex === result.correctAnswer;
                                isUserAnswer = optIndex === result.userAnswer;
                              } else {
                                isCorrect = result.correctAnswers.includes(optIndex);
                                isUserAnswer = result.userAnswers.includes(optIndex);
                              }
                              
                              return (
                                <div
                                  key={optIndex}
                                  className={`p-2 rounded ${
                                    isCorrect
                                      ? "bg-success/10 text-success-foreground font-medium"
                                      : isUserAnswer && !result.isCorrect
                                      ? "bg-destructive/10 text-destructive-foreground"
                                      : ""
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIndex)}. {option}
                                </div>
                              );
                            })}
                          </div>
                          <div className="pt-2 border-t border-border">
                            <p className="text-xs text-muted-foreground font-medium mb-1">
                              {t('results.explanation')}:
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {result.explanation}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {result.type === "single" ? (
                          result.userAnswer !== null ? (
                            <Badge variant={result.isCorrect ? "default" : "destructive"}>
                              {String.fromCharCode(65 + result.userAnswer)}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">{t('results.notAnswered')}</Badge>
                          )
                        ) : (
                          result.userAnswers.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {result.userAnswers.map((answerIndex) => (
                                <Badge key={answerIndex} variant={result.isCorrect ? "default" : "destructive"}>
                                  {String.fromCharCode(65 + answerIndex)}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <Badge variant="secondary">{t('results.notAnswered')}</Badge>
                          )
                        )}
                      </TableCell>
                      <TableCell>
                        {result.type === "single" ? (
                          <Badge variant="default" className="bg-success">
                            {String.fromCharCode(65 + result.correctAnswer)}
                          </Badge>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {result.correctAnswers.map((answerIndex) => (
                              <Badge key={answerIndex} variant="default" className="bg-success">
                                {String.fromCharCode(65 + answerIndex)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {result.isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-success" data-testid={`icon-correct-${result.questionId}`} />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive" data-testid={`icon-incorrect-${result.questionId}`} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
