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

interface ResultsState {
  examId: string;
  examTitle: string;
  answers: UserAnswer[];
  questions: Question[];
}

export default function ResultsPage() {
  const [location, setLocation] = useLocation();
  
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

      const domain = question.domain;
      const stats = domainStats.get(domain) || { correct: 0, total: 0 };
      stats.total++;
      if (isCorrect) stats.correct++;
      domainStats.set(domain, stats);

      // Build question result based on type
      if (question.type === "single" && userAnswer.type === "single") {
        questionResults.push({
          type: "single" as const,
          questionId: question.id,
          question: question.question,
          options: question.options,
          userAnswer: userAnswer.selectedAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          explanation: question.explanation,
          domain: question.domain,
        });
      } else if (question.type === "multiple" && userAnswer.type === "multiple") {
        questionResults.push({
          type: "multiple" as const,
          questionId: question.id,
          question: question.question,
          options: question.options,
          userAnswers: userAnswer.selectedAnswers,
          correctAnswers: question.correctAnswers,
          isCorrect,
          explanation: question.explanation,
          domain: question.domain,
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
      examTitle,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      percentage,
      passed,
      domainResults,
      questionResults,
    };
  }, [resultsData]);

  if (!results) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-warning" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">No Results Found</h2>
              <p className="text-muted-foreground">
                Please complete an exam to view results.
              </p>
            </div>
            <Button onClick={() => setLocation("/")} data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Exams
          </Button>
        </div>

        <div className="space-y-8">
          <Card className="overflow-hidden">
            <div className={`p-12 text-center ${
              results.passed ? "bg-success/10" : "bg-destructive/10"
            }`}>
              <div className="space-y-4">
                {results.passed ? (
                  <CheckCircle2 className="h-16 w-16 mx-auto text-success" data-testid="icon-passed" />
                ) : (
                  <XCircle className="h-16 w-16 mx-auto text-destructive" data-testid="icon-failed" />
                )}
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold" data-testid="text-exam-title">
                    {results.examTitle}
                  </h1>
                  <p className="text-6xl font-bold" data-testid="text-score">
                    {results.percentage}%
                  </p>
                  <p className={`text-xl font-semibold ${
                    results.passed ? "text-success" : "text-destructive"
                  }`} data-testid="text-status">
                    {results.passed ? "PASSED" : "FAILED"}
                  </p>
                  <p className="text-muted-foreground" data-testid="text-correct-count">
                    {results.correctAnswers} out of {results.totalQuestions} questions correct
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div>
            <h2 className="text-2xl font-semibold mb-6">Performance by Domain</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.domainResults.map((domain) => (
                <Card key={domain.domain} data-testid={`card-domain-${domain.domain}`}>
                  <CardHeader>
                    <CardTitle className="text-lg">{domain.domain}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Score</span>
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
                        <span className={`text-2xl font-bold ${
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
            <h2 className="text-2xl font-semibold mb-6">Detailed Answer Review</h2>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Q#</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead className="w-32">Your Answer</TableHead>
                    <TableHead className="w-32">Correct Answer</TableHead>
                    <TableHead className="w-24">Result</TableHead>
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
                            <Badge variant="outline" className="text-xs">Multiple Answer</Badge>
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
                              Explanation:
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
                            <Badge variant="secondary">Not Answered</Badge>
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
                            <Badge variant="secondary">Not Answered</Badge>
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
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
