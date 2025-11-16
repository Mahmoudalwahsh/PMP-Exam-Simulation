import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      data-testid="button-language-toggle"
      className="gap-2"
    >
      <Languages className="h-4 w-4" />
      <span className="hidden sm:inline">{t('language.switch')}</span>
      <span className="text-xs font-medium">{language === 'en' ? 'ع' : 'EN'}</span>
    </Button>
  );
}
