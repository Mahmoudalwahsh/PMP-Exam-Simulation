import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Pause, 
  Play,
  Grid3x3,
  X,
  AlertTriangle,
  Check
} from "lucide-react";
import type { Exam, UserAnswer } from "@shared/schema";
import { PauseModal } from "@/components/PauseModal";
import { QuestionNavigator } from "@/components/QuestionNavigator";
import { SubmitConfirmDialog } from "@/components/SubmitConfirmDialog";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatTime } from "@/lib/utils";
import patronsLogo from "@assets/Patrons_Logo_Website_3AOIUWA_1762765779728.png";

export default function ExamInterface() {
  const [, params] = useRoute("/exam/:id");
  const [, setLocation] = useLocation();
  const examId = params?.id || "";
  const { language, t } = useLanguage();

  const { data: exam, isLoading } = useQuery<Exam>({
    queryKey: ["/api/exams", examId],
    enabled: !!examId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize exam state only once
  useEffect(() => {
    if (exam && !isInitialized) {
      // Try to restore progress from sessionStorage
      const savedProgress = sessionStorage.getItem(`examProgress-${examId}`);
      
      if (savedProgress) {
        try {
          const progress = JSON.parse(savedProgress);
          
          // Normalize answers to handle legacy format (no 'type' field)
          const normalizedAnswers = progress.answers.map((answer: any, index: number) => {
            const question = exam.questions[index];
            
            // If answer already has type, use it
            if (answer.type) {
              return answer;
            }
            
            // Legacy format: convert to new format based on question type
            if (question.type === "multiple") {
              return {
                questionId: answer.questionId,
                type: "multiple" as const,
                selectedAnswers: [],
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
          
          setAnswers(normalizedAnswers);
          setTimeRemaining(progress.timeRemaining);
          setCurrentQuestionIndex(progress.currentQuestionIndex);
          setIsPaused(progress.isPaused);
        } catch {
          // If restore fails, start fresh
          setTimeRemaining(exam.duration * 60);
          setAnswers(
            exam.questions.map((q) => {
              if (q.type === "multiple") {
                return {
                  questionId: q.id,
                  type: "multiple" as const,
                  selectedAnswers: [],
                  isMarked: false,
                };
              } else {
                return {
                  questionId: q.id,
                  type: "single" as const,
                  selectedAnswer: null,
                  isMarked: false,
                };
              }
            })
          );
        }
      } else {
        // Fresh start
        setTimeRemaining(exam.duration * 60);
        setAnswers(
          exam.questions.map((q) => {
            if (q.type === "multiple") {
              return {
                questionId: q.id,
                type: "multiple" as const,
                selectedAnswers: [],
                isMarked: false,
              };
            } else {
              return {
                questionId: q.id,
                type: "single" as const,
                selectedAnswer: null,
                isMarked: false,
              };
            }
          })
        );
      }
      
      setIsInitialized(true);
    }
  }, [exam, examId, isInitialized]);

  // Auto-save progress to sessionStorage
  useEffect(() => {
    if (isInitialized && exam) {
      const progress = {
        answers,
        timeRemaining,
        currentQuestionIndex,
        isPaused,
      };
      sessionStorage.setItem(`examProgress-${examId}`, JSON.stringify(progress));
    }
  }, [answers, timeRemaining, currentQuestionIndex, isPaused, examId, isInitialized, exam]);

  useEffect(() => {
    if (!isPaused && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isPaused, timeRemaining]);

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    const currentAnswer = newAnswers[currentQuestionIndex];
    
    if (currentAnswer.type === "single") {
      newAnswers[currentQuestionIndex] = {
        ...currentAnswer,
        selectedAnswer: answerIndex,
      };
    }
    setAnswers(newAnswers);
  };

  const handleMultipleAnswerToggle = (answerIndex: number) => {
    const newAnswers = [...answers];
    const currentAnswer = newAnswers[currentQuestionIndex];
    
    if (currentAnswer.type === "multiple") {
      const selectedAnswers = [...currentAnswer.selectedAnswers];
      const indexInSelected = selectedAnswers.indexOf(answerIndex);
      
      if (indexInSelected > -1) {
        selectedAnswers.splice(indexInSelected, 1);
      } else {
        selectedAnswers.push(answerIndex);
      }
      
      newAnswers[currentQuestionIndex] = {
        ...currentAnswer,
        selectedAnswers: selectedAnswers.sort(),
      };
    }
    setAnswers(newAnswers);
  };

  const handleMarkForReview = (checked: boolean) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      ...newAnswers[currentQuestionIndex],
      isMarked: checked,
    };
    setAnswers(newAnswers);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (exam && currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmitExam = async () => {
    if (!exam) return;
    
    const testerName = sessionStorage.getItem(`testerName-${examId}`) || "Anonymous";
    
    // Calculate results
    const domainResults = exam.questions.reduce((acc: any, question) => {
      const answer = answers.find(a => a.questionId === question.id);
      let isCorrect = false;
      
      if (question.type === "single") {
        const singleAnswer = answer as any;
        isCorrect = singleAnswer?.selectedAnswer === question.correctAnswer;
      } else {
        const multiAnswer = answer as any;
        isCorrect = 
          multiAnswer?.selectedAnswers &&
          multiAnswer.selectedAnswers.length === question.correctAnswers.length &&
          multiAnswer.selectedAnswers.every((a: number) => question.correctAnswers.includes(a));
      }
      
      const domainText = typeof question.domain === 'string' ? question.domain : question.domain.en;
      const existingDomain = acc.find((d: any) => d.domain === domainText);
      
      if (existingDomain) {
        existingDomain.total++;
        if (isCorrect) existingDomain.correct++;
      } else {
        acc.push({
          domain: domainText,
          correct: isCorrect ? 1 : 0,
          total: 1,
          percentage: 0,
        });
      }
      return acc;
    }, []);
    
    domainResults.forEach((d: any) => {
      d.percentage = (d.correct / d.total) * 100;
    });
    
    const correctAnswers = domainResults.reduce((sum: number, d: any) => sum + d.correct, 0);
    const percentage = (correctAnswers / exam.questions.length) * 100;
    
    // Save to backend
    try {
      await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          testerName,
          examId: exam.id,
          examTitle: typeof exam.title === 'string' ? exam.title : exam.title.en,
          score: correctAnswers,
          percentage,
          totalQuestions: exam.questions.length,
          timestamp: Date.now(),
          domainResults,
        }),
      });
    } catch (error) {
      console.error("Error saving result:", error);
    }
    
    const results = {
      examId: exam.id,
      examTitle: exam.title,
      answers,
      questions: exam.questions,
      testerName,
    };
    
    // Store results in sessionStorage for the results page
    sessionStorage.setItem('examResults', JSON.stringify(results));
    // Clear exam progress since it's now submitted
    sessionStorage.removeItem(`examProgress-${examId}`);
    sessionStorage.removeItem(`testerName-${examId}`);
    setLocation(`/results`);
  };

  if (isLoading || !exam || !isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];
  const answeredCount = answers.filter((a) => {
    if (a.type === "single") {
      return a.selectedAnswer !== null;
    } else {
      return a.selectedAnswers.length > 0;
    }
  }).length;
  const markedCount = answers.filter((a) => a.isMarked).length;

  const timeColor = 
    timeRemaining < 600 ? "text-destructive" : 
    timeRemaining < 1800 ? "text-warning" : 
    "text-foreground";

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 bg-card border-b border-card-border px-4 sm:px-6 md:px-8 py-3 sm:py-4" dir="ltr">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-6">
                <img 
                  src={patronsLogo} 
                  alt="Patrons Consulting" 
                  className="h-8 sm:h-10 md:h-12 w-auto"
                  data-testid="img-patrons-logo-header"
                />
                <div className="flex items-center gap-2">
                  <Clock className={`h-4 sm:h-5 w-4 sm:w-5 ${timeColor}`} />
                  <span 
                    className={`text-xl sm:text-2xl font-bold tabular-nums ${timeColor}`}
                    data-testid="text-timer"
                  >
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsPaused(!isPaused)}
                  data-testid="button-pause"
                  className="sm:hidden"
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 min-w-0">
                <h1 className="text-xs font-medium truncate max-w-[65%] sm:flex-1 sm:text-base sm:font-semibold sm:text-center sm:max-w-none" data-testid="text-exam-title">
                  {typeof exam.title === 'string' ? exam.title : exam.title[language]}
                </h1>
                <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap" data-testid="text-progress">
                  {answeredCount} / {exam.questions.length}
                </span>
                <LanguageToggle />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsPaused(!isPaused)}
                  data-testid="button-pause-desktop"
                  className="hidden sm:flex flex-shrink-0"
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
            <Card className="p-4 sm:p-6 md:p-8">
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <div className="bg-primary text-primary-foreground px-2.5 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-semibold uppercase tracking-wider">
                      {t('exam.question')} {currentQuestionIndex + 1}
                    </div>
                    {currentAnswer?.isMarked && (
                      <div className="bg-warning text-warning-foreground px-2.5 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium flex items-center gap-1.5">
                        <AlertTriangle className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                        {t('nav.marked')}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNavigator(true)}
                    data-testid="button-show-navigator"
                    className="self-start"
                  >
                    <Grid3x3 className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">{t('nav.questionNavigator')}</span>
                    <span className="sm:hidden">{t('exam.questions')}</span>
                  </Button>
                </div>

                <div className="prose max-w-none">
                  <p className="text-base sm:text-lg leading-relaxed text-foreground" data-testid="text-question">
                    {typeof currentQuestion.question === 'string' ? currentQuestion.question : currentQuestion.question[language]}
                  </p>
                  {currentQuestion.type === "multiple" && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                      {t('exam.selectAnswers')}
                    </p>
                  )}
                </div>

                <div className="space-y-2 sm:space-y-3 mt-6 sm:mt-8">
                  {currentQuestion.type === "single" ? (
                    currentQuestion.options.map((option, index) => {
                      const isSelected = currentAnswer.type === "single" && currentAnswer.selectedAnswer === index;
                      const optionText = typeof option === 'string' ? option : option[language];
                      return (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(index)}
                          className={`w-full p-3 sm:p-4 border rounded-lg transition-all hover-elevate ${
                            isSelected ? "border-primary bg-primary/5" : "border-border"
                          }`}
                          data-testid={`button-option-${index}`}
                        >
                          <div className="flex items-start gap-2.5 sm:gap-3" dir="ltr">
                            <div className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                              isSelected ? "border-primary bg-primary" : "border-border"
                            }`}>
                              {isSelected && (
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary-foreground"></div>
                              )}
                            </div>
                            <span className="flex-1 text-sm sm:text-base leading-relaxed" dir="auto">{optionText}</span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    currentQuestion.options.map((option, index) => {
                      const isSelected = currentAnswer.type === "multiple" && currentAnswer.selectedAnswers.includes(index);
                      const optionText = typeof option === 'string' ? option : option[language];
                      return (
                        <button
                          key={index}
                          onClick={() => handleMultipleAnswerToggle(index)}
                          className={`w-full p-3 sm:p-4 border rounded-lg transition-all hover-elevate ${
                            isSelected ? "border-primary bg-primary/5" : "border-border"
                          }`}
                          data-testid={`button-option-${index}`}
                        >
                          <div className="flex items-start gap-2.5 sm:gap-3" dir="ltr">
                            <div className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 flex items-center justify-center mt-0.5 ${
                              isSelected ? "border-primary bg-primary" : "border-border"
                            }`}>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
                              )}
                            </div>
                            <span className="flex-1 text-sm sm:text-base leading-relaxed" dir="auto">{optionText}</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <Checkbox
                    id="mark-review"
                    checked={currentAnswer?.isMarked || false}
                    onCheckedChange={handleMarkForReview}
                    data-testid="checkbox-mark-review"
                  />
                  <Label htmlFor="mark-review" className="text-sm cursor-pointer">
                    {t('button.markReview')}
                  </Label>
                </div>
              </div>
            </Card>
          </div>
        </main>

        <footer className="sticky bottom-0 z-50 bg-card border-t border-card-border px-4 sm:px-6 md:px-8 py-3 sm:py-4" dir="ltr">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-4 order-2 sm:order-1">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  data-testid="button-previous"
                  className="flex-1 sm:flex-none"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  {t('button.previous')}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNext}
                  disabled={currentQuestionIndex === exam.questions.length - 1}
                  data-testid="button-next"
                  className="flex-1 sm:flex-none"
                >
                  {t('button.next')}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 order-1 sm:order-2">
                {markedCount > 0 && (
                  <span className="text-xs sm:text-sm text-muted-foreground text-center">
                    {markedCount} {t('button.markReview')}
                  </span>
                )}
                <Button
                  variant="destructive"
                  onClick={() => setShowSubmitDialog(true)}
                  data-testid="button-submit"
                  className="w-full sm:w-auto"
                >
                  {t('button.submit')}
                </Button>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <PauseModal isOpen={isPaused} onResume={() => setIsPaused(false)} />
      
      <QuestionNavigator
        isOpen={showNavigator}
        onClose={() => setShowNavigator(false)}
        questions={exam.questions}
        answers={answers}
        currentIndex={currentQuestionIndex}
        onSelectQuestion={setCurrentQuestionIndex}
      />

      <SubmitConfirmDialog
        isOpen={showSubmitDialog}
        onClose={() => setShowSubmitDialog(false)}
        onConfirm={handleSubmitExam}
        answeredCount={answeredCount}
        totalQuestions={exam.questions.length}
      />
    </>
  );
}
