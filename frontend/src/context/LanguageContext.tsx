import React, { createContext, useContext } from 'react';

export type Language = 'en';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string, defaultEn?: string) => string;
}

const defaultContext: LanguageContextType = {
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
  t: (_key: string, defaultEn?: string) => defaultEn || _key,
};

const LanguageContext = createContext<LanguageContextType>(defaultContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <LanguageContext.Provider value={defaultContext}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  return useContext(LanguageContext) || defaultContext;
}
