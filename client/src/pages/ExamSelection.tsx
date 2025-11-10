import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardDescription, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, FileText, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import type { ExamListItem } from "@shared/schema";
import patronsLogo from "@assets/Patrons_Logo_Website_3AOIUWA_1762765779728.png";

export default function ExamSelection() {
  const [, setLocation] = useLocation();
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  
  const { data: exams, isLoading } = useQuery<ExamListItem[]>({
    queryKey: ["/api/exams"],
  });

  const handleStartExam = () => {
    if (selectedExamId) {
      setLocation(`/exam/${selectedExamId}`);
    }
  };

  const selectedExam = exams?.find(exam => exam.id === selectedExamId);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto px-6 py-12">
        <div className="mb-12 text-center space-y-6">
          <div className="flex justify-center">
            <img 
              src={patronsLogo} 
              alt="Patrons Consulting" 
              className="h-16 w-auto"
              data-testid="img-patrons-logo"
            />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-4 text-foreground">
              PMP Exam Simulator
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Practice for your Project Management Professional certification with realistic exam simulations
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loading-spinner" />
          </div>
        ) : exams && exams.length > 0 ? (
          <Card className="p-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Select an Exam
                </label>
                <Select 
                  value={selectedExamId} 
                  onValueChange={setSelectedExamId}
                >
                  <SelectTrigger 
                    className="w-full" 
                    data-testid="select-exam"
                  >
                    <SelectValue placeholder="Choose an exam to begin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((exam) => (
                      <SelectItem 
                        key={exam.id} 
                        value={exam.id}
                        data-testid={`select-option-${exam.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="font-medium">{exam.title}</span>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <span>{exam.questionCount} Questions</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{exam.duration} Min</span>
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedExam && (
                <div className="bg-muted/50 border border-border rounded-md p-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg text-foreground">
                      {selectedExam.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedExam.description}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-foreground pt-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span data-testid="text-selected-question-count">
                          {selectedExam.questionCount} Questions
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span data-testid="text-selected-duration">
                          {selectedExam.duration} Minutes
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleStartExam}
                disabled={!selectedExamId}
                className="w-full"
                size="lg"
                data-testid="button-start-exam"
              >
                Start Exam
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">No Exams Available</h3>
                <p className="text-muted-foreground">
                  No exam files were found. Please add exam JSON files to the exams folder.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
