import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
}

export function PauseModal({ isOpen, onResume }: PauseModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-gray-900/90 backdrop-blur-sm flex items-center justify-center"
      data-testid="modal-pause"
    >
      <div className="bg-card p-12 rounded-lg shadow-2xl max-w-md w-full mx-4 text-center space-y-8">
        <div className="space-y-4">
          <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Play className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold">Exam Paused</h2>
          <p className="text-muted-foreground text-lg">
            The timer has been paused. Click resume when you're ready to continue.
          </p>
        </div>
        <Button
          size="lg"
          onClick={onResume}
          className="w-full text-base"
          data-testid="button-resume"
        >
          <Play className="h-5 w-5 mr-2" />
          Resume Exam
        </Button>
      </div>
    </div>
  );
}
