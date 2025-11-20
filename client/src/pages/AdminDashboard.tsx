import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ExamHistory } from "@/components/ExamHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ExamTestRecord } from "@shared/schema";

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [examTitle, setExamTitle] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const pageSize = 10;

  useEffect(() => {
    checkAuth();
  }, []);

  const { data: resultsData, isLoading: isLoadingResults, refetch: refetchResults } = useQuery<{
    records: ExamTestRecord[];
    total: number;
  }>({
    queryKey: ["/api/results", currentPage],
    queryFn: async () => {
      const res = await fetch(`/api/results?page=${currentPage}&pageSize=10`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch results");
      return res.json();
    },
    enabled: true,
  });

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/status", {
        credentials: "include",
      });
      const data = await response.json();

      if (!data.isAuthenticated) {
        navigate("/admin/login");
        return;
      }

      setUsername(data.username);
    } catch {
      navigate("/admin/login");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      navigate("/admin/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Logout failed",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv") && !file.name.endsWith(".json")) {
      toast({
        title: "Error",
        description: "Only CSV and JSON files are supported",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // Read file for preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setPreview(content.substring(0, 500));
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive",
      });
      return;
    }

    if (!examTitle) {
      toast({
        title: "Error",
        description: "Please enter exam title",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const fileContent = await selectedFile.text();

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fileName: selectedFile.name,
          content: fileContent,
          examData: {
            title: examTitle,
            description: examDescription,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: `Exam uploaded with ${result.questionCount} questions`,
      });

      setSelectedFile(null);
      setExamTitle("");
      setExamDescription("");
      setPreview("");
      setIsLoading(false);
      refetchResults();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Upload failed",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const downloadTemplate = (format: "csv" | "json") => {
    const fileName = format === "csv" ? "exam-template.csv" : "_template.json";
    const link = document.createElement("a");
    link.href = `/exams/templates/${fileName}`;
    link.download = fileName;
    link.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-secondary-foreground">
              Welcome, {username}
            </span>
            <Button
              data-testid="button-admin-logout"
              variant="outline"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3" data-testid="admin-tabs">
            <TabsTrigger value="upload" data-testid="tab-upload">Upload Exam</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">Exam History</TabsTrigger>
            <TabsTrigger value="instructions" data-testid="tab-instructions">Instructions</TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Upload New Exam</h2>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpload();
                }}
              >
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Exam Title *
                  </label>
                  <Input
                    data-testid="input-exam-title"
                    type="text"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="e.g., PMP Practice Exam"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <Input
                    data-testid="input-exam-description"
                    type="text"
                    value={examDescription}
                    onChange={(e) => setExamDescription(e.target.value)}
                    placeholder="Optional exam description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select File (CSV or JSON) *
                  </label>
                  <input
                    data-testid="input-file-upload"
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 border border-border rounded-md"
                    required
                  />
                </div>

                {preview && (
                  <div className="bg-muted p-4 rounded-lg border border-border">
                    <h4 className="font-semibold mb-2 text-sm">File Preview</h4>
                    <pre className="text-xs overflow-auto max-h-48 whitespace-pre-wrap break-words text-foreground">
                      {preview}...
                    </pre>
                  </div>
                )}

                <Button
                  data-testid="button-upload-exam"
                  type="submit"
                  disabled={isLoading || !selectedFile}
                  className="w-full"
                >
                  {isLoading ? "Uploading..." : "Upload Exam"}
                </Button>
              </form>

              <div className="mt-8 border-t pt-6">
                <h3 className="font-semibold text-foreground mb-4">Download Template</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    data-testid="button-download-csv-template"
                    variant="outline"
                    onClick={() => downloadTemplate("csv")}
                    className="flex-1"
                  >
                    Download CSV Template
                  </Button>
                  <Button
                    data-testid="button-download-json-template"
                    variant="outline"
                    onClick={() => downloadTemplate("json")}
                    className="flex-1"
                  >
                    Download JSON Template
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Exam Attempt History</h2>
              <ExamHistory
                records={resultsData?.records || []}
                total={resultsData?.total || 0}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                isLoading={isLoadingResults}
              />
            </Card>
          </TabsContent>

          {/* Instructions Tab */}
          <TabsContent value="instructions">
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-6">Upload Instructions</h2>
                
                <div className="space-y-6">
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold text-lg mb-3 text-foreground">CSV Format</h3>
                    <p className="text-foreground mb-3">
                      Upload a CSV file with the following columns (must be in this exact order):
                    </p>
                    <div className="bg-muted p-4 rounded-md text-sm border border-border mb-4">
                      <code className="text-foreground break-words block mb-3 font-mono">
                        id, type, question_en, question_ar, optionA_en, optionA_ar, optionB_en, optionB_ar, optionC_en, optionC_ar, optionD_en, optionD_ar, correctAnswer, correctAnswers, minSelections, maxSelections, explanation_en, explanation_ar, domain_en, domain_ar
                      </code>
                    </div>
                    <div className="space-y-3 text-sm text-foreground">
                      <div>
                        <p><strong>Column Descriptions:</strong></p>
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          <li><code>id</code>: Unique question number (e.g., 1, 2, 3)</li>
                          <li><code>type</code>: Either "single" for single-answer or "multiple" for multiple-answer questions</li>
                          <li><code>question_en / question_ar</code>: Question text in English and Arabic</li>
                          <li><code>optionA_en / optionA_ar, optionB_en / optionB_ar, optionC_en / optionC_ar, optionD_en / optionD_ar</code>: Answer options A through D in both languages</li>
                          <li><code>correctAnswer</code>: For single-answer questions, enter A, B, C, or D (leave blank for multiple-answer)</li>
                          <li><code>correctAnswers</code>: For multiple-answer questions, enter correct option letters separated by spaces (e.g., "A C" or "B D"). Leave blank for single-answer</li>
                          <li><code>minSelections</code>: Minimum number of answers to select (for multiple-answer questions only)</li>
                          <li><code>maxSelections</code>: Maximum number of answers to select (for multiple-answer questions only)</li>
                          <li><code>explanation_en / explanation_ar</code>: Detailed explanation of the correct answer in both languages</li>
                          <li><code>domain_en / domain_ar</code>: Knowledge domain/area in both languages (e.g., "People"/"الأفراد", "Process"/"العمليات", "Business Environment"/"بيئة الأعمال")</li>
                        </ul>
                      </div>
                    </div>
                    <Button
                      data-testid="button-download-csv-template-instructions"
                      variant="outline"
                      onClick={() => downloadTemplate("csv")}
                      className="mt-4"
                    >
                      Download CSV Template Example
                    </Button>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold text-lg mb-3 text-foreground">JSON Format</h3>
                    <p className="text-foreground mb-3">
                      Upload a JSON file with the following structure:
                    </p>
                    <div className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-64 border border-border mb-4">
                      <code className="text-foreground whitespace-pre-wrap font-mono">
{`{
  "id": "your-exam-id-here",
  "title": {
    "en": "Your Exam Title Here",
    "ar": "عنوان الامتحان هنا"
  },
  "description": {
    "en": "Brief description of your exam",
    "ar": "وصف موجز للامتحان"
  },
  "duration": 230,
  "questions": [
    {
      "id": 1,
      "type": "single",
      "question": {
        "en": "Question text in English?",
        "ar": "نص السؤال بالعربية؟"
      },
      "options": [
        { "en": "Option A", "ar": "الخيار أ" },
        { "en": "Option B", "ar": "الخيار ب" },
        { "en": "Option C", "ar": "الخيار ج" },
        { "en": "Option D", "ar": "الخيار د" }
      ],
      "correctAnswer": 1,
      "explanation": {
        "en": "Why this answer is correct",
        "ar": "لماذا هذه الإجابة صحيحة"
      },
      "domain": { "en": "Process", "ar": "العمليات" }
    }
  ]
}`}
                      </code>
                    </div>
                    <div className="space-y-3 text-sm text-foreground">
                      <div>
                        <p><strong>Key Points:</strong></p>
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          <li><code>type</code>: Use "single" for single-answer or "multiple" for multiple-answer questions</li>
                          <li><code>options</code>: Array of 4 option objects with bilingual text</li>
                          <li><code>correctAnswer</code>: For single-answer, use the 0-based index (0=first option, 1=second, etc.)</li>
                          <li><code>correctAnswers</code>: For multiple-answer, use array of indices like [0, 2] for first and third options</li>
                          <li><code>minSelections / maxSelections</code>: Only for multiple-answer questions, specifies valid selection range</li>
                          <li><code>duration</code>: Total exam duration in minutes (typically 230 for PMP)</li>
                          <li>All text fields (question, options, explanation, domain) must support both English and Arabic</li>
                        </ul>
                      </div>
                    </div>
                    <Button
                      data-testid="button-download-json-template-instructions"
                      variant="outline"
                      onClick={() => downloadTemplate("json")}
                      className="mt-4"
                    >
                      Download JSON Template Example
                    </Button>
                  </div>

                  <div className="bg-muted border border-border p-4 rounded-md">
                    <p className="text-sm text-foreground">
                      <strong>Getting Started:</strong> Download a template file above to see the correct format and structure. You can use it as a starting point for your exam.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-center">
          <Button
            data-testid="button-go-exams"
            variant="outline"
            onClick={() => navigate("/")}
          >
            Back to Exam Library
          </Button>
        </div> 
      </main>
    </div>
  );
}
