import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'ta';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string, defaultEn?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Top Bar & Navigation
    dashboard: 'Dashboard',
    profile: 'My Profile',
    internships: 'Explore Internships',
    applications: 'My Applications',
    skills: 'Skill Gap & Readiness',
    mockInterview: 'AI Mock Interview',
    uploadCV: 'Upload & Analyze CV',
    guideTour: 'Interactive Tour',
    signOut: 'Sign out',
    aiOnline: 'PathFinder AI Engine Online',

    // Dashboard Cards
    profileCompleted: 'Profile Completed',
    submittedApps: 'Submitted Applications',
    shortlistedCandidates: 'Shortlisted Status',
    topAIFit: 'Career Readiness Score',
    recommendedInternships: 'AI Recommended Internships',
    browseAll: 'Browse All Openings',

    // Traffic Light Status
    readyHigh: 'Highly Qualified to Apply',
    readyMid: 'Almost Ready - Minor Skill Gap',
    readyLow: 'Training Recommended',

    // Tour Steps
    tourStep1Title: 'Upload Your CV / Resume',
    tourStep1Desc: 'Start here! Upload your resume in PDF or Word format. Our AI will automatically identify your skills.',
    tourStep2Title: 'Check Your Profile Readiness',
    tourStep2Desc: 'View your real-time career readiness traffic-light score and matched skill breakdown.',
    tourStep3Title: 'Practice with AI Mock Interview',
    tourStep3Desc: 'Take an AI-powered mock interview with instant speech-to-text feedback and model answers.',
    tourNext: 'Next',
    tourBack: 'Back',
    tourFinish: 'Got It!',
    tourSkip: 'Skip Tour',

    // CV Upload
    dragDropTitle: 'Drag & Drop your CV / Resume here',
    dragDropSubtitle: 'Supports PDF, Word (.docx), and TXT documents up to 5MB',
    browseFiles: 'or Browse Files from Device',
    dropActive: 'Drop your resume file here to start scanning!',
    scanningWithNLP: 'Extracting skills using Apache Tika NLP engine...',
  },
  ta: {
    // Top Bar & Navigation
    dashboard: 'முகப்பு பலகை',
    profile: 'எனது சுயவிவரம்',
    internships: 'பயிற்சி வாய்ப்புகள்',
    applications: 'எனது விண்ணப்பங்கள்',
    skills: 'திறன் இடைவெளி & தயார்நிலை',
    mockInterview: 'AI நேர்காணல் பயிற்சி',
    uploadCV: 'CV-ஐ பதிவேற்றவும்',
    guideTour: 'வழிகாட்டி சுற்றுலா',
    signOut: 'வெளியேறு',
    aiOnline: 'PathFinder AI இயந்திரம் இயங்குகிறது',

    // Dashboard Cards
    profileCompleted: 'சுயவிவர நிறைவு',
    submittedApps: 'சமர்ப்பிக்கப்பட்டவை',
    shortlistedCandidates: 'தேர்வு நிலை',
    topAIFit: 'பணி தயார்நிலை சதவீதம்',
    recommendedInternships: 'உங்களுக்கான பரிந்துரைகள்',
    browseAll: 'அனைத்து வாய்ப்புகளையும் காண்க',

    // Traffic Light Status
    readyHigh: '100% தயார்! (விண்ணப்பிக்கலாம்)',
    readyMid: '1 Skill தேவை (கிட்டத்தட்ட தயார்)',
    readyLow: 'கூடுதல் பயிற்சி தேவை',

    // Tour Steps
    tourStep1Title: 'இங்கு உங்கள் CV-ஐ பதிவேற்றவும்',
    tourStep1Desc: 'முதலில் உங்கள் ரெஸ்யூமை (PDF/Word) பதிவேற்றுங்கள். எங்கள் AI உங்கள் திறன்களை தானாகவே கண்டறியும்.',
    tourStep2Title: 'உங்கள் தயார்நிலை சதவீதத்தைப் பார்க்கவும்',
    tourStep2Desc: 'நிறுவனங்களின் தேவைக்கு ஏற்ப உங்கள் தகுதி நிலையையும் வண்ணக் குறியீட்டையும் இங்கே சரிபார்க்கவும்.',
    tourStep3Title: 'AI நேர்காணல் பயிற்சியைத் தொடங்கவும்',
    tourStep3Desc: 'நேர்காணல் கேள்விகளுக்கு குரல் அல்லது தட்டச்சு மூலம் பதிலளித்து உடனடி மதிப்பீட்டைப் பெறுங்கள்.',
    tourNext: 'அடுத்தது',
    tourBack: 'முந்தையது',
    tourFinish: 'முடிந்தது!',
    tourSkip: 'தவிர்க்க',

    // CV Upload
    dragDropTitle: 'உங்கள் CV கோப்பை இங்கே இழுத்து விடவும்',
    dragDropSubtitle: 'PDF, Word (.docx), அல்லது TXT ஆவணங்கள் (அதிகபட்சம் 5MB)',
    browseFiles: 'அல்லது கணினியிலிருந்து தேர்ந்தெடுக்கவும்',
    dropActive: 'ஆவணத்தை இங்கே விடுங்கள்!',
    scanningWithNLP: 'Apache Tika AI மூலம் திறன்கள் கண்டறியப்படுகின்றன...',
  },
};

const LANG_KEY = 'pathfinder_lang';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem(LANG_KEY);
    return saved === 'ta' || saved === 'en' ? saved : 'en';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem(LANG_KEY, newLang);
  };

  const toggleLang = () => {
    setLang(lang === 'en' ? 'ta' : 'en');
  };

  const t = (key: string, defaultEn?: string): string => {
    return translations[lang]?.[key] || translations.en[key] || defaultEn || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
