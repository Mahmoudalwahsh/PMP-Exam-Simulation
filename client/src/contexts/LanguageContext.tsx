import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('pmp-language');
    return (saved === 'ar' || saved === 'en') ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('pmp-language', language);
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Translation dictionaries
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Exam Selection Page
    'app.title': 'PMP Exam Simulator',
    'app.subtitle': 'Professional certification exam preparation tool',
    'select.title': 'Select Your Exam',
    'select.choose': 'Choose an exam to begin your practice session',
    'exam.questions': 'questions',
    'exam.duration': 'Duration',
    'exam.minutes': 'minutes',
    'button.start': 'Start Exam',
    'loading': 'Loading...',
    'error.load': 'Failed to load exams. Please try again.',
    'error.noResults': 'No Results Found',
    'error.completeExam': 'Please complete an exam to view results.',
    
    // Exam Interface
    'exam.paused': 'Exam Paused',
    'exam.resume': 'Resume to continue your exam',
    'button.resume': 'Resume Exam',
    'exam.timeRemaining': 'Time Remaining',
    'exam.answered': 'Answered',
    'exam.question': 'Question',
    'exam.of': 'of',
    'exam.selectAnswer': 'Select your answer:',
    'exam.selectAnswers': 'Select your answers:',
    'exam.minSelections': 'Minimum selections',
    'exam.maxSelections': 'Maximum selections',
    'exam.multipleAnswer': 'Multiple Answer',
    'button.markReview': 'Mark for Review',
    'button.unmark': 'Unmark',
    'button.previous': 'Previous',
    'button.next': 'Next',
    'button.submit': 'Submit Exam',
    'button.pause': 'Pause',
    'button.backHome': 'Back to Home',
    
    // Question Navigator
    'nav.questionNavigator': 'Question Navigator',
    'nav.legend': 'Legend',
    'nav.answered': 'Answered',
    'nav.marked': 'Marked for Review',
    'nav.notAnswered': 'Not Answered',
    'button.close': 'Close',
    
    // Submit Confirmation
    'submit.confirm': 'Submit Exam?',
    'submit.warning': 'Are you sure you want to submit your exam? You have',
    'submit.unanswered': 'unanswered questions.',
    'submit.noReturn': 'You cannot return after submission.',
    'button.cancel': 'Cancel',
    'button.confirmSubmit': 'Submit',
    
    // Results Page
    'results.examResults': 'Exam Results',
    'results.score': 'Your Score',
    'results.totalQuestions': 'Total Questions',
    'results.correct': 'Correct',
    'results.incorrect': 'Incorrect',
    'results.passed': 'PASSED',
    'results.failed': 'FAILED',
    'results.outOf': 'out of',
    'results.questionsCorrect': 'questions correct',
    'results.performance': 'Performance by Domain',
    'results.review': 'Review Your Answers',
    'results.question': 'Question',
    'results.yourAnswer': 'Your Answer',
    'results.correctAnswer': 'Correct Answer',
    'results.status': 'Status',
    'results.domain': 'Domain',
    'results.notAnswered': 'Not Answered',
    'results.explanation': 'Explanation',
    'button.newExam': 'Take Another Exam',
    
    // Domains
    'domain.people': 'People',
    'domain.process': 'Process',
    'domain.business': 'Business Environment',
    
    // Language Toggle
    'language.switch': 'Switch to Arabic',
  },
  ar: {
    // Exam Selection Page
    'app.title': 'محاكي امتحان PMP',
    'app.subtitle': 'أداة التحضير لامتحان الشهادة المهنية',
    'select.title': 'اختر الامتحان',
    'select.choose': 'اختر امتحاناً لبدء جلسة الممارسة',
    'exam.questions': 'سؤال',
    'exam.duration': 'المدة',
    'exam.minutes': 'دقيقة',
    'button.start': 'بدء الامتحان',
    'loading': 'جاري التحميل...',
    'error.load': 'فشل تحميل الامتحانات. يرجى المحاولة مرة أخرى.',
    'error.noResults': 'لم يتم العثور على نتائج',
    'error.completeExam': 'يرجى إكمال امتحان لعرض النتائج.',
    
    // Exam Interface
    'exam.paused': 'الامتحان متوقف مؤقتاً',
    'exam.resume': 'استأنف لمتابعة الامتحان',
    'button.resume': 'استئناف الامتحان',
    'exam.timeRemaining': 'الوقت المتبقي',
    'exam.answered': 'تمت الإجابة',
    'exam.question': 'السؤال',
    'exam.of': 'من',
    'exam.selectAnswer': 'اختر إجابتك:',
    'exam.selectAnswers': 'اختر إجاباتك:',
    'exam.minSelections': 'الحد الأدنى من الاختيارات',
    'exam.maxSelections': 'الحد الأقصى من الاختيارات',
    'exam.multipleAnswer': 'إجابة متعددة',
    'button.markReview': 'تعليم للمراجعة',
    'button.unmark': 'إزالة التعليم',
    'button.previous': 'السابق',
    'button.next': 'التالي',
    'button.submit': 'تسليم الامتحان',
    'button.pause': 'إيقاف مؤقت',
    'button.backHome': 'العودة إلى الصفحة الرئيسية',
    
    // Question Navigator
    'nav.questionNavigator': 'متصفح الأسئلة',
    'nav.legend': 'مفتاح الرموز',
    'nav.answered': 'تمت الإجابة',
    'nav.marked': 'معلّم للمراجعة',
    'nav.notAnswered': 'لم تتم الإجابة',
    'button.close': 'إغلاق',
    
    // Submit Confirmation
    'submit.confirm': 'تسليم الامتحان؟',
    'submit.warning': 'هل أنت متأكد من رغبتك في تسليم الامتحان؟ لديك',
    'submit.unanswered': 'أسئلة لم تتم الإجابة عليها.',
    'submit.noReturn': 'لا يمكنك العودة بعد التسليم.',
    'button.cancel': 'إلغاء',
    'button.confirmSubmit': 'تسليم',
    
    // Results Page
    'results.examResults': 'نتائج الامتحان',
    'results.score': 'درجتك',
    'results.totalQuestions': 'مجموع الأسئلة',
    'results.correct': 'صحيحة',
    'results.incorrect': 'خاطئة',
    'results.passed': 'نجح',
    'results.failed': 'راسب',
    'results.outOf': 'من أصل',
    'results.questionsCorrect': 'سؤال صحيح',
    'results.performance': 'الأداء حسب المجال',
    'results.review': 'راجع إجاباتك',
    'results.question': 'السؤال',
    'results.yourAnswer': 'إجابتك',
    'results.correctAnswer': 'الإجابة الصحيحة',
    'results.status': 'الحالة',
    'results.domain': 'المجال',
    'results.notAnswered': 'لم تتم الإجابة',
    'results.explanation': 'الشرح',
    'button.newExam': 'إجراء امتحان آخر',
    
    // Domains
    'domain.people': 'الأفراد',
    'domain.process': 'العمليات',
    'domain.business': 'بيئة الأعمال',
    
    // Language Toggle
    'language.switch': 'التبديل إلى الإنجليزية',
  },
};
