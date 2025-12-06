import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Edit, Trash2, Eye, EyeOff, FileText, Clock, Loader2 } from "lucide-react";
import type { ExamListItem } from "@shared/schema";

interface ExamLibraryProps {
  onEditExam: (examId: string) => void;
}

export function ExamLibrary({ onEditExam }: ExamLibraryProps) {
  const { toast } = useToast();
  const [deleteExamId, setDeleteExamId] = useState<string | null>(null);
  const [deleteExamTitle, setDeleteExamTitle] = useState<string>("");

  const { data: exams, isLoading } = useQuery<ExamListItem[]>({
    queryKey: ["/api/admin/exams"],
    queryFn: async () => {
      const response = await fetch("/api/admin/exams", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch exams");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (examId: string) => {
      const response = await fetch(`/api/admin/exams/${examId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete exam");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Exam deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      setDeleteExamId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const visibilityMutation = useMutation({
    mutationFn: async (examId: string) => {
      const response = await fetch(`/api/admin/exams/${examId}/visibility`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to toggle visibility");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (examId: string, examTitle: string) => {
    setDeleteExamId(examId);
    setDeleteExamTitle(examTitle);
  };

  const confirmDelete = () => {
    if (deleteExamId) {
      deleteMutation.mutate(deleteExamId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!exams || exams.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Exams Found</h3>
        <p className="text-muted-foreground">
          Upload an exam using the Upload tab to get started.
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[35%]">Title</TableHead>
              <TableHead className="text-center">Questions</TableHead>
              <TableHead className="text-center">Duration</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.map((exam) => (
              <TableRow key={exam.id} data-testid={`row-exam-${exam.id}`} className={exam.hidden ? "opacity-60" : ""}>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{exam.title.en}</p>
                    {exam.title.ar && exam.title.ar !== exam.title.en && (
                      <p className="text-sm text-muted-foreground" dir="rtl">
                        {exam.title.ar}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      ID: {exam.id}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1 text-foreground">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{exam.questionCount}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1 text-foreground">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{exam.duration} min</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant={exam.hidden ? "secondary" : "default"}
                    className="text-xs"
                  >
                    {exam.hidden ? "Hidden" : "Visible"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      data-testid={`button-visibility-exam-${exam.id}`}
                      variant="outline"
                      size="icon"
                      onClick={() => visibilityMutation.mutate(exam.id)}
                      disabled={visibilityMutation.isPending}
                      title={exam.hidden ? "Show Exam" : "Hide Exam"}
                    >
                      {exam.hidden ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      data-testid={`button-edit-exam-${exam.id}`}
                      variant="outline"
                      size="icon"
                      onClick={() => onEditExam(exam.id)}
                      title="Edit Exam"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      data-testid={`button-delete-exam-${exam.id}`}
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteClick(exam.id, exam.title.en)}
                      title="Delete Exam"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteExamId} onOpenChange={() => setDeleteExamId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteExamTitle}"? This action cannot be undone.
              All questions in this exam will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete"
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
