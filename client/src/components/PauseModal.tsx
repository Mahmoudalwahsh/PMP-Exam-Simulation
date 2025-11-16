import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
}

export function PauseModal({ isOpen, onResume }: PauseModalProps) {
  const { t } = useLanguage();
  
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-gray-900/90 backdrop-blur-sm flex items-center justify-center p-4"
      data-testid="modal-pause"
    >
      <div className="bg-card p-6 sm:p-8 md:p-12 rounded-lg shadow-2xl max-w-md w-full text-center space-y-6 sm:space-y-8">
        <div className="space-y-3 sm:space-y-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Play className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">{t('exam.paused')}</h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg px-2 sm:px-0">
            {t('exam.resume')}
          </p>
        </div>
        <Button
          size="lg"
          onClick={onResume}
          className="w-full text-sm sm:text-base"
          data-testid="button-resume"
        >
          <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          {t('button.resume')}
        </Button>
      </div>
    </div>
  );
}
