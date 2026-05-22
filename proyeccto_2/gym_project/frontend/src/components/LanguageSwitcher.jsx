import React, { useState, useRef, useEffect } from 'react';
import { useTranslation, LANGUAGES } from '../i18n/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { language, changeLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentLang = LANGUAGES.find(l => l.code === language);

  return (
    <div ref={ref} className="fixed bottom-6 left-6 z-[9999]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 rounded-full bg-white dark:bg-zinc-800 text-orange-500 shadow-2xl hover:scale-110 transition-all border-2 border-orange-500/30 flex items-center justify-center gap-2 group"
        title="Change Language"
      >
        <span className="text-lg">{currentLang?.flag}</span>
        <Globe size={20} className="group-hover:rotate-45 transition-transform" />
      </button>

      {isOpen && (
        <div className="absolute bottom-16 left-0 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden min-w-[180px] animate-fade-in">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { changeLanguage(lang.code); setIsOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                language === lang.code
                  ? 'bg-orange-500/10 text-orange-400 font-bold'
                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="text-sm">{lang.label}</span>
              {language === lang.code && <span className="ml-auto text-orange-500 text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
