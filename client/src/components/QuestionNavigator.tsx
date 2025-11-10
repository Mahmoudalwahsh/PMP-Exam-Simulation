import { X, CheckCircle, Circle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Question, UserAnswer } from "@shared/schema";

interface QuestionNavigatorProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  answers: UserAnswer[];
  currentIndex: number;
  onSelectQuestion: (index: number) => void;
}

export function QuestionNavigator({
  isOpen,
  onClose,
  questions,
  answers,
  currentIndex,
  onSelectQuestion,
}: QuestionNavigatorProps) {
  if (!isOpen) return null;

  const handleSelectQuestion = (index: number) => {
    onSelectQuestion(index);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-gray-900/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      data-testid="modal-navigator"
    >
      <div className="bg-card rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-card-border">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">Question Navigator</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close-navigator"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary"></div>
                <span className="text-muted-foreground">Current</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-muted-foreground">Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <Circle className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span className="text-muted-foreground">Marked</span>
              </div>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 sm:gap-3">
              {questions.map((_, index) => {
                const answer = answers[index];
                const isAnswered = answer.type === "single" 
                  ? answer.selectedAnswer !== null 
                  : answer.selectedAnswers.length > 0;
                const isMarked = answer.isMarked;
                const isCurrent = index === currentIndex;

                return (
                  <button
                    key={index}
                    onClick={() => handleSelectQuestion(index)}
                    className={`
                      relative aspect-square rounded-md border-2 font-semibold text-sm
                      transition-all hover-elevate
                      ${isCurrent 
                        ? "border-primary bg-primary text-primary-foreground" 
                        : isMarked
                        ? "border-warning bg-warning/10 text-warning-foreground"
                        : isAnswered
                        ? "border-success bg-success/10 text-success-foreground"
                        : "border-border bg-background"
                      }
                    `}
                    data-testid={`button-question-${index + 1}`}
                  >
                    <span className="absolute inset-0 flex items-center justify-center">
                      {index + 1}
                    </span>
                    {isMarked && !isCurrent && (
                      <AlertTriangle className="absolute top-1 right-1 h-3 w-3 text-warning" />
                    )}
                    {isAnswered && !isCurrent && !isMarked && (
                      <CheckCircle className="absolute top-1 right-1 h-3 w-3 text-success" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-card-border">
          <Button onClick={onClose} className="w-full" data-testid="button-close-navigator-bottom">
            Close Navigator
          </Button>
        </div>
      </div>
    </div>
  );
}
