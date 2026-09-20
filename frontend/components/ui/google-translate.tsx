"use client";

import React, { useEffect, useState, useRef } from "react";
import { Globe, ChevronDown, Check, Languages } from "lucide-react";

export interface LanguageOption {
  code: string;
  label: string;
  flag: string;
  native: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", flag: "🇺🇸", native: "English" },
  { code: "ta", label: "Tamil", flag: "🇮🇳", native: "தமிழ்" },
  { code: "hi", label: "Hindi", flag: "🇮🇳", native: "हिंदी" },
  { code: "te", label: "Telugu", flag: "🇮🇳", native: "తెలుగు" },
  { code: "ml", label: "Malayalam", flag: "🇮🇳", native: "മലയാളം" },
  { code: "kn", label: "Kannada", flag: "🇮🇳", native: "ಕನ್ನಡ" },
  { code: "es", label: "Spanish", flag: "🇪🇸", native: "Español" },
  { code: "fr", label: "French", flag: "🇫🇷", native: "Français" },
  { code: "de", label: "German", flag: "🇩🇪", native: "Deutsch" },
  { code: "ja", label: "Japanese", flag: "🇯🇵", native: "日本語" },
];

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

export function GoogleTranslateSelector() {
  const [currentLang, setCurrentLang] = useState<LanguageOption>(LANGUAGES[0]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Read existing googtrans cookie on mount
    const cookies = document.cookie.split(";");
    const transCookie = cookies.find((c) => c.trim().startsWith("googtrans="));
    if (transCookie) {
      const val = transCookie.split("=")[1];
      if (val) {
        const parts = val.split("/");
        const langCode = parts[parts.length - 1];
        const match = LANGUAGES.find((l) => l.code === langCode);
        if (match) setCurrentLang(match);
      }
    }

    // Initialize Google Translate Element Script if not loaded
    if (!document.getElementById("google-translate-script")) {
      window.googleTranslateElementInit = () => {
        if (window.google?.translate?.TranslateElement) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en",
              includedLanguages: LANGUAGES.map((l) => l.code).join(","),
              autoDisplay: false,
            },
            "google_translate_element"
          );
        }
      };

      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = (lang: LanguageOption) => {
    setCurrentLang(lang);
    setIsOpen(false);

    // Set Google Translate Cookie
    const domain = window.location.hostname;
    document.cookie = `googtrans=/en/${lang.code}; path=/; domain=${domain}`;
    document.cookie = `googtrans=/en/${lang.code}; path=/;`;

    // Try programmatically updating hidden google translate select if exists
    const select = document.querySelector(".goog-te-combo") as HTMLSelectElement;
    if (select) {
      select.value = lang.code;
      select.dispatchEvent(new Event("change"));
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Hidden container for Google Translate widget */}
      <div id="google_translate_element" className="hidden" />

      {/* Styled Language Selector Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-foreground/15 bg-background/60 backdrop-blur-md text-xs font-mono text-foreground hover:bg-foreground/10 transition-all shadow-sm"
        title="Change UI Language / மொழி மாற்றுக"
      >
        <Languages className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span className="text-[11px] font-semibold flex items-center gap-1">
          <span>{currentLang.flag}</span>
          <span>{currentLang.native}</span>
        </span>
        <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-foreground/15 bg-background/95 backdrop-blur-2xl p-1.5 shadow-2xl z-50 font-mono text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-150 max-h-72 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 border-b border-foreground/10 mb-1">
            <Globe className="w-3 h-3 text-indigo-500" />
            Select Language
          </div>

          {LANGUAGES.map((lang) => {
            const isSelected = currentLang.code === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors text-xs ${
                  isSelected
                    ? "bg-foreground text-background font-bold shadow-sm"
                    : "text-foreground hover:bg-foreground/8"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="text-sm">{lang.flag}</span>
                  <span className="truncate">{lang.native}</span>
                  <span className="text-[10px] opacity-60 font-sans">({lang.label})</span>
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
