import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAccess } from "@/contexts/AccessContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { LogIn } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import patronsLogo from "@assets/Patrons_Logo_Website_3AOIUWA_1762765779728.png";

export default function AccessCodePage() {
  const [code, setCode] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setAccess } = useAccess();
  const { language, t } = useLanguage();

  const verifyMutation = useMutation({
    mutationFn: async (accessCode: string) => {
      const response = await apiRequest("POST", "/api/site-access/verify", { code: accessCode });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.valid) {
        setAccess(true);
        toast({
          title: language === "en" ? "Access Granted" : "تم منح الوصول",
          description: language === "en" ? "Welcome to the PMP Exam Simulator" : "مرحباً بك في محاكي امتحان PMP",
        });
        setTimeout(() => {
          setLocation("/");
        }, 100);
      } else {
        toast({
          title: language === "en" ? "Invalid Code" : "رمز غير صالح",
          description: language === "en" ? "Please check your access code and try again" : "يرجى التحقق من رمز الوصول والمحاولة مرة أخرى",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: language === "en" ? "Error" : "خطأ",
        description: language === "en" ? "Failed to verify access code" : "فشل في التحقق من رمز الوصول",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      verifyMutation.mutate(code.trim());
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center items-center gap-4 mb-6" dir="ltr">
          <img 
            src={patronsLogo} 
            alt="Patrons Consulting" 
            className="h-24 sm:h-32 md:h-40 w-auto"
            data-testid="img-patrons-logo"
          />
          <LanguageToggle />
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {language === "en" ? "PMP Exam Simulator" : "محاكي امتحان PMP"}
            </CardTitle>
            <CardDescription>
              {language === "en" 
                ? "Enter your access code to continue" 
                : "أدخل رمز الوصول للمتابعة"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder={language === "en" ? "Enter access code" : "أدخل رمز الوصول"}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="text-center text-lg tracking-widest"
                  autoFocus
                  dir={language === "ar" ? "rtl" : "ltr"}
                  data-testid="input-access-code"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!code.trim() || verifyMutation.isPending}
                data-testid="button-verify-code"
              >
                {verifyMutation.isPending ? (
                  language === "en" ? "Verifying..." : "جاري التحقق..."
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    {language === "en" ? "Enter" : "دخول"}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {language === "en" 
                  ? "Don't have an access code? Contact your instructor." 
                  : "ليس لديك رمز وصول؟ تواصل مع مدربك."}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/admin/login")}
            className="text-muted-foreground underline"
            data-testid="link-admin-login"
          >
            {language === "en" ? "Admin Login" : "تسجيل دخول المسؤول"}
          </Button>
        </div>
      </div>
    </div>
  );
}
