import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardDescription, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, FileText, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import type { ExamListItem } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import patronsLogo from "@assets/Patrons_Logo_Website_3AOIUWA_1762765779728.png";

export default function ExamSelection() {
  const [, setLocation] = useLocation();
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const { language, t } = useLanguage();
  
  const { data: exams, isLoading } = useQuery<ExamListItem[]>({
    queryKey: ["/api/exams"],
  });

  const handleStartExam = () => {
    if (selectedExamId) {
      setLocation(`/tester-name/${selectedExamId}`);
    }
  };

  const selectedExam = exams?.find(exam => exam.id === selectedExamId);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="absolute top-4 right-4">
        <Button
          data-testid="button-admin-access"
          variant="outline"
          size="sm"
          onClick={() => setLocation("/admin/login")}
        >
          {language === 'en' ? 'Admin' : 'إدارة'}
        </Button>
      </div>
      <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="mb-6 sm:mb-12 text-center space-y-4 sm:space-y-6">
          <div className="flex justify-center items-center gap-4" dir="ltr">
            <img 
              src={patronsLogo} 
              alt="Patrons Consulting" 
              className="h-16 sm:h-20 md:h-24 w-auto"
              data-testid="img-patrons-logo"
            />
            <LanguageToggle />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-foreground">
              {t('app.title')}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed px-2 sm:px-0">
              {t('app.subtitle')}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loading-spinner" />
          </div>
        ) : exams && exams.length > 0 ? (
          <Card className="p-4 sm:p-6 md:p-8">
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2 sm:space-y-3">
                <label className="text-sm font-medium text-foreground">
                  {t('select.title')}
                </label>
                <Select 
                  value={selectedExamId} 
                  onValueChange={setSelectedExamId}
                >
                  <SelectTrigger 
                    className="w-full" 
                    data-testid="select-exam"
                  >
                    <SelectValue placeholder={t('select.choose')} />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((exam) => (
                      <SelectItem 
                        key={exam.id} 
                        value={exam.id}
                        data-testid={`select-option-${exam.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="font-medium">{exam.title[language]}</span>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <span>{exam.questionCount} {t('exam.questions')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{exam.duration} {t('exam.minutes')}</span>
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedExam && (
                <div className="bg-muted/50 border border-border rounded-md p-4 sm:p-6">
                  <div className="space-y-2 sm:space-y-3">
                    <h3 className="font-semibold text-base sm:text-lg text-foreground">
                      {selectedExam.title[language]}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedExam.description[language]}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-foreground pt-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span data-testid="text-selected-question-count">
                          {selectedExam.questionCount} {t('exam.questions')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span data-testid="text-selected-duration">
                          {selectedExam.duration} {t('exam.minutes')}
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
                {t('button.start')}
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-6 sm:p-8 md:p-12">
            <div className="text-center space-y-4">
              <FileText className="h-10 sm:h-12 w-10 sm:w-12 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-semibold">{t('error.load')}</h3>
                <p className="text-sm sm:text-base text-muted-foreground px-2 sm:px-0">
                  {t('error.load')}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
