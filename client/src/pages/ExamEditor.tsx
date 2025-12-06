import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { ArrowLeft, Save, Edit, Loader2, FileText, CheckCircle2 } from "lucide-react";
import type { Exam, Question, BilingualText } from "@shared/schema";

export default function ExamEditor() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingQuestionNumber, setEditingQuestionNumber] = useState<number>(0);
  const [questionForm, setQuestionForm] = useState<any>(null);
  const [examMetadata, setExamMetadata] = useState<{
    title: BilingualText;
    description: BilingualText;
    duration: number;
  } | null>(null);
  const [metadataChanged, setMetadataChanged] = useState(false);

  const { data: exam, isLoading } = useQuery<Exam>({
    queryKey: ["/api/exams", id],
    queryFn: async () => {
      const res = await fetch(`/api/exams/${id}`);
      if (!res.ok) throw new Error("Failed to fetch exam");
      return res.json();
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (exam && !examMetadata) {
      setExamMetadata({
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
      });
    }
  }, [exam]);

  const updateExamMutation = useMutation({
    mutationFn: async (updates: Partial<Exam>) => {
      const response = await fetch(`/api/admin/exams/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update exam");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Exam updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/exams", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      setMetadataChanged(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ questionId, updates }: { questionId: number; updates: any }) => {
      const response = await fetch(`/api/admin/exams/${id}/questions/${questionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update question");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/exams", id] });
      setEditingQuestion(null);
      setQuestionForm(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditQuestion = (question: Question, questionNumber: number) => {
    setEditingQuestion(question);
    setEditingQuestionNumber(questionNumber);
    setQuestionForm({
      ...question,
      question: { ...question.question },
      explanation: { ...question.explanation },
      domain: { ...question.domain },
      options: question.options.map(opt => ({ ...opt })),
    });
  };

  const handleSaveQuestion = () => {
    if (!questionForm || !editingQuestion) return;
    updateQuestionMutation.mutate({
      questionId: editingQuestion.id,
      updates: questionForm,
    });
  };

  const handleSaveMetadata = () => {
    if (!examMetadata) return;
    updateExamMutation.mutate(examMetadata);
  };

  const handleMetadataChange = (field: string, value: any) => {
    if (!examMetadata) return;
    setExamMetadata({ ...examMetadata, [field]: value });
    setMetadataChanged(true);
  };

  const handleBilingualChange = (
    field: "title" | "description",
    lang: "en" | "ar",
    value: string
  ) => {
    if (!examMetadata) return;
    setExamMetadata({
      ...examMetadata,
      [field]: { ...examMetadata[field], [lang]: value },
    });
    setMetadataChanged(true);
  };

  if (isLoading || !exam) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                data-testid="button-back-to-admin"
                variant="outline"
                size="icon"
                onClick={() => setLocation("/admin")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">Edit Exam</h1>
                <p className="text-sm text-muted-foreground">{exam.title.en}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="metadata" className="space-y-6">
          <TabsList>
            <TabsTrigger value="metadata" data-testid="tab-metadata">
              Exam Details
            </TabsTrigger>
            <TabsTrigger value="questions" data-testid="tab-questions">
              Questions ({exam.questions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metadata">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-6 text-foreground">Exam Details</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title (English)</Label>
                    <Input
                      data-testid="input-title-en"
                      value={examMetadata?.title.en || ""}
                      onChange={(e) => handleBilingualChange("title", "en", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Title (Arabic)</Label>
                    <Input
                      data-testid="input-title-ar"
                      dir="rtl"
                      value={examMetadata?.title.ar || ""}
                      onChange={(e) => handleBilingualChange("title", "ar", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Description (English)</Label>
                    <Textarea
                      data-testid="input-description-en"
                      value={examMetadata?.description.en || ""}
                      onChange={(e) => handleBilingualChange("description", "en", e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description (Arabic)</Label>
                    <Textarea
                      data-testid="input-description-ar"
                      dir="rtl"
                      value={examMetadata?.description.ar || ""}
                      onChange={(e) => handleBilingualChange("description", "ar", e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-2 max-w-xs">
                  <Label>Duration (minutes)</Label>
                  <Input
                    data-testid="input-duration"
                    type="number"
                    value={examMetadata?.duration || 0}
                    onChange={(e) => handleMetadataChange("duration", parseInt(e.target.value) || 0)}
                  />
                </div>

                <Button
                  data-testid="button-save-metadata"
                  onClick={handleSaveMetadata}
                  disabled={!metadataChanged || updateExamMutation.isPending}
                >
                  {updateExamMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="questions">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-6 text-foreground">Questions</h2>
              <div className="space-y-4">
                {exam.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    data-testid={`question-card-${question.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            Q{index + 1}
                          </Badge>
                          <Badge
                            variant={question.type === "single" ? "secondary" : "default"}
                            className="text-xs"
                          >
                            {question.type === "single" ? "Single Answer" : "Multiple Answers"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {question.domain.en}
                          </Badge>
                        </div>
                        <p className="text-foreground font-medium mb-2 line-clamp-2">
                          {question.question.en}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {question.options.map((opt, optIndex) => (
                            <span
                              key={optIndex}
                              className={`px-2 py-1 rounded ${
                                question.type === "single"
                                  ? question.correctAnswer === optIndex
                                    ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                    : "bg-muted"
                                  : question.correctAnswers?.includes(optIndex)
                                  ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                  : "bg-muted"
                              }`}
                            >
                              {String.fromCharCode(65 + optIndex)}: {opt.en.substring(0, 30)}
                              {opt.en.length > 30 && "..."}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Button
                        data-testid={`button-edit-question-${question.id}`}
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditQuestion(question, index + 1)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Question {editingQuestionNumber}</DialogTitle>
          </DialogHeader>
          
          {questionForm && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Question Type</Label>
                <Select
                  value={questionForm.type}
                  onValueChange={(value) => {
                    const newForm = { ...questionForm, type: value };
                    if (value === "single") {
                      delete newForm.correctAnswers;
                      delete newForm.minSelections;
                      delete newForm.maxSelections;
                      newForm.correctAnswer = 0;
                    } else {
                      delete newForm.correctAnswer;
                      newForm.correctAnswers = [0];
                      newForm.minSelections = 2;
                      newForm.maxSelections = 4;
                    }
                    setQuestionForm(newForm);
                  }}
                >
                  <SelectTrigger data-testid="select-question-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Answer</SelectItem>
                    <SelectItem value="multiple">Multiple Answers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Question (English)</Label>
                  <Textarea
                    data-testid="input-question-en"
                    value={questionForm.question.en}
                    onChange={(e) =>
                      setQuestionForm({
                        ...questionForm,
                        question: { ...questionForm.question, en: e.target.value },
                      })
                    }
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Question (Arabic)</Label>
                  <Textarea
                    data-testid="input-question-ar"
                    dir="rtl"
                    value={questionForm.question.ar}
                    onChange={(e) =>
                      setQuestionForm({
                        ...questionForm,
                        question: { ...questionForm.question, ar: e.target.value },
                      })
                    }
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Options</Label>
                {questionForm.options.map((opt: BilingualText, index: number) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{String.fromCharCode(65 + index)}</Badge>
                      {questionForm.type === "single" ? (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={questionForm.correctAnswer === index}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setQuestionForm({ ...questionForm, correctAnswer: index });
                              }
                            }}
                            data-testid={`checkbox-correct-${index}`}
                          />
                          <Label className="text-sm">Correct Answer</Label>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={questionForm.correctAnswers?.includes(index)}
                            onCheckedChange={(checked) => {
                              const newCorrectAnswers = checked
                                ? [...(questionForm.correctAnswers || []), index].sort()
                                : (questionForm.correctAnswers || []).filter((i: number) => i !== index);
                              setQuestionForm({
                                ...questionForm,
                                correctAnswers: newCorrectAnswers,
                              });
                            }}
                            data-testid={`checkbox-correct-${index}`}
                          />
                          <Label className="text-sm">Correct Answer</Label>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        data-testid={`input-option-${index}-en`}
                        placeholder="Option (English)"
                        value={opt.en}
                        onChange={(e) => {
                          const newOptions = [...questionForm.options];
                          newOptions[index] = { ...newOptions[index], en: e.target.value };
                          setQuestionForm({ ...questionForm, options: newOptions });
                        }}
                      />
                      <Input
                        data-testid={`input-option-${index}-ar`}
                        placeholder="Option (Arabic)"
                        dir="rtl"
                        value={opt.ar}
                        onChange={(e) => {
                          const newOptions = [...questionForm.options];
                          newOptions[index] = { ...newOptions[index], ar: e.target.value };
                          setQuestionForm({ ...questionForm, options: newOptions });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Explanation (English)</Label>
                  <Textarea
                    data-testid="input-explanation-en"
                    value={questionForm.explanation.en}
                    onChange={(e) =>
                      setQuestionForm({
                        ...questionForm,
                        explanation: { ...questionForm.explanation, en: e.target.value },
                      })
                    }
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Explanation (Arabic)</Label>
                  <Textarea
                    data-testid="input-explanation-ar"
                    dir="rtl"
                    value={questionForm.explanation.ar}
                    onChange={(e) =>
                      setQuestionForm({
                        ...questionForm,
                        explanation: { ...questionForm.explanation, ar: e.target.value },
                      })
                    }
                    rows={3}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Domain (English)</Label>
                  <Select
                    value={questionForm.domain.en}
                    onValueChange={(value) =>
                      setQuestionForm({
                        ...questionForm,
                        domain: {
                          en: value,
                          ar:
                            value === "People"
                              ? "الأفراد"
                              : value === "Process"
                              ? "العمليات"
                              : "بيئة الأعمال",
                        },
                      })
                    }
                  >
                    <SelectTrigger data-testid="select-domain">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="People">People</SelectItem>
                      <SelectItem value="Process">Process</SelectItem>
                      <SelectItem value="Business Environment">Business Environment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Domain (Arabic)</Label>
                  <Input
                    dir="rtl"
                    value={questionForm.domain.ar}
                    onChange={(e) =>
                      setQuestionForm({
                        ...questionForm,
                        domain: { ...questionForm.domain, ar: e.target.value },
                      })
                    }
                    disabled
                  />
                </div>
              </div>

              {questionForm.type === "multiple" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min Selections</Label>
                    <Input
                      type="number"
                      min={2}
                      max={4}
                      value={questionForm.minSelections || 2}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          minSelections: parseInt(e.target.value) || 2,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Selections</Label>
                    <Input
                      type="number"
                      min={2}
                      max={4}
                      value={questionForm.maxSelections || 4}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          maxSelections: parseInt(e.target.value) || 4,
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingQuestion(null)}>
              Cancel
            </Button>
            <Button
              data-testid="button-save-question"
              onClick={handleSaveQuestion}
              disabled={updateQuestionMutation.isPending}
            >
              {updateQuestionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Question
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
