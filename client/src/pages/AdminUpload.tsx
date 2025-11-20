import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function AdminUpload() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [examTitle, setExamTitle] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/status", {
        credentials: "include",
      });
      const data = await response.json();

      if (!data.isAuthenticated) {
        navigate("/admin/login");
      }
    } catch {
      navigate("/admin/login");
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
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;

        try {
          const response = await fetch("/api/admin/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              fileName: selectedFile.name,
              content,
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

          setTimeout(() => navigate("/admin"), 1000);
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
      reader.readAsText(selectedFile);
    } catch (error) {
      toast({
        title: "Error",
        description: "Upload failed",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button
            data-testid="button-back-admin"
            variant="ghost"
            onClick={() => navigate("/admin")}
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold mt-4">Upload Exam</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6">
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
                    className="w-full"
                    required
                  />
                </div>

                <Button
                  data-testid="button-upload-exam"
                  type="submit"
                  disabled={isLoading || !selectedFile}
                  className="w-full"
                >
                  {isLoading ? "Uploading..." : "Upload Exam"}
                </Button>
              </form>
            </Card>
          </div>

          {preview && (
            <div className="lg:col-span-1">
              <Card className="p-6">
                <h3 className="font-semibold mb-3">File Preview</h3>
                <pre className="text-xs bg-secondary p-3 rounded overflow-auto max-h-96 whitespace-pre-wrap break-words">
                  {preview}...
                </pre>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
