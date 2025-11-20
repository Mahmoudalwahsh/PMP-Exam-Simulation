import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function TesterNamePage() {
  const [, params] = useRoute("/tester-name/:id");
  const [, navigate] = useLocation();
  const examId = params?.id || "";
  const [testerName, setTesterName] = useState("");
  const { language, t } = useLanguage();

  const handleContinue = () => {
    if (testerName.trim()) {
      sessionStorage.setItem(`testerName-${examId}`, testerName);
      navigate(`/exam/${examId}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && testerName.trim()) {
      handleContinue();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <Card className="p-8">
          <div className="mb-6 flex justify-end">
            <LanguageToggle />
          </div>
          
          <h1 className="text-2xl font-bold mb-2 text-foreground">
            {language === 'en' ? 'Enter Your Name' : 'أدخل اسمك'}
          </h1>
          <p className="text-secondary-foreground mb-6">
            {language === 'en'
              ? 'Please enter your name to proceed with the exam'
              : 'يرجى إدخال اسمك للمتابعة مع الامتحان'}
          </p>

          <div className="space-y-4">
            <Input
              data-testid="input-tester-name"
              type="text"
              value={testerName}
              onChange={(e) => setTesterName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={language === 'en' ? 'Your full name' : 'اسمك الكامل'}
              autoFocus
              className="text-base"
            />

            <Button
              data-testid="button-start-exam"
              onClick={handleContinue}
              disabled={!testerName.trim()}
              className="w-full"
            >
              {language === 'en' ? 'Start Exam' : 'ابدأ الامتحان'}
            </Button>

            <Button
              data-testid="button-back-selection"
              variant="outline"
              onClick={() => navigate("/")}
              className="w-full"
            >
              {language === 'en' ? 'Back' : 'العودة'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
