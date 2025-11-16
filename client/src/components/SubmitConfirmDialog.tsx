import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface SubmitConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  answeredCount: number;
  totalQuestions: number;
}

export function SubmitConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  answeredCount,
  totalQuestions,
}: SubmitConfirmDialogProps) {
  const { t } = useLanguage();
  
  if (!isOpen) return null;

  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-gray-900/90 backdrop-blur-sm flex items-center justify-center p-6"
      data-testid="modal-submit-confirm"
    >
      <div className="bg-card rounded-lg shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-card-border">
          <h2 className="text-2xl font-semibold">{t('submit.confirm')}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close-submit-dialog"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <div className="space-y-2">
              <p className="text-base leading-relaxed">
                {t('submit.warning')}
              </p>
              {unansweredCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-warning">{unansweredCount}</span> {t('submit.unanswered')}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {t('submit.noReturn')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-card-border">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            data-testid="button-cancel-submit"
          >
            {t('button.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="flex-1"
            data-testid="button-confirm-submit"
          >
            {t('button.confirmSubmit')}
          </Button>
        </div>
      </div>
    </div>
  );
}
